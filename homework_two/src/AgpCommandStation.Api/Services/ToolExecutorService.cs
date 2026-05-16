using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace AgpCommandStation.Api.Services;

public interface IToolExecutorService
{
    Task<string> ExecuteAsync(string toolName, JsonElement input, ToolContext ctx, string? gitHubPat, CancellationToken ct);
}

public class ToolExecutorService : IToolExecutorService
{
    private readonly IHttpClientFactory _httpClientFactory;

    public ToolExecutorService(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    public async Task<string> ExecuteAsync(string toolName, JsonElement input, ToolContext ctx, string? gitHubPat, CancellationToken ct)
    {
        return toolName switch
        {
            "search_code"           => await SearchCodeAsync(input, ctx, gitHubPat, ct),
            "get_file"              => await GetFileAsync(input, ctx, gitHubPat, ct),
            "list_directory"        => await ListDirectoryAsync(input, ctx, gitHubPat, ct),
            "search_emails"         => await SearchEmailsAsync(input, ctx, ct),
            "get_email_thread"      => await GetEmailThreadAsync(input, ctx, ct),
            "search_teams_messages" => await SearchTeamsMessagesAsync(input, ctx, ct),
            "get_channel_messages"  => await GetChannelMessagesAsync(input, ctx, ct),
            _                       => $"Unknown tool: {toolName}"
        };
    }

    // ── Code tools ────────────────────────────────────────────────────────────

    private async Task<string> SearchCodeAsync(JsonElement input, ToolContext ctx, string? gitHubPat, CancellationToken ct)
    {
        var query = input.TryGetProperty("query", out var q) ? q.GetString() ?? "" : "";
        var repo  = input.TryGetProperty("repo",  out var r) ? r.GetString() ?? "" : "";

        var results = new List<object>();

        // ADO code search
        if ((repo == "" || repo == "ado") && ctx.DevOpsToken is not null && ctx.DevOpsOrg is not null)
        {
            try
            {
                var client = AdoClient(ctx.DevOpsToken);
                var url = $"https://almsearch.dev.azure.com/{Uri.EscapeDataString(ctx.DevOpsOrg)}/_apis/search/codesearchresults?api-version=7.0";
                var body = JsonSerializer.Serialize(new Dictionary<string, object?>
                {
                    ["searchText"] = query,
                    ["$top"] = 5,
                    ["filters"] = ctx.DevOpsProject is not null
                        ? (object)new { Project = new[] { ctx.DevOpsProject } }
                        : null
                });
                using var req = new HttpRequestMessage(HttpMethod.Post, url)
                {
                    Content = new StringContent(body, Encoding.UTF8, "application/json")
                };
                using var resp = await client.SendAsync(req, ct);
                if (resp.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
                    foreach (var hit in doc.RootElement.GetProperty("results").EnumerateArray().Take(5))
                    {
                        results.Add(new
                        {
                            file = hit.TryGetProperty("path", out var p) ? p.GetString() : "",
                            repo = hit.TryGetProperty("repository", out var rr) && rr.TryGetProperty("name", out var rn) ? rn.GetString() : "",
                            platform = "ado",
                            snippet = hit.TryGetProperty("matches", out var m) && m.TryGetProperty("content", out var mc)
                                ? string.Join(" … ", mc.EnumerateArray().Take(2).Select(s => s.TryGetProperty("charOffset", out _) ? "[match]" : ""))
                                : ""
                        });
                    }
                }
            }
            catch { /* ADO search unavailable — continue */ }
        }

        // GitHub code search
        if ((repo == "" || repo == "github") && gitHubPat is not null && ctx.GitHubOrg is not null)
        {
            try
            {
                var client = GitHubClient(gitHubPat);
                var encoded = Uri.EscapeDataString($"{query} org:{ctx.GitHubOrg}");
                using var resp = await client.GetAsync($"https://api.github.com/search/code?q={encoded}&per_page=5", ct);
                if (resp.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
                    foreach (var item in doc.RootElement.GetProperty("items").EnumerateArray().Take(5))
                    {
                        results.Add(new
                        {
                            file = item.TryGetProperty("path", out var p) ? p.GetString() : "",
                            repo = item.TryGetProperty("repository", out var rr) && rr.TryGetProperty("full_name", out var rn) ? rn.GetString() : "",
                            platform = "github",
                            url = item.TryGetProperty("html_url", out var u) ? u.GetString() : ""
                        });
                    }
                }
            }
            catch { /* GitHub search unavailable */ }
        }

        if (results.Count == 0)
            return $"No code results found for '{query}'. The search service may be unavailable or no matching files exist.";

        return JsonSerializer.Serialize(results);
    }

    private async Task<string> GetFileAsync(JsonElement input, ToolContext ctx, string? gitHubPat, CancellationToken ct)
    {
        var repo = input.TryGetProperty("repo", out var r) ? r.GetString() ?? "" : "";
        var path = input.TryGetProperty("path", out var p) ? p.GetString() ?? "" : "";

        if (repo.StartsWith("ado:", StringComparison.OrdinalIgnoreCase))
        {
            var repoName = repo[4..];
            if (ctx.DevOpsToken is null || ctx.DevOpsOrg is null || ctx.DevOpsProject is null)
                return "Azure DevOps is not configured.";
            try
            {
                var client = AdoClient(ctx.DevOpsToken);
                var baseUrl = $"https://dev.azure.com/{Uri.EscapeDataString(ctx.DevOpsOrg)}/{Uri.EscapeDataString(ctx.DevOpsProject)}/_apis";
                // First resolve repo GUID by name
                using var reposResp = await client.GetAsync($"{baseUrl}/git/repositories?api-version=7.1", ct);
                if (!reposResp.IsSuccessStatusCode) return "Failed to list ADO repositories.";
                using var reposDoc = JsonDocument.Parse(await reposResp.Content.ReadAsStringAsync(ct));
                var repoId = reposDoc.RootElement.GetProperty("value").EnumerateArray()
                    .FirstOrDefault(r => string.Equals(r.GetProperty("name").GetString(), repoName, StringComparison.OrdinalIgnoreCase))
                    .TryGetProperty("id", out var id) ? id.GetString() : null;
                if (repoId is null) return $"Repository '{repoName}' not found in ADO.";

                using var req = new HttpRequestMessage(HttpMethod.Get,
                    $"{baseUrl}/git/repositories/{repoId}/items?path={Uri.EscapeDataString(path)}&api-version=7.1");
                req.Headers.Accept.ParseAdd("text/plain");
                using var resp = await client.SendAsync(req, ct);
                if (!resp.IsSuccessStatusCode) return $"File '{path}' not found.";
                var content = await resp.Content.ReadAsStringAsync(ct);
                if (content.Length > 20_000) content = content[..20_000] + "\n[truncated]";
                return content;
            }
            catch (Exception ex) { return $"Error reading file: {ex.Message}"; }
        }

        if (repo.StartsWith("github:", StringComparison.OrdinalIgnoreCase))
        {
            var ownerRepo = repo[7..];
            if (gitHubPat is null) return "GitHub PAT not configured.";
            try
            {
                var client = GitHubClient(gitHubPat);
                using var resp = await client.GetAsync($"https://api.github.com/repos/{ownerRepo}/contents/{path.TrimStart('/')}", ct);
                if (!resp.IsSuccessStatusCode) return $"File '{path}' not found in {ownerRepo}.";
                using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
                var base64 = doc.RootElement.GetProperty("content").GetString()?.Replace("\n", "") ?? "";
                var content = Encoding.UTF8.GetString(Convert.FromBase64String(base64));
                if (content.Length > 20_000) content = content[..20_000] + "\n[truncated]";
                return content;
            }
            catch (Exception ex) { return $"Error reading file: {ex.Message}"; }
        }

        return "Invalid repo format. Use 'ado:repoName' or 'github:owner/repo'.";
    }

    private async Task<string> ListDirectoryAsync(JsonElement input, ToolContext ctx, string? gitHubPat, CancellationToken ct)
    {
        var repo = input.TryGetProperty("repo", out var r) ? r.GetString() ?? "" : "";
        var path = input.TryGetProperty("path", out var p) ? p.GetString() ?? "/" : "/";

        if (repo.StartsWith("ado:", StringComparison.OrdinalIgnoreCase))
        {
            var repoName = repo[4..];
            if (ctx.DevOpsToken is null || ctx.DevOpsOrg is null || ctx.DevOpsProject is null)
                return "Azure DevOps is not configured.";
            try
            {
                var client = AdoClient(ctx.DevOpsToken);
                var baseUrl = $"https://dev.azure.com/{Uri.EscapeDataString(ctx.DevOpsOrg)}/{Uri.EscapeDataString(ctx.DevOpsProject)}/_apis";
                using var reposResp = await client.GetAsync($"{baseUrl}/git/repositories?api-version=7.1", ct);
                using var reposDoc = JsonDocument.Parse(await reposResp.Content.ReadAsStringAsync(ct));
                var repoId = reposDoc.RootElement.GetProperty("value").EnumerateArray()
                    .FirstOrDefault(r => string.Equals(r.GetProperty("name").GetString(), repoName, StringComparison.OrdinalIgnoreCase))
                    .TryGetProperty("id", out var id) ? id.GetString() : null;
                if (repoId is null) return $"Repository '{repoName}' not found.";

                using var resp = await client.GetAsync(
                    $"{baseUrl}/git/repositories/{repoId}/items?path={Uri.EscapeDataString(path)}&recursionLevel=OneLevel&api-version=7.1", ct);
                if (!resp.IsSuccessStatusCode) return $"Path '{path}' not found.";
                using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
                var entries = doc.RootElement.GetProperty("value").EnumerateArray()
                    .Where(i => i.TryGetProperty("path", out var ip) && ip.GetString() != path)
                    .Select(i => new {
                        name = System.IO.Path.GetFileName(i.GetProperty("path").GetString() ?? ""),
                        type = i.TryGetProperty("isFolder", out var f) && f.GetBoolean() ? "folder" : "file"
                    }).ToList();
                return JsonSerializer.Serialize(entries);
            }
            catch (Exception ex) { return $"Error listing directory: {ex.Message}"; }
        }

        if (repo.StartsWith("github:", StringComparison.OrdinalIgnoreCase))
        {
            var ownerRepo = repo[7..];
            if (gitHubPat is null) return "GitHub PAT not configured.";
            try
            {
                var client = GitHubClient(gitHubPat);
                using var resp = await client.GetAsync($"https://api.github.com/repos/{ownerRepo}/contents/{path.TrimStart('/')}", ct);
                if (!resp.IsSuccessStatusCode) return $"Path '{path}' not found.";
                using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
                var entries = doc.RootElement.EnumerateArray().Select(e => new {
                    name = e.GetProperty("name").GetString() ?? "",
                    type = e.GetProperty("type").GetString() == "dir" ? "folder" : "file"
                }).ToList();
                return JsonSerializer.Serialize(entries);
            }
            catch (Exception ex) { return $"Error listing directory: {ex.Message}"; }
        }

        return "Invalid repo format. Use 'ado:repoName' or 'github:owner/repo'.";
    }

    // ── Email tools ───────────────────────────────────────────────────────────

    private async Task<string> SearchEmailsAsync(JsonElement input, ToolContext ctx, CancellationToken ct)
    {
        if (ctx.GraphToken is null) return "Microsoft Graph is not available (no token).";
        var query = input.TryGetProperty("query", out var q) ? q.GetString() ?? "" : "";
        var top = input.TryGetProperty("top", out var t) ? t.GetInt32() : 5;

        try
        {
            var client = GraphClient(ctx.GraphToken);
            var encoded = Uri.EscapeDataString(query);
            var url = $"https://graph.microsoft.com/v1.0/me/messages?$search=\"{encoded}\"&$top={top}" +
                      "&$select=id,subject,from,receivedDateTime,bodyPreview";
            using var resp = await client.GetAsync(url, ct);
            if (!resp.IsSuccessStatusCode) return "Email search failed.";
            using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
            var results = doc.RootElement.GetProperty("value").EnumerateArray().Select(m => new {
                id = m.GetProperty("id").GetString(),
                subject = m.TryGetProperty("subject", out var s) ? s.GetString() : "",
                from = m.TryGetProperty("from", out var f) && f.TryGetProperty("emailAddress", out var ea)
                    && ea.TryGetProperty("name", out var n) ? n.GetString() : "",
                date = m.TryGetProperty("receivedDateTime", out var d) ? d.GetString() : "",
                preview = m.TryGetProperty("bodyPreview", out var bp) ? bp.GetString() : ""
            }).ToList();
            return results.Count == 0 ? "No emails found." : JsonSerializer.Serialize(results);
        }
        catch (Exception ex) { return $"Email search error: {ex.Message}"; }
    }

    private async Task<string> GetEmailThreadAsync(JsonElement input, ToolContext ctx, CancellationToken ct)
    {
        if (ctx.GraphToken is null) return "Microsoft Graph is not available.";
        var msgId = input.TryGetProperty("messageId", out var m) ? m.GetString() ?? "" : "";
        if (string.IsNullOrEmpty(msgId)) return "messageId is required.";

        try
        {
            var client = GraphClient(ctx.GraphToken);
            using var resp = await client.GetAsync(
                $"https://graph.microsoft.com/v1.0/me/messages/{msgId}?$select=subject,from,receivedDateTime,body", ct);
            if (!resp.IsSuccessStatusCode) return "Email not found.";
            using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
            var m2 = doc.RootElement;
            var body = m2.TryGetProperty("body", out var b) && b.TryGetProperty("content", out var c)
                ? c.GetString() ?? "" : "";
            // Strip HTML tags for readability
            body = System.Text.RegularExpressions.Regex.Replace(body, "<[^>]+>", " ")
                .Replace("&nbsp;", " ").Replace("&lt;", "<").Replace("&gt;", ">").Trim();
            if (body.Length > 3000) body = body[..3000] + " [truncated]";
            return JsonSerializer.Serialize(new {
                subject = m2.TryGetProperty("subject", out var sub) ? sub.GetString() : "",
                from = m2.TryGetProperty("from", out var f) && f.TryGetProperty("emailAddress", out var ea)
                    && ea.TryGetProperty("name", out var n) ? n.GetString() : "",
                date = m2.TryGetProperty("receivedDateTime", out var d) ? d.GetString() : "",
                body
            });
        }
        catch (Exception ex) { return $"Error reading email: {ex.Message}"; }
    }

    // ── Teams tools ───────────────────────────────────────────────────────────

    private async Task<string> SearchTeamsMessagesAsync(JsonElement input, ToolContext ctx, CancellationToken ct)
    {
        if (ctx.GraphToken is null) return "Microsoft Graph is not available.";
        var query = input.TryGetProperty("query", out var q) ? q.GetString() ?? "" : "";

        try
        {
            var client = GraphClient(ctx.GraphToken);
            var payload = new
            {
                requests = new[]
                {
                    new { entityTypes = new[] { "chatMessage" }, query = new { queryString = query } }
                }
            };
            using var req = new HttpRequestMessage(HttpMethod.Post, "https://graph.microsoft.com/v1.0/search/query")
            {
                Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
            };
            using var resp = await client.SendAsync(req, ct);
            if (!resp.IsSuccessStatusCode) return "Teams search failed.";
            using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));

            var hits = doc.RootElement
                .TryGetProperty("value", out var v) ? v.EnumerateArray().FirstOrDefault()
                    .TryGetProperty("hitsContainers", out var hc) ? hc.EnumerateArray().FirstOrDefault()
                        .TryGetProperty("hits", out var h) ? h.EnumerateArray().Take(5).ToList()
                        : new List<JsonElement>()
                    : new List<JsonElement>()
                : new List<JsonElement>();

            if (hits.Count == 0) return "No Teams messages found.";
            var results = hits.Select(h => new {
                summary = h.TryGetProperty("summary", out var s) ? s.GetString() : ""
            }).ToList();
            return JsonSerializer.Serialize(results);
        }
        catch (Exception ex) { return $"Teams search error: {ex.Message}"; }
    }

    private async Task<string> GetChannelMessagesAsync(JsonElement input, ToolContext ctx, CancellationToken ct)
    {
        if (ctx.GraphToken is null) return "Microsoft Graph is not available.";
        var teamId   = input.TryGetProperty("teamId",    out var t) ? t.GetString() ?? "" : "";
        var chanId   = input.TryGetProperty("channelId", out var c) ? c.GetString() ?? "" : "";
        var top      = input.TryGetProperty("top",       out var n) ? n.GetInt32() : 10;

        try
        {
            var client = GraphClient(ctx.GraphToken);
            using var resp = await client.GetAsync(
                $"https://graph.microsoft.com/v1.0/teams/{teamId}/channels/{chanId}/messages?$top={top}", ct);
            if (!resp.IsSuccessStatusCode) return "Channel not found or access denied.";
            using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
            var msgs = doc.RootElement.GetProperty("value").EnumerateArray().Select(m => new {
                sender = m.TryGetProperty("from", out var f) && f.TryGetProperty("user", out var u)
                    && u.TryGetProperty("displayName", out var dn) ? dn.GetString() : "Unknown",
                date   = m.TryGetProperty("createdDateTime", out var d) ? d.GetString() : "",
                content = m.TryGetProperty("body", out var b) && b.TryGetProperty("content", out var bc)
                    ? bc.GetString() ?? "" : ""
            }).ToList();
            return msgs.Count == 0 ? "No messages." : JsonSerializer.Serialize(msgs);
        }
        catch (Exception ex) { return $"Error reading channel: {ex.Message}"; }
    }

    // ── HTTP client helpers ───────────────────────────────────────────────────

    private HttpClient AdoClient(string token)
    {
        var c = _httpClientFactory.CreateClient("devops");
        c.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return c;
    }

    private HttpClient GitHubClient(string pat)
    {
        var c = _httpClientFactory.CreateClient("github");
        c.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", pat);
        c.DefaultRequestHeaders.UserAgent.ParseAdd("AgpCommandStation/1.0");
        c.DefaultRequestHeaders.Accept.ParseAdd("application/vnd.github+json");
        c.DefaultRequestHeaders.Add("X-GitHub-Api-Version", "2022-11-28");
        return c;
    }

    private HttpClient GraphClient(string token)
    {
        var c = _httpClientFactory.CreateClient("graph");
        c.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return c;
    }
}
