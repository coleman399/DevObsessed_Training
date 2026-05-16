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

/// <summary>
/// GitHub repos and PRs using the user's stored PAT.
/// </summary>
[ApiController]
[Route("api/repos/github")]
[Authorize]
public class ReposController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly AppDbContext _db;
    private readonly IEncryptionService _encryption;
    private const string GhBase = "https://api.github.com";

    public ReposController(IHttpClientFactory httpClientFactory, AppDbContext db, IEncryptionService encryption)
    {
        _httpClientFactory = httpClientFactory;
        _db = db;
        _encryption = encryption;
    }

    // GET /api/repos/github
    [HttpGet]
    public async Task<IActionResult> ListRepos(CancellationToken ct)
    {
        var (client, org, err) = await GetClient(ct);
        if (err is not null) return err;

        using var resp = await client!.GetAsync($"{GhBase}/orgs/{org}/repos?sort=updated&per_page=30", ct);
        if (!resp.IsSuccessStatusCode) return StatusCode((int)resp.StatusCode, new { error = "github_repos_failed" });

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
        var repos = doc.RootElement.EnumerateArray().Select(r => new RepoSummary(
            r.GetProperty("full_name").GetString() ?? "",
            r.GetProperty("name").GetString() ?? "",
            "github",
            r.TryGetProperty("default_branch", out var db2) ? db2.GetString() : "main",
            r.TryGetProperty("html_url", out var u) ? u.GetString() : null
        )).ToList();
        return Ok(repos);
    }

    // GET /api/repos/github/{owner}/{repo}/tree?sha=
    [HttpGet("{owner}/{repo}/tree")]
    public async Task<IActionResult> GetTree(string owner, string repo, [FromQuery] string? sha, CancellationToken ct)
    {
        var (client, _, err) = await GetClient(ct);
        if (err is not null) return err;

        var treeSha = sha ?? "HEAD";
        using var resp = await client!.GetAsync($"{GhBase}/repos/{owner}/{repo}/git/trees/{treeSha}?recursive=0", ct);
        if (!resp.IsSuccessStatusCode) return StatusCode((int)resp.StatusCode, new { error = "github_tree_failed" });

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
        var nodes = doc.RootElement.GetProperty("tree").EnumerateArray()
            .Where(n => n.TryGetProperty("path", out var p) && !p.GetString()!.Contains('/')) // root level only
            .Select(n => new TreeNode(
                System.IO.Path.GetFileName(n.GetProperty("path").GetString() ?? ""),
                n.GetProperty("type").GetString() == "tree" ? "folder" : "file",
                n.GetProperty("path").GetString() ?? ""
            )).ToList();
        return Ok(nodes);
    }

    // GET /api/repos/github/{owner}/{repo}/file?path=
    [HttpGet("{owner}/{repo}/file")]
    public async Task<IActionResult> GetFile(string owner, string repo, [FromQuery] string path, CancellationToken ct)
    {
        var (client, _, err) = await GetClient(ct);
        if (err is not null) return err;

        using var resp = await client!.GetAsync($"{GhBase}/repos/{owner}/{repo}/contents/{path}", ct);
        if (!resp.IsSuccessStatusCode) return StatusCode((int)resp.StatusCode, new { error = "github_file_failed" });

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
        var base64 = doc.RootElement.GetProperty("content").GetString()?.Replace("\n", "") ?? "";
        var content = Encoding.UTF8.GetString(Convert.FromBase64String(base64));
        if (content.Length > 50_000) content = content[..50_000] + "\n\n[File truncated — too large to display in full]";

        var htmlUrl = doc.RootElement.TryGetProperty("html_url", out var hu) ? hu.GetString() : null;
        return Ok(new FileContent(path, content, DetectLanguage(path), htmlUrl));
    }

    // GET /api/repos/github/{owner}/{repo}/branches
    [HttpGet("{owner}/{repo}/branches")]
    public async Task<IActionResult> GetBranches(string owner, string repo, CancellationToken ct)
    {
        var (client, _, err) = await GetClient(ct);
        if (err is not null) return err;

        using var resp = await client!.GetAsync($"{GhBase}/repos/{owner}/{repo}/branches?per_page=50", ct);
        if (!resp.IsSuccessStatusCode) return StatusCode((int)resp.StatusCode, new { error = "github_branches_failed" });

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
        var branches = doc.RootElement.EnumerateArray().Select(b => new BranchSummary(
            b.GetProperty("name").GetString() ?? "",
            b.TryGetProperty("protected", out var p) && p.GetBoolean()
        )).ToList();
        return Ok(branches);
    }

    // GET /api/repos/github/{owner}/{repo}/commits?branch=&top=10
    [HttpGet("{owner}/{repo}/commits")]
    public async Task<IActionResult> GetCommits(string owner, string repo, [FromQuery] string? branch, [FromQuery] int top = 10, CancellationToken ct = default)
    {
        var (client, _, err) = await GetClient(ct);
        if (err is not null) return err;

        var branchParam = branch is not null ? $"?sha={Uri.EscapeDataString(branch)}&" : "?";
        using var resp = await client!.GetAsync($"{GhBase}/repos/{owner}/{repo}/commits{branchParam}per_page={top}", ct);
        if (!resp.IsSuccessStatusCode) return StatusCode((int)resp.StatusCode, new { error = "github_commits_failed" });

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
        var commits = doc.RootElement.EnumerateArray().Select(c => new CommitSummary(
            c.GetProperty("sha").GetString()?[..7] ?? "",
            c.TryGetProperty("commit", out var cm) && cm.TryGetProperty("message", out var msg)
                ? msg.GetString()?.Split('\n')[0] ?? "" : "",
            c.TryGetProperty("commit", out var cm2) && cm2.TryGetProperty("author", out var a)
                && a.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "",
            c.TryGetProperty("commit", out var cm3) && cm3.TryGetProperty("author", out var a2)
                && a2.TryGetProperty("date", out var d) ? d.GetString() ?? "" : ""
        )).ToList();
        return Ok(commits);
    }

    // GET /api/repos/github/{owner}/{repo}/pulls
    [HttpGet("{owner}/{repo}/pulls")]
    public async Task<IActionResult> ListPulls(string owner, string repo, CancellationToken ct)
    {
        var (client, _, err) = await GetClient(ct);
        if (err is not null) return err;

        using var resp = await client!.GetAsync($"{GhBase}/repos/{owner}/{repo}/pulls?state=open&per_page=30", ct);
        if (!resp.IsSuccessStatusCode) return StatusCode((int)resp.StatusCode, new { error = "github_prs_failed" });

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
        var prs = doc.RootElement.EnumerateArray().Select(pr => new PullRequestSummary(
            pr.GetProperty("number").GetInt32().ToString(),
            pr.GetProperty("title").GetString() ?? "",
            pr.TryGetProperty("head", out var head) && head.TryGetProperty("ref", out var src) ? src.GetString() ?? "" : "",
            pr.TryGetProperty("base", out var b) && b.TryGetProperty("ref", out var tgt) ? tgt.GetString() ?? "" : "",
            pr.TryGetProperty("user", out var u) && u.TryGetProperty("login", out var login) ? login.GetString() ?? "" : "",
            pr.TryGetProperty("state", out var st) ? st.GetString() ?? "" : "",
            "github",
            $"{owner}/{repo}",
            repo,
            pr.TryGetProperty("html_url", out var url) ? url.GetString() : null,
            pr.TryGetProperty("body", out var body) ? body.GetString() : null
        )).ToList();
        return Ok(prs);
    }

    // POST /api/repos/github/{owner}/{repo}/pulls
    [HttpPost("{owner}/{repo}/pulls")]
    public async Task<IActionResult> CreatePull(string owner, string repo, [FromBody] CreatePrRequest request, CancellationToken ct)
    {
        var (client, _, err) = await GetClient(ct);
        if (err is not null) return err;

        var payload = new { title = request.Title, body = request.Body, head = request.SourceBranch, @base = request.TargetBranch };
        using var req = new HttpRequestMessage(HttpMethod.Post, $"{GhBase}/repos/{owner}/{repo}/pulls");
        req.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        using var resp = await client!.SendAsync(req, ct);
        var respBody = await resp.Content.ReadAsStringAsync(ct);
        return resp.IsSuccessStatusCode
            ? StatusCode(201, JsonDocument.Parse(respBody).RootElement)
            : StatusCode((int)resp.StatusCode, new { error = "github_create_pr_failed" });
    }

    // POST /api/repos/github/{owner}/{repo}/pulls/{n}/reviews
    [HttpPost("{owner}/{repo}/pulls/{n:int}/reviews")]
    public async Task<IActionResult> SubmitReview(string owner, string repo, int n, [FromBody] ReviewRequest request, CancellationToken ct)
    {
        var (client, _, err) = await GetClient(ct);
        if (err is not null) return err;

        var payload = new { body = request.Body, @event = request.Event };
        using var req = new HttpRequestMessage(HttpMethod.Post, $"{GhBase}/repos/{owner}/{repo}/pulls/{n}/reviews");
        req.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        using var resp = await client!.SendAsync(req, ct);
        return resp.IsSuccessStatusCode ? NoContent() : StatusCode((int)resp.StatusCode, new { error = "github_review_failed" });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private record GhContext(HttpClient? Client, string? Org, IActionResult? Error);

    private async Task<GhContext> GetClient(CancellationToken ct)
    {
        var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (userId is null) return new(null, null, Unauthorized());

        var user = await _db.Users.FindAsync(new object[] { userId }, ct);
        if (user?.GitHubPatEncrypted is null || user.GitHubOrganization is null)
            return new(null, null, BadRequest(new { error = "github_not_configured", message = "Set your GitHub org and PAT in Profile Settings." }));

        var pat = _encryption.Decrypt(user.GitHubPatEncrypted);
        var client = _httpClientFactory.CreateClient("github");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", pat);
        client.DefaultRequestHeaders.UserAgent.ParseAdd("AgpCommandStation/1.0");
        client.DefaultRequestHeaders.Accept.ParseAdd("application/vnd.github+json");
        client.DefaultRequestHeaders.Add("X-GitHub-Api-Version", "2022-11-28");

        return new(client, user.GitHubOrganization, null);
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
}
