using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using AgpCommandStation.Api.Data;
using AgpCommandStation.Api.Dtos;
using AgpCommandStation.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AgpCommandStation.Api.Controllers;

[ApiController]
[Route("api/search")]
[Authorize]
public class SearchController : ControllerBase
{
    private readonly IHttpClientFactory _http;
    private readonly AppDbContext _db;
    private readonly IEncryptionService _encryption;

    public SearchController(IHttpClientFactory http, AppDbContext db, IEncryptionService encryption)
    {
        _http = http;
        _db = db;
        _encryption = encryption;
    }

    // GET /api/search?q={query}
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] string q, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(q)) return Ok(Array.Empty<SearchResult>());

        var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (userId is null) return Unauthorized();

        var user = await _db.Users.FindAsync(new object[] { userId }, ct);
        var devOpsToken = Request.Headers["X-DevOps-Token"].FirstOrDefault();
        var graphToken  = Request.Headers["X-Graph-Token"].FirstOrDefault();
        string? gitHubPat = user?.GitHubPatEncrypted is not null
            ? _encryption.Decrypt(user.GitHubPatEncrypted) : null;

        // Fan-out all sources in parallel (max 5 each)
        var tasks = new List<Task<IEnumerable<SearchResult>>>();

        if (devOpsToken is not null && user?.DevOpsOrganization is not null)
        {
            tasks.Add(SearchAdoWorkItems(q, devOpsToken, user.DevOpsOrganization, user.DevOpsProject, ct));
            tasks.Add(SearchAdoCode(q, devOpsToken, user.DevOpsOrganization, user.DevOpsProject, ct));
        }

        if (gitHubPat is not null && user?.GitHubOrganization is not null)
        {
            tasks.Add(SearchGitHubPrs(q, gitHubPat, user.GitHubOrganization, ct));
            tasks.Add(SearchGitHubCode(q, gitHubPat, user.GitHubOrganization, ct));
        }

        if (graphToken is not null)
        {
            tasks.Add(SearchGraph(q, graphToken, ct));
        }

        var allResults = await Task.WhenAll(tasks);
        var flat = allResults.SelectMany(r => r).Take(30).ToList();
        return Ok(flat);
    }

    // ── ADO ───────────────────────────────────────────────────────────────────

    private async Task<IEnumerable<SearchResult>> SearchAdoWorkItems(
        string q, string token, string org, string? project, CancellationToken ct)
    {
        try
        {
            var client = AdoClient(token);
            var body = new Dictionary<string, object?> { ["searchText"] = q, ["$top"] = 5 };
            if (project is not null) body["filters"] = new { Project = new[] { project } };

            using var req = new HttpRequestMessage(HttpMethod.Post,
                $"https://almsearch.dev.azure.com/{Uri.EscapeDataString(org)}/_apis/search/workitemsearchresults?api-version=7.0")
            {
                Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json")
            };
            using var resp = await client.SendAsync(req, ct);
            if (!resp.IsSuccessStatusCode) return [];

            using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
            return doc.RootElement.GetProperty("results").EnumerateArray().Take(5).Select(r => new SearchResult(
                "workitem",
                r.TryGetProperty("fields", out var f) && f.TryGetProperty("System.Title", out var t) ? t.GetString() ?? q : q,
                r.TryGetProperty("fields", out var f2) && f2.TryGetProperty("System.WorkItemType", out var wt) ? wt.GetString() ?? "Work Item" : "Work Item",
                "workitems",
                r.TryGetProperty("url", out var u) ? u.GetString() : null,
                r.TryGetProperty("fields", out var f3) && f3.TryGetProperty("System.Id", out var id) ? id.ToString() : null
            )).ToList();
        }
        catch { return []; }
    }

    private async Task<IEnumerable<SearchResult>> SearchAdoCode(
        string q, string token, string org, string? project, CancellationToken ct)
    {
        try
        {
            var client = AdoClient(token);
            var body = new Dictionary<string, object?> { ["searchText"] = q, ["$top"] = 5 };
            if (project is not null) body["filters"] = new { Project = new[] { project } };

            using var req = new HttpRequestMessage(HttpMethod.Post,
                $"https://almsearch.dev.azure.com/{Uri.EscapeDataString(org)}/_apis/search/codesearchresults?api-version=7.0")
            {
                Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json")
            };
            using var resp = await client.SendAsync(req, ct);
            if (!resp.IsSuccessStatusCode) return [];

            using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
            return doc.RootElement.GetProperty("results").EnumerateArray().Take(5).Select(r => new SearchResult(
                "code",
                r.TryGetProperty("path", out var p) ? System.IO.Path.GetFileName(p.GetString() ?? q) : q,
                r.TryGetProperty("repository", out var rp) && rp.TryGetProperty("name", out var rn) ? rn.GetString() ?? "ADO" : "ADO",
                "repos",
                null,
                r.TryGetProperty("path", out var p2) ? p2.GetString() : null
            )).ToList();
        }
        catch { return []; }
    }

    // ── GitHub ────────────────────────────────────────────────────────────────

    private async Task<IEnumerable<SearchResult>> SearchGitHubPrs(
        string q, string pat, string org, CancellationToken ct)
    {
        try
        {
            var client = GitHubClient(pat);
            var encoded = Uri.EscapeDataString($"{q} org:{org} is:pr state:open");
            using var resp = await client.GetAsync(
                $"https://api.github.com/search/issues?q={encoded}&per_page=5", ct);
            if (!resp.IsSuccessStatusCode) return [];

            using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
            return doc.RootElement.GetProperty("items").EnumerateArray().Take(5).Select(pr => new SearchResult(
                "pr",
                pr.TryGetProperty("title", out var t) ? t.GetString() ?? q : q,
                $"#{(pr.TryGetProperty("number", out var n) ? n.GetInt32().ToString() : "?")} · GitHub",
                "repos",
                pr.TryGetProperty("html_url", out var u) ? u.GetString() : null,
                pr.TryGetProperty("number", out var n2) ? n2.GetInt32().ToString() : null
            )).ToList();
        }
        catch { return []; }
    }

    private async Task<IEnumerable<SearchResult>> SearchGitHubCode(
        string q, string pat, string org, CancellationToken ct)
    {
        try
        {
            var client = GitHubClient(pat);
            var encoded = Uri.EscapeDataString($"{q} org:{org}");
            using var resp = await client.GetAsync(
                $"https://api.github.com/search/code?q={encoded}&per_page=5", ct);
            if (!resp.IsSuccessStatusCode) return [];

            using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
            return doc.RootElement.GetProperty("items").EnumerateArray().Take(5).Select(f => new SearchResult(
                "code",
                f.TryGetProperty("name", out var n) ? n.GetString() ?? q : q,
                f.TryGetProperty("repository", out var r) && r.TryGetProperty("full_name", out var fn) ? fn.GetString() ?? "GitHub" : "GitHub",
                "repos",
                f.TryGetProperty("html_url", out var u) ? u.GetString() : null,
                f.TryGetProperty("path", out var p) ? p.GetString() : null
            )).ToList();
        }
        catch { return []; }
    }

    // ── Graph ─────────────────────────────────────────────────────────────────

    private async Task<IEnumerable<SearchResult>> SearchGraph(string q, string token, CancellationToken ct)
    {
        try
        {
            var client = GraphClient(token);
            var payload = new
            {
                requests = new[]
                {
                    new { entityTypes = new[] { "message", "chatMessage", "event" },
                          query = new { queryString = q }, from = 0, size = 5 }
                }
            };
            using var req = new HttpRequestMessage(HttpMethod.Post, "https://graph.microsoft.com/v1.0/search/query")
            {
                Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
            };
            using var resp = await client.SendAsync(req, ct);
            if (!resp.IsSuccessStatusCode) return [];

            using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
            var results = new List<SearchResult>();

            var containers = doc.RootElement
                .TryGetProperty("value", out var v) ? v.EnumerateArray().FirstOrDefault()
                    .TryGetProperty("hitsContainers", out var hc) ? hc.EnumerateArray() : default
                : default;

            foreach (var container in containers)
            {
                if (!container.TryGetProperty("hits", out var hits)) continue;
                foreach (var hit in hits.EnumerateArray().Take(5))
                {
                    if (!hit.TryGetProperty("resource", out var res)) continue;
                    if (!res.TryGetProperty("@odata.type", out var odt)) continue;
                    var entityType = odt.GetString() ?? "";

                    if (entityType.Contains("message", StringComparison.OrdinalIgnoreCase))
                    {
                        var subject = res.TryGetProperty("subject", out var s) ? s.GetString() : null;
                        var from = res.TryGetProperty("from", out var f) && f.TryGetProperty("emailAddress", out var ea)
                            && ea.TryGetProperty("name", out var n) ? n.GetString() : null;
                        results.Add(new SearchResult("email",
                            subject ?? q, from ?? "Email", "email",
                            null, res.TryGetProperty("id", out var id) ? id.GetString() : null));
                    }
                    else if (entityType.Contains("chatMessage", StringComparison.OrdinalIgnoreCase))
                    {
                        var body = res.TryGetProperty("body", out var b) && b.TryGetProperty("content", out var c) ? c.GetString() : null;
                        results.Add(new SearchResult("teams",
                            body is not null && body.Length > 60 ? body[..60] + "…" : body ?? q,
                            "Teams", "teams", null, null));
                    }
                    else if (entityType.Contains("event", StringComparison.OrdinalIgnoreCase))
                    {
                        var title = res.TryGetProperty("subject", out var sub) ? sub.GetString() : null;
                        var start = res.TryGetProperty("start", out var st) && st.TryGetProperty("dateTime", out var dt) ? dt.GetString() : null;
                        results.Add(new SearchResult("calendar",
                            title ?? q, start is not null ? $"Calendar · {start[..10]}" : "Calendar",
                            "calendar", null, res.TryGetProperty("id", out var id) ? id.GetString() : null));
                    }
                }
            }
            return results;
        }
        catch { return []; }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private HttpClient AdoClient(string token)
    {
        var c = _http.CreateClient("devops");
        c.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return c;
    }

    private HttpClient GitHubClient(string pat)
    {
        var c = _http.CreateClient("github");
        c.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", pat);
        c.DefaultRequestHeaders.UserAgent.ParseAdd("AgpCommandStation/1.0");
        c.DefaultRequestHeaders.Accept.ParseAdd("application/vnd.github+json");
        c.DefaultRequestHeaders.Add("X-GitHub-Api-Version", "2022-11-28");
        return c;
    }

    private HttpClient GraphClient(string token)
    {
        var c = _http.CreateClient("graph");
        c.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return c;
    }
}
