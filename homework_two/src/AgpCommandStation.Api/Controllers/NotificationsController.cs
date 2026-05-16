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

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly IHttpClientFactory _http;
    private readonly AppDbContext _db;

    public NotificationsController(IHttpClientFactory http, AppDbContext db)
    {
        _http = http;
        _db = db;
    }

    // GET /api/notifications
    [HttpGet]
    public async Task<IActionResult> GetNotifications(CancellationToken ct)
    {
        var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (userId is null) return Unauthorized();

        var user = await _db.Users.FindAsync(new object[] { userId }, ct);
        var devOpsToken = Request.Headers["X-DevOps-Token"].FirstOrDefault();
        var graphToken  = Request.Headers["X-Graph-Token"].FirstOrDefault();

        var tasks = new List<Task<IEnumerable<NotificationDto>>>();

        if (devOpsToken is not null && user?.DevOpsOrganization is not null)
        {
            tasks.Add(GetAdoWorkItemNotifications(devOpsToken, user.DevOpsOrganization, user.DevOpsProject, ct));
            tasks.Add(GetAdoPrNotifications(userId, devOpsToken, user.DevOpsOrganization, user.DevOpsProject, ct));
        }

        if (graphToken is not null)
        {
            tasks.Add(GetEmailNotifications(graphToken, ct));
            tasks.Add(GetMeetingNotifications(graphToken, ct));
            tasks.Add(GetTeamsMentions(graphToken, ct));
        }

        var all = await Task.WhenAll(tasks);
        var notifications = all.SelectMany(n => n)
            .OrderByDescending(n => n.Timestamp)
            .Take(30)
            .ToList();

        return Ok(notifications);
    }

    // ── ADO ───────────────────────────────────────────────────────────────────

    private async Task<IEnumerable<NotificationDto>> GetAdoWorkItemNotifications(
        string token, string org, string? project, CancellationToken ct)
    {
        try
        {
            var client = AdoClient(token);
            var baseUrl = $"https://dev.azure.com/{Uri.EscapeDataString(org)}" +
                          (project is not null ? $"/{Uri.EscapeDataString(project)}" : "") + "/_apis";

            var wiql = new { query = "SELECT [Id],[Title],[AssignedTo],[ChangedDate] FROM WorkItems " +
                "WHERE [Assigned To] = @Me AND [State] <> 'Closed' AND [Changed Date] > @Today - 1 " +
                "ORDER BY [Changed Date] DESC" };

            using var req = new HttpRequestMessage(HttpMethod.Post,
                $"{baseUrl}/wit/wiql?api-version=7.1")
            {
                Content = new StringContent(JsonSerializer.Serialize(wiql), Encoding.UTF8, "application/json")
            };
            using var resp = await client.SendAsync(req, ct);
            if (!resp.IsSuccessStatusCode) return [];

            using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
            var ids = doc.RootElement.GetProperty("workItems").EnumerateArray()
                .Take(5).Select(i => i.GetProperty("id").GetInt32()).ToList();
            if (ids.Count == 0) return [];

            using var batchReq = new HttpRequestMessage(HttpMethod.Get,
                $"{baseUrl}/wit/workitems?ids={string.Join(',', ids)}&fields=System.Id,System.Title,System.WorkItemType&api-version=7.1");
            using var batchResp = await client.SendAsync(batchReq, ct);
            if (!batchResp.IsSuccessStatusCode) return [];

            using var batchDoc = JsonDocument.Parse(await batchResp.Content.ReadAsStringAsync(ct));
            return batchDoc.RootElement.GetProperty("value").EnumerateArray().Select(item =>
            {
                var fields = item.GetProperty("fields");
                var id = fields.TryGetProperty("System.Id", out var sid) ? sid.GetInt32().ToString() : "?";
                var title = fields.TryGetProperty("System.Title", out var t) ? t.GetString() ?? "Work item" : "Work item";
                var type = fields.TryGetProperty("System.WorkItemType", out var wt) ? wt.GetString() ?? "Item" : "Item";
                return new NotificationDto(
                    $"wi-{id}", "work_item",
                    $"{type} updated: {title}",
                    $"#{id} was recently changed.",
                    "workitems",
                    DateTimeOffset.UtcNow.AddMinutes(-15).ToString("o"),
                    false
                );
            }).ToList();
        }
        catch { return []; }
    }

    private async Task<IEnumerable<NotificationDto>> GetAdoPrNotifications(
        string userId, string token, string org, string? project, CancellationToken ct)
    {
        try
        {
            var client = AdoClient(token);
            var baseUrl = $"https://dev.azure.com/{Uri.EscapeDataString(org)}" +
                          (project is not null ? $"/{Uri.EscapeDataString(project)}" : "") + "/_apis";

            using var resp = await client.GetAsync(
                $"{baseUrl}/git/pullrequests?searchCriteria.reviewerId={userId}&api-version=7.1", ct);
            if (!resp.IsSuccessStatusCode) return [];

            using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
            return doc.RootElement.GetProperty("value").EnumerateArray().Take(5).Select(pr => new NotificationDto(
                $"pr-{(pr.TryGetProperty("pullRequestId", out var pid) ? pid.GetInt32().ToString() : Guid.NewGuid().ToString())}",
                "pr_review",
                $"PR review requested: {(pr.TryGetProperty("title", out var t) ? t.GetString() : "Pull request")}",
                $"Review requested by {(pr.TryGetProperty("createdBy", out var cb) && cb.TryGetProperty("displayName", out var dn) ? dn.GetString() : "someone")}.",
                "repos",
                pr.TryGetProperty("creationDate", out var cd) ? cd.GetString() ?? DateTimeOffset.UtcNow.ToString("o") : DateTimeOffset.UtcNow.ToString("o"),
                false
            )).ToList();
        }
        catch { return []; }
    }

    // ── Graph ─────────────────────────────────────────────────────────────────

    private async Task<IEnumerable<NotificationDto>> GetEmailNotifications(string token, CancellationToken ct)
    {
        try
        {
            var client = GraphClient(token);
            using var resp = await client.GetAsync(
                "https://graph.microsoft.com/v1.0/me/messages?$filter=isRead eq false&$top=5" +
                "&$select=id,subject,from,receivedDateTime&$orderby=receivedDateTime desc", ct);
            if (!resp.IsSuccessStatusCode) return [];

            using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
            return doc.RootElement.GetProperty("value").EnumerateArray().Select(m => new NotificationDto(
                $"email-{(m.TryGetProperty("id", out var id) ? id.GetString() : Guid.NewGuid().ToString())}",
                "email",
                m.TryGetProperty("subject", out var s) ? s.GetString() ?? "New email" : "New email",
                $"From {(m.TryGetProperty("from", out var f) && f.TryGetProperty("emailAddress", out var ea) && ea.TryGetProperty("name", out var n) ? n.GetString() : "someone")}",
                "email",
                m.TryGetProperty("receivedDateTime", out var rd) ? rd.GetString() ?? DateTimeOffset.UtcNow.ToString("o") : DateTimeOffset.UtcNow.ToString("o"),
                false
            )).ToList();
        }
        catch { return []; }
    }

    private async Task<IEnumerable<NotificationDto>> GetMeetingNotifications(string token, CancellationToken ct)
    {
        try
        {
            var client = GraphClient(token);
            var start = DateTimeOffset.UtcNow;
            var end   = start.AddMinutes(30);
            using var resp = await client.GetAsync(
                $"https://graph.microsoft.com/v1.0/me/calendarView" +
                $"?startDateTime={start:o}&endDateTime={end:o}" +
                "&$select=id,subject,start,onlineMeeting&$top=3", ct);
            if (!resp.IsSuccessStatusCode) return [];

            using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
            return doc.RootElement.GetProperty("value").EnumerateArray().Select(e => new NotificationDto(
                $"meeting-{(e.TryGetProperty("id", out var id) ? id.GetString() : Guid.NewGuid().ToString())}",
                "meeting",
                $"Starting soon: {(e.TryGetProperty("subject", out var s) ? s.GetString() : "Meeting")}",
                "Meeting starts in ≤15 minutes.",
                "calendar",
                e.TryGetProperty("start", out var st) && st.TryGetProperty("dateTime", out var dt) ? dt.GetString() ?? start.ToString("o") : start.ToString("o"),
                false
            )).ToList();
        }
        catch { return []; }
    }

    private async Task<IEnumerable<NotificationDto>> GetTeamsMentions(string token, CancellationToken ct)
    {
        try
        {
            var client = GraphClient(token);
            using var resp = await client.GetAsync(
                "https://graph.microsoft.com/v1.0/me/chats?$expand=lastMessagePreview&$top=5", ct);
            if (!resp.IsSuccessStatusCode) return [];

            using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
            return doc.RootElement.GetProperty("value").EnumerateArray()
                .Where(c => {
                    if (!c.TryGetProperty("lastMessagePreview", out var lm)) return false;
                    if (!lm.TryGetProperty("body", out var b)) return false;
                    var content = b.TryGetProperty("content", out var bc) ? bc.GetString() ?? "" : "";
                    return content.Contains('@', StringComparison.Ordinal);
                })
                .Take(3)
                .Select(c => new NotificationDto(
                    $"teams-{(c.TryGetProperty("id", out var id) ? id.GetString() : Guid.NewGuid().ToString())}",
                    "mention",
                    $"@mention in {(c.TryGetProperty("topic", out var t) && t.ValueKind != JsonValueKind.Null ? t.GetString() : "Teams chat")}",
                    c.TryGetProperty("lastMessagePreview", out var lm2) && lm2.TryGetProperty("body", out var b2)
                        && b2.TryGetProperty("content", out var bc2) ? (bc2.GetString() ?? "")
                            .Replace("<[^>]+>", "")[..Math.Min(80, (bc2.GetString() ?? "").Length)] : "",
                    "teams",
                    DateTimeOffset.UtcNow.AddMinutes(-5).ToString("o"),
                    false
                )).ToList();
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

    private HttpClient GraphClient(string token)
    {
        var c = _http.CreateClient("graph");
        c.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return c;
    }
}
