using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using AgpCommandStation.Api.Data;
using AgpCommandStation.Api.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AgpCommandStation.Api.Controllers;

/// <summary>
/// Proxies Azure DevOps Work Item REST calls.
/// The frontend sends the Microsoft OAuth token as X-DevOps-Token; this
/// controller forwards it as Bearer to the ADO APIs.
/// Org + project are read from the user's saved profile (no PAT needed).
/// </summary>
[ApiController]
[Route("api/devops")]
[Authorize]
public class DevOpsController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly AppDbContext _db;

    private const string AdoApiVersion = "7.1";

    public DevOpsController(IHttpClientFactory httpClientFactory, AppDbContext db)
    {
        _httpClientFactory = httpClientFactory;
        _db = db;
    }

    // GET /api/devops/workitems — list items assigned to @Me
    [HttpGet("workitems")]
    public async Task<IActionResult> ListWorkItems(CancellationToken ct)
    {
        var (userId, devOpsToken, client, baseUrl, err) = await ResolveContext(ct);
        if (err is not null) return err;

        // Step 1: WIQL query → list of IDs
        var wiql = new
        {
            query = "SELECT [Id],[Title],[State],[Work Item Type] FROM WorkItems " +
                    "WHERE [Assigned To] = @Me AND [State] <> 'Closed' " +
                    "ORDER BY [Changed Date] DESC"
        };

        using var wiqlReq = new HttpRequestMessage(HttpMethod.Post,
            $"{baseUrl}/wit/wiql?api-version={AdoApiVersion}");
        wiqlReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", devOpsToken);
        wiqlReq.Content = new StringContent(JsonSerializer.Serialize(wiql), Encoding.UTF8, "application/json");

        using var wiqlResp = await client!.SendAsync(wiqlReq, ct);
        if (!wiqlResp.IsSuccessStatusCode)
            return StatusCode((int)wiqlResp.StatusCode, new { error = "ado_wiql_failed" });

        using var wiqlDoc = JsonDocument.Parse(await wiqlResp.Content.ReadAsStringAsync(ct));
        var ids = wiqlDoc.RootElement
            .GetProperty("workItems")
            .EnumerateArray()
            .Select(e => e.GetProperty("id").GetInt32())
            .Take(50)
            .ToList();

        if (ids.Count == 0)
            return Ok(Array.Empty<WorkItemSummary>());

        // Step 2: batch fetch fields for those IDs
        var idsStr = string.Join(',', ids);
        using var batchReq = new HttpRequestMessage(HttpMethod.Get,
            $"{baseUrl}/wit/workitems?ids={idsStr}&fields=System.Id,System.Title,System.State,System.WorkItemType,System.TeamProject&api-version={AdoApiVersion}");
        batchReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", devOpsToken);

        using var batchResp = await client.SendAsync(batchReq, ct);
        if (!batchResp.IsSuccessStatusCode)
            return StatusCode((int)batchResp.StatusCode, new { error = "ado_batch_failed" });

        using var batchDoc = JsonDocument.Parse(await batchResp.Content.ReadAsStringAsync(ct));

        var items = batchDoc.RootElement.GetProperty("value").EnumerateArray().Select(item =>
        {
            var fields = item.GetProperty("fields");
            var id = fields.GetProperty("System.Id").GetInt32();
            return new WorkItemSummary(
                id,
                fields.TryGetProperty("System.Title", out var t) ? t.GetString() ?? "" : "",
                fields.TryGetProperty("System.State", out var s) ? s.GetString() ?? "" : "",
                fields.TryGetProperty("System.WorkItemType", out var w) ? w.GetString() ?? "" : "",
                item.TryGetProperty("url", out var url) ? url.GetString() : null
            );
        }).ToList();

        return Ok(items);
    }

    // POST /api/devops/workitems/{type} — create a new work item
    [HttpPost("workitems/{type}")]
    public async Task<IActionResult> CreateWorkItem(
        string type,
        [FromBody] JsonElement patchDoc,
        CancellationToken ct)
    {
        var (_, devOpsToken, client, baseUrl, err) = await ResolveContext(ct);
        if (err is not null) return err;

        // patchDoc is already a JSON Patch array from the frontend
        using var req = new HttpRequestMessage(HttpMethod.Post,
            $"{baseUrl}/wit/workitems/${Uri.EscapeDataString(type)}?api-version={AdoApiVersion}");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", devOpsToken);
        req.Content = new StringContent(patchDoc.GetRawText(), Encoding.UTF8, "application/json-patch+json");

        using var resp = await client!.SendAsync(req, ct);
        var body = await resp.Content.ReadAsStringAsync(ct);
        if (!resp.IsSuccessStatusCode)
            return StatusCode((int)resp.StatusCode, new { error = "ado_create_failed", detail = body });

        return StatusCode(201, JsonDocument.Parse(body).RootElement);
    }

    // PATCH /api/devops/workitems/{id}/state — update state
    [HttpPatch("workitems/{id:int}/state")]
    public async Task<IActionResult> UpdateState(int id, [FromBody] UpdateWorkItemStateBody body, CancellationToken ct)
    {
        var (_, devOpsToken, client, baseUrl, err) = await ResolveContext(ct);
        if (err is not null) return err;

        var patch = new[] { new { op = "replace", path = "/fields/System.State", value = body.State } };

        using var req = new HttpRequestMessage(new HttpMethod("PATCH"),
            $"{baseUrl}/wit/workitems/{id}?api-version={AdoApiVersion}");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", devOpsToken);
        req.Content = new StringContent(JsonSerializer.Serialize(patch), Encoding.UTF8, "application/json-patch+json");

        using var resp = await client!.SendAsync(req, ct);
        if (!resp.IsSuccessStatusCode)
            return StatusCode((int)resp.StatusCode, new { error = "ado_state_failed" });

        return NoContent();
    }

    // POST /api/devops/workitems/{id}/comments — add a comment
    [HttpPost("workitems/{id:int}/comments")]
    public async Task<IActionResult> AddComment(int id, [FromBody] AddWorkItemCommentBody body, CancellationToken ct)
    {
        var (_, devOpsToken, client, baseUrl, err) = await ResolveContext(ct);
        if (err is not null) return err;

        var payload = new { text = body.Text };

        using var req = new HttpRequestMessage(HttpMethod.Post,
            $"{baseUrl}/wit/workitems/{id}/comments?api-version={AdoApiVersion}-preview.3");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", devOpsToken);
        req.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        using var resp = await client!.SendAsync(req, ct);
        if (!resp.IsSuccessStatusCode)
            return StatusCode((int)resp.StatusCode, new { error = "ado_comment_failed" });

        return NoContent();
    }

    // ── Repos ─────────────────────────────────────────────────────────────────

    // GET /api/devops/repos
    [HttpGet("repos")]
    public async Task<IActionResult> ListRepos(CancellationToken ct)
    {
        var (_, devOpsToken, client, baseUrl, err) = await ResolveContext(ct);
        if (err is not null) return err;

        using var req = new HttpRequestMessage(HttpMethod.Get,
            $"{baseUrl}/git/repositories?api-version={AdoApiVersion}");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", devOpsToken);
        using var resp = await client!.SendAsync(req, ct);
        if (!resp.IsSuccessStatusCode) return StatusCode((int)resp.StatusCode, new { error = "ado_repos_failed" });

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
        var repos = doc.RootElement.GetProperty("value").EnumerateArray().Select(r => new RepoSummary(
            r.GetProperty("id").GetString() ?? "",
            r.GetProperty("name").GetString() ?? "",
            "ado",
            r.TryGetProperty("defaultBranch", out var db) ? db.GetString()?.Replace("refs/heads/", "") : null,
            r.TryGetProperty("remoteUrl", out var ru) ? ru.GetString() : null
        )).ToList();
        return Ok(repos);
    }

    // GET /api/devops/repos/{repoId}/tree?path=/
    [HttpGet("repos/{repoId}/tree")]
    public async Task<IActionResult> GetTree(string repoId, [FromQuery] string path = "/", CancellationToken ct = default)
    {
        var (_, devOpsToken, client, baseUrl, err) = await ResolveContext(ct);
        if (err is not null) return err;

        var url = $"{baseUrl}/git/repositories/{repoId}/items" +
                  $"?path={Uri.EscapeDataString(path)}&recursionLevel=OneLevel&api-version={AdoApiVersion}";
        using var req = new HttpRequestMessage(HttpMethod.Get, url);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", devOpsToken);
        using var resp = await client!.SendAsync(req, ct);
        if (!resp.IsSuccessStatusCode) return StatusCode((int)resp.StatusCode, new { error = "ado_tree_failed" });

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
        var nodes = doc.RootElement.GetProperty("value").EnumerateArray()
            .Where(i => i.TryGetProperty("path", out var p) && p.GetString() != path)
            .Select(i => new TreeNode(
                System.IO.Path.GetFileName(i.GetProperty("path").GetString() ?? ""),
                i.TryGetProperty("isFolder", out var f) && f.GetBoolean() ? "folder" : "file",
                i.GetProperty("path").GetString() ?? ""
            )).ToList();
        return Ok(nodes);
    }

    // GET /api/devops/repos/{repoId}/file?path=
    [HttpGet("repos/{repoId}/file")]
    public async Task<IActionResult> GetFile(string repoId, [FromQuery] string path, CancellationToken ct)
    {
        var (_, devOpsToken, client, baseUrl, err) = await ResolveContext(ct);
        if (err is not null) return err;

        var url = $"{baseUrl}/git/repositories/{repoId}/items?path={Uri.EscapeDataString(path)}&api-version={AdoApiVersion}";
        using var req = new HttpRequestMessage(HttpMethod.Get, url);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", devOpsToken);
        req.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("text/plain"));
        using var resp = await client!.SendAsync(req, ct);
        if (!resp.IsSuccessStatusCode) return StatusCode((int)resp.StatusCode, new { error = "ado_file_failed" });

        var content = await resp.Content.ReadAsStringAsync(ct);
        if (content.Length > 50_000) content = content[..50_000] + "\n\n[File truncated — too large to display in full]";
        return Ok(new FileContent(path, content, DetectLanguage(path), null));
    }

    // GET /api/devops/repos/{repoId}/branches
    [HttpGet("repos/{repoId}/branches")]
    public async Task<IActionResult> GetBranches(string repoId, CancellationToken ct)
    {
        var (_, devOpsToken, client, baseUrl, err) = await ResolveContext(ct);
        if (err is not null) return err;

        using var req = new HttpRequestMessage(HttpMethod.Get,
            $"{baseUrl}/git/repositories/{repoId}/refs?filter=heads&api-version={AdoApiVersion}");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", devOpsToken);
        using var resp = await client!.SendAsync(req, ct);
        if (!resp.IsSuccessStatusCode) return StatusCode((int)resp.StatusCode, new { error = "ado_branches_failed" });

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
        var branches = doc.RootElement.GetProperty("value").EnumerateArray().Select(b => new BranchSummary(
            (b.GetProperty("name").GetString() ?? "").Replace("refs/heads/", ""),
            false
        )).ToList();
        return Ok(branches);
    }

    // GET /api/devops/repos/{repoId}/commits?top=10&branch=
    [HttpGet("repos/{repoId}/commits")]
    public async Task<IActionResult> GetCommits(string repoId, [FromQuery] string? branch, [FromQuery] int top = 10, CancellationToken ct = default)
    {
        var (_, devOpsToken, client, baseUrl, err) = await ResolveContext(ct);
        if (err is not null) return err;

        var branchParam = branch is not null ? $"&searchCriteria.itemVersion.version={Uri.EscapeDataString(branch)}" : "";
        using var req = new HttpRequestMessage(HttpMethod.Get,
            $"{baseUrl}/git/repositories/{repoId}/commits?searchCriteria.$top={top}{branchParam}&api-version={AdoApiVersion}");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", devOpsToken);
        using var resp = await client!.SendAsync(req, ct);
        if (!resp.IsSuccessStatusCode) return StatusCode((int)resp.StatusCode, new { error = "ado_commits_failed" });

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
        var commits = doc.RootElement.GetProperty("value").EnumerateArray().Select(c => new CommitSummary(
            c.GetProperty("commitId").GetString()?[..7] ?? "",
            c.TryGetProperty("comment", out var cm) ? cm.GetString() ?? "" : "",
            c.TryGetProperty("author", out var a) && a.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "",
            c.TryGetProperty("author", out var a2) && a2.TryGetProperty("date", out var d) ? d.GetString() ?? "" : ""
        )).ToList();
        return Ok(commits);
    }

    // GET /api/devops/pullrequests
    [HttpGet("pullrequests")]
    public async Task<IActionResult> ListPullRequests(CancellationToken ct)
    {
        var (userId, devOpsToken, client, baseUrl, err) = await ResolveContext(ct);
        if (err is not null) return err;

        using var req = new HttpRequestMessage(HttpMethod.Get,
            $"{baseUrl}/git/pullrequests?searchCriteria.reviewerId={userId}&api-version={AdoApiVersion}");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", devOpsToken);
        using var resp = await client!.SendAsync(req, ct);
        if (!resp.IsSuccessStatusCode) return StatusCode((int)resp.StatusCode, new { error = "ado_prs_failed" });

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
        var prs = doc.RootElement.GetProperty("value").EnumerateArray().Select(pr => new PullRequestSummary(
            pr.GetProperty("pullRequestId").GetInt32().ToString(),
            pr.GetProperty("title").GetString() ?? "",
            (pr.TryGetProperty("sourceRefName", out var src) ? src.GetString() ?? "" : "").Replace("refs/heads/", ""),
            (pr.TryGetProperty("targetRefName", out var tgt) ? tgt.GetString() ?? "" : "").Replace("refs/heads/", ""),
            pr.TryGetProperty("createdBy", out var cb) && cb.TryGetProperty("displayName", out var dn) ? dn.GetString() ?? "" : "",
            pr.TryGetProperty("status", out var st) ? st.GetString() ?? "" : "",
            "ado",
            pr.TryGetProperty("repository", out var rp) && rp.TryGetProperty("id", out var rid) ? rid.GetString() ?? "" : "",
            pr.TryGetProperty("repository", out var rp2) && rp2.TryGetProperty("name", out var rn) ? rn.GetString() ?? "" : "",
            pr.TryGetProperty("url", out var u) ? u.GetString() : null,
            pr.TryGetProperty("description", out var desc) ? desc.GetString() : null
        )).ToList();
        return Ok(prs);
    }

    // POST /api/devops/repos/{repoId}/pullrequests
    [HttpPost("repos/{repoId}/pullrequests")]
    public async Task<IActionResult> CreatePullRequest(string repoId, [FromBody] CreatePrRequest request, CancellationToken ct)
    {
        var (_, devOpsToken, client, baseUrl, err) = await ResolveContext(ct);
        if (err is not null) return err;

        var payload = new
        {
            title = request.Title,
            description = request.Body,
            sourceRefName = $"refs/heads/{request.SourceBranch}",
            targetRefName = $"refs/heads/{request.TargetBranch}",
        };
        using var req = new HttpRequestMessage(HttpMethod.Post,
            $"{baseUrl}/git/repositories/{repoId}/pullrequests?api-version={AdoApiVersion}");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", devOpsToken);
        req.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        using var resp = await client!.SendAsync(req, ct);
        var body = await resp.Content.ReadAsStringAsync(ct);
        return resp.IsSuccessStatusCode
            ? StatusCode(201, JsonDocument.Parse(body).RootElement)
            : StatusCode((int)resp.StatusCode, new { error = "ado_create_pr_failed" });
    }

    // PUT /api/devops/pullrequests/{id}/vote
    [HttpPut("pullrequests/{id}/vote")]
    public async Task<IActionResult> Vote(string id, [FromBody] VoteRequest request, CancellationToken ct)
    {
        var (userId, devOpsToken, client, baseUrl, err) = await ResolveContext(ct);
        if (err is not null) return err;

        // Need the repoId from query (passed by frontend)
        var repoId = Request.Query["repoId"].FirstOrDefault();
        if (repoId is null) return BadRequest(new { error = "repoId required" });

        var payload = new { vote = request.Vote };
        using var req = new HttpRequestMessage(HttpMethod.Put,
            $"{baseUrl}/git/repositories/{repoId}/pullrequests/{id}/reviewers/{userId}?api-version={AdoApiVersion}");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", devOpsToken);
        req.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        using var resp = await client!.SendAsync(req, ct);
        return resp.IsSuccessStatusCode ? NoContent() : StatusCode((int)resp.StatusCode, new { error = "ado_vote_failed" });
    }

    // POST /api/devops/pullrequests/{id}/threads
    [HttpPost("pullrequests/{id}/threads")]
    public async Task<IActionResult> AddThread(string id, [FromBody] AddPrThreadRequest request, CancellationToken ct)
    {
        var (_, devOpsToken, client, baseUrl, err) = await ResolveContext(ct);
        if (err is not null) return err;

        var repoId = Request.Query["repoId"].FirstOrDefault();
        if (repoId is null) return BadRequest(new { error = "repoId required" });

        var payload = new { comments = new[] { new { content = request.Text, commentType = 1 } }, status = 1 };
        using var req = new HttpRequestMessage(HttpMethod.Post,
            $"{baseUrl}/git/repositories/{repoId}/pullrequests/{id}/threads?api-version={AdoApiVersion}");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", devOpsToken);
        req.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        using var resp = await client!.SendAsync(req, ct);
        return resp.IsSuccessStatusCode ? NoContent() : StatusCode((int)resp.StatusCode, new { error = "ado_thread_failed" });
    }

    private static string DetectLanguage(string path)
    {
        var ext = System.IO.Path.GetExtension(path).ToLowerInvariant();
        return ext switch
        {
            ".cs" => "csharp", ".ts" or ".tsx" => "typescript", ".js" or ".jsx" => "javascript",
            ".py" => "python", ".go" => "go", ".rs" => "rust", ".java" => "java",
            ".json" => "json", ".xml" => "xml", ".yaml" or ".yml" => "yaml",
            ".md" => "markdown", ".html" => "html", ".css" => "css", ".sql" => "sql",
            _ => "plaintext"
        };
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private record ContextResult(
        string? UserId,
        string? DevOpsToken,
        HttpClient? Client,
        string? BaseUrl,
        IActionResult? Error
    );

    private async Task<ContextResult> ResolveContext(CancellationToken ct)
    {
        var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (userId is null)
            return new(null, null, null, null, Unauthorized());

        var devOpsToken = Request.Headers["X-DevOps-Token"].FirstOrDefault();
        if (string.IsNullOrEmpty(devOpsToken))
            return new(userId, null, null, null, BadRequest(new { error = "missing_devops_token" }));

        var user = await _db.Users.FindAsync(new object[] { userId }, ct);
        if (user?.DevOpsOrganization is null || user.DevOpsProject is null)
            return new(userId, devOpsToken, null, null,
                BadRequest(new { error = "devops_not_configured", message = "Set your DevOps org and project in Profile Settings." }));

        var baseUrl = $"https://dev.azure.com/{Uri.EscapeDataString(user.DevOpsOrganization)}" +
                      $"/{Uri.EscapeDataString(user.DevOpsProject)}/_apis";

        var client = _httpClientFactory.CreateClient("devops");
        return new(userId, devOpsToken, client, baseUrl, null);
    }
}
