using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
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
