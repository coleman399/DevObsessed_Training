using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.IdentityModel.Tokens.Jwt;
using AgpCommandStation.Api.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AgpCommandStation.Api.Controllers;

/// <summary>
/// Proxies Microsoft Graph API calls for Outlook, Calendar, and Teams.
/// The frontend sends the Microsoft Graph access token as X-Graph-Token;
/// this controller forwards it as Bearer to Graph.
/// </summary>
[ApiController]
[Route("api/graph")]
[Authorize]
public class GraphController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private const string GraphBase = "https://graph.microsoft.com/v1.0";

    public GraphController(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    // ── Mail ──────────────────────────────────────────────────────────────────

    // GET /api/graph/mail — list unread messages
    [HttpGet("mail")]
    public async Task<IActionResult> ListMail(CancellationToken ct)
    {
        var (client, err) = GetClient();
        if (err is not null) return err;

        var url = $"{GraphBase}/me/messages?$filter=isRead eq false&$top=20" +
                  "&$select=id,subject,from,receivedDateTime,bodyPreview,isRead" +
                  "&$orderby=receivedDateTime desc";

        using var resp = await client!.GetAsync(url, ct);
        if (!resp.IsSuccessStatusCode)
            return StatusCode((int)resp.StatusCode, new { error = "graph_mail_failed" });

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
        var messages = doc.RootElement.GetProperty("value").EnumerateArray().Select(m => new MailMessage(
            m.GetProperty("id").GetString() ?? "",
            m.TryGetProperty("subject", out var s) ? s.GetString() ?? "(no subject)" : "(no subject)",
            m.TryGetProperty("from", out var from) && from.TryGetProperty("emailAddress", out var ea)
                ? ea.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "" : "",
            m.TryGetProperty("from", out var from2) && from2.TryGetProperty("emailAddress", out var ea2)
                ? ea2.TryGetProperty("address", out var a) ? a.GetString() ?? "" : "" : "",
            m.TryGetProperty("receivedDateTime", out var rd) ? rd.GetString() ?? "" : "",
            m.TryGetProperty("bodyPreview", out var bp) ? bp.GetString() ?? "" : "",
            m.TryGetProperty("isRead", out var ir) && ir.GetBoolean()
        )).ToList();

        return Ok(messages);
    }

    // GET /api/graph/mail/{id}
    [HttpGet("mail/{id}")]
    public async Task<IActionResult> GetMail(string id, CancellationToken ct)
    {
        var (client, err) = GetClient();
        if (err is not null) return err;

        using var resp = await client!.GetAsync(
            $"{GraphBase}/me/messages/{id}?$select=id,subject,from,receivedDateTime,body", ct);
        if (!resp.IsSuccessStatusCode)
            return StatusCode((int)resp.StatusCode, new { error = "graph_mail_get_failed" });

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
        var m = doc.RootElement;
        var detail = new MailMessageDetail(
            m.GetProperty("id").GetString() ?? "",
            m.TryGetProperty("subject", out var s) ? s.GetString() ?? "" : "",
            m.TryGetProperty("from", out var from) && from.TryGetProperty("emailAddress", out var ea)
                ? ea.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "" : "",
            m.TryGetProperty("from", out var from2) && from2.TryGetProperty("emailAddress", out var ea2)
                ? ea2.TryGetProperty("address", out var a) ? a.GetString() ?? "" : "" : "",
            m.TryGetProperty("receivedDateTime", out var rd) ? rd.GetString() ?? "" : "",
            m.TryGetProperty("body", out var b) && b.TryGetProperty("content", out var c)
                ? c.GetString() ?? "" : ""
        );

        return Ok(detail);
    }

    // POST /api/graph/mail/send
    [HttpPost("mail/send")]
    public async Task<IActionResult> SendMail([FromBody] SendMailRequest request, CancellationToken ct)
    {
        var (client, err) = GetClient();
        if (err is not null) return err;

        object payload;
        if (request.ReplyToMessageId is not null)
        {
            // Reply
            var replyBody = new { message = new { body = new { contentType = "HTML", content = request.Body } } };
            using var replyReq = new HttpRequestMessage(HttpMethod.Post,
                $"{GraphBase}/me/messages/{request.ReplyToMessageId}/reply");
            replyReq.Content = new StringContent(JsonSerializer.Serialize(replyBody), Encoding.UTF8, "application/json");
            using var replyResp = await client!.SendAsync(replyReq, ct);
            return replyResp.IsSuccessStatusCode ? NoContent() : StatusCode((int)replyResp.StatusCode, new { error = "graph_reply_failed" });
        }

        // New email
        payload = new
        {
            message = new
            {
                subject = request.Subject,
                body = new { contentType = "HTML", content = request.Body },
                toRecipients = new[] { new { emailAddress = new { address = request.ToEmail } } },
            }
        };

        using var sendReq = new HttpRequestMessage(HttpMethod.Post, $"{GraphBase}/me/sendMail");
        sendReq.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        using var sendResp = await client!.SendAsync(sendReq, ct);
        return sendResp.IsSuccessStatusCode ? NoContent() : StatusCode((int)sendResp.StatusCode, new { error = "graph_send_failed" });
    }

    // ── Calendar ──────────────────────────────────────────────────────────────

    // GET /api/graph/calendar?start=&end=
    [HttpGet("calendar")]
    public async Task<IActionResult> GetCalendar(
        [FromQuery] string start,
        [FromQuery] string end,
        CancellationToken ct)
    {
        var (client, err) = GetClient();
        if (err is not null) return err;

        var url = $"{GraphBase}/me/calendarView" +
                  $"?startDateTime={Uri.EscapeDataString(start)}" +
                  $"&endDateTime={Uri.EscapeDataString(end)}" +
                  "&$select=id,subject,start,end,isAllDay,onlineMeeting,location,attendees" +
                  "&$orderby=start/dateTime";

        using var resp = await client!.GetAsync(url, ct);
        if (!resp.IsSuccessStatusCode)
            return StatusCode((int)resp.StatusCode, new { error = "graph_cal_failed" });

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
        var events = doc.RootElement.GetProperty("value").EnumerateArray().Select(e => new CalendarEvent(
            e.GetProperty("id").GetString() ?? "",
            e.TryGetProperty("subject", out var sub) ? sub.GetString() ?? "" : "",
            e.TryGetProperty("start", out var st) && st.TryGetProperty("dateTime", out var sd)
                ? sd.GetString() ?? "" : "",
            e.TryGetProperty("end", out var en) && en.TryGetProperty("dateTime", out var ed)
                ? ed.GetString() ?? "" : "",
            e.TryGetProperty("isAllDay", out var iad) && iad.GetBoolean(),
            e.TryGetProperty("onlineMeeting", out var om) && om.TryGetProperty("joinUrl", out var ju)
                ? ju.GetString() : null,
            e.TryGetProperty("location", out var loc) && loc.TryGetProperty("displayName", out var dn)
                ? dn.GetString() : null,
            e.TryGetProperty("attendees", out var att)
                ? att.EnumerateArray()
                    .Select(a => a.TryGetProperty("emailAddress", out var ae) && ae.TryGetProperty("address", out var adr)
                        ? adr.GetString() ?? "" : "")
                    .Where(a => !string.IsNullOrEmpty(a))
                    .ToArray()
                : null
        )).ToList();

        return Ok(events);
    }

    // POST /api/graph/calendar/events
    [HttpPost("calendar/events")]
    public async Task<IActionResult> CreateEvent([FromBody] CreateEventRequest request, CancellationToken ct)
    {
        var (client, err) = GetClient();
        if (err is not null) return err;

        var attendees = request.Attendees?
            .Where(a => !string.IsNullOrWhiteSpace(a))
            .Select(a => new { emailAddress = new { address = a }, type = "required" })
            .ToArray();

        object payload;
        if (request.AddTeamsMeeting)
        {
            payload = new
            {
                subject = request.Title,
                start = new { dateTime = request.StartTime, timeZone = "UTC" },
                end = new { dateTime = request.EndTime, timeZone = "UTC" },
                body = new { contentType = "HTML", content = request.Description ?? "" },
                attendees = attendees ?? Array.Empty<object>(),
                isOnlineMeeting = true,
                onlineMeetingProvider = "teamsForBusiness",
            };
        }
        else
        {
            payload = new
            {
                subject = request.Title,
                start = new { dateTime = request.StartTime, timeZone = "UTC" },
                end = new { dateTime = request.EndTime, timeZone = "UTC" },
                body = new { contentType = "HTML", content = request.Description ?? "" },
                attendees = attendees ?? Array.Empty<object>(),
            };
        }

        using var req = new HttpRequestMessage(HttpMethod.Post, $"{GraphBase}/me/events");
        req.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        using var resp = await client!.SendAsync(req, ct);

        if (!resp.IsSuccessStatusCode)
            return StatusCode((int)resp.StatusCode, new { error = "graph_create_event_failed" });

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
        return StatusCode(201, doc.RootElement);
    }

    // ── Teams ─────────────────────────────────────────────────────────────────

    // GET /api/graph/teams/chats — @mentions + recent chats
    [HttpGet("teams/chats")]
    public async Task<IActionResult> GetChats(CancellationToken ct)
    {
        var (client, err) = GetClient();
        if (err is not null) return err;

        using var resp = await client!.GetAsync(
            $"{GraphBase}/me/chats?$expand=lastMessagePreview&$top=15", ct);
        if (!resp.IsSuccessStatusCode)
            return StatusCode((int)resp.StatusCode, new { error = "graph_chats_failed" });

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
        var chats = doc.RootElement.GetProperty("value").EnumerateArray().Select(c => new TeamsChat(
            c.GetProperty("id").GetString() ?? "",
            c.TryGetProperty("topic", out var t) && t.ValueKind != JsonValueKind.Null ? t.GetString() ?? "Chat" : "Chat",
            c.TryGetProperty("lastMessagePreview", out var lm) && lm.TryGetProperty("body", out var b)
                && b.TryGetProperty("content", out var bc) ? bc.GetString() ?? "" : "",
            c.TryGetProperty("lastMessagePreview", out var lm2) && lm2.TryGetProperty("createdDateTime", out var cd)
                ? cd.GetString() ?? "" : ""
        )).ToList();

        return Ok(chats);
    }

    // GET /api/graph/teams/channels/{teamId}/{channelId}
    [HttpGet("teams/channels/{teamId}/{channelId}")]
    public async Task<IActionResult> GetChannelMessages(
        string teamId, string channelId, CancellationToken ct)
    {
        var (client, err) = GetClient();
        if (err is not null) return err;

        using var resp = await client!.GetAsync(
            $"{GraphBase}/teams/{teamId}/channels/{channelId}/messages?$top=10", ct);
        if (!resp.IsSuccessStatusCode)
            return StatusCode((int)resp.StatusCode, new { error = "graph_channel_msgs_failed" });

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
        var messages = doc.RootElement.GetProperty("value").EnumerateArray().Select(m => new ChannelMessage(
            m.GetProperty("id").GetString() ?? "",
            m.TryGetProperty("from", out var from) && from.TryGetProperty("user", out var u)
                && u.TryGetProperty("displayName", out var dn) ? dn.GetString() ?? "Unknown" : "Unknown",
            m.TryGetProperty("createdDateTime", out var cd) ? cd.GetString() ?? "" : "",
            m.TryGetProperty("body", out var b) && b.TryGetProperty("content", out var bc)
                ? bc.GetString() ?? "" : ""
        )).ToList();

        return Ok(messages);
    }

    // POST /api/graph/teams/channels/{teamId}/{channelId}
    [HttpPost("teams/channels/{teamId}/{channelId}")]
    public async Task<IActionResult> PostToChannel(
        string teamId, string channelId,
        [FromBody] SendChannelMessageRequest request,
        CancellationToken ct)
    {
        var (client, err) = GetClient();
        if (err is not null) return err;

        var payload = new { body = new { content = request.Content } };
        using var req = new HttpRequestMessage(HttpMethod.Post,
            $"{GraphBase}/teams/{teamId}/channels/{channelId}/messages");
        req.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        using var resp = await client!.SendAsync(req, ct);
        return resp.IsSuccessStatusCode
            ? NoContent()
            : StatusCode((int)resp.StatusCode, new { error = "graph_post_failed" });
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private (HttpClient? client, IActionResult? error) GetClient()
    {
        var graphToken = Request.Headers["X-Graph-Token"].FirstOrDefault();
        if (string.IsNullOrEmpty(graphToken))
            return (null, BadRequest(new { error = "missing_graph_token" }));

        var client = _httpClientFactory.CreateClient("graph");
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", graphToken);
        return (client, null);
    }
}
