using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text.Json;
using System.Text.RegularExpressions;
using AgpCommandStation.Api.Dtos;
using AgpCommandStation.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AgpCommandStation.Api.Controllers;

[ApiController]
[Route("api/chat")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IAnthropicChatService _chat;

    public ChatController(IAnthropicChatService chat) => _chat = chat;

    [HttpGet("conversations")]
    public async Task<IActionResult> ListConversations(CancellationToken ct)
    {
        var userId = UserId();
        if (userId is null) return Unauthorized();
        return Ok(await _chat.ListConversationsAsync(userId, ct));
    }

    [HttpPost("conversations")]
    public async Task<IActionResult> StartConversation(CancellationToken ct)
    {
        var userId = UserId();
        if (userId is null) return Unauthorized();
        var detail = await _chat.StartConversationAsync(userId, ct);
        return CreatedAtAction(nameof(GetConversation), new { id = detail.Id }, detail);
    }

    [HttpGet("conversations/{id}")]
    public async Task<IActionResult> GetConversation(string id, CancellationToken ct)
    {
        var userId = UserId();
        if (userId is null) return Unauthorized();
        var detail = await _chat.GetConversationAsync(userId, id, ct);
        if (detail is null) return NotFound();
        return Ok(detail);
    }

    [HttpPatch("conversations/{id}")]
    public async Task<IActionResult> UpdateTitle(string id, [FromBody] UpdateTitleRequest request, CancellationToken ct)
    {
        var userId = UserId();
        if (userId is null) return Unauthorized();
        var updated = await _chat.UpdateTitleAsync(userId, id, request.Title, ct);
        return updated ? NoContent() : NotFound();
    }

    [HttpPost("conversations/{id}/messages")]
    public async Task SendMessage(string id, [FromBody] SendMessageRequest request, CancellationToken ct)
    {
        var userId = UserId();
        if (userId is null) { Response.StatusCode = 401; return; }

        var exists = await _chat.GetConversationAsync(userId, id, ct);
        if (exists is null) { Response.StatusCode = 404; return; }

        Response.ContentType = "text/event-stream";
        Response.Headers.CacheControl = "no-cache";
        Response.Headers["X-Accel-Buffering"] = "no";

        try
        {
            await foreach (var token in _chat.StreamReplyAsync(userId, id, request.Message, ct))
            {
                await Response.WriteAsync($"data: {JsonSerializer.Serialize(new { token })}\n\n", ct);
                await Response.Body.FlushAsync(ct);
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            await Response.WriteAsync($"data: {JsonSerializer.Serialize(new { error = "stream_failed" })}\n\n", ct);
        }
        finally
        {
            await Response.WriteAsync("data: [DONE]\n\n", ct);
            await Response.Body.FlushAsync(ct);
        }
    }

    // POST /api/chat/workitem-draft
    [HttpPost("workitem-draft")]
    public async Task<IActionResult> WorkItemDraft([FromBody] WorkItemDraftRequest request, CancellationToken ct)
    {
        var userId = UserId();
        if (userId is null) return Unauthorized();

        const string system = """
            You are a concise Azure DevOps work item author.
            Return ONLY a valid JSON object — no markdown fences, no preamble, no explanation.
            Match the exact schema for the requested type:

            Bug:
            { "workItemType": "Bug", "title": "...", "description": "...", "reproSteps": "...", "tags": ["..."] }

            Task:
            { "workItemType": "Task", "title": "...", "description": "...", "remainingWork": 4, "tags": ["..."] }

            User Story:
            { "workItemType": "User Story", "title": "...", "description": "...", "acceptanceCriteria": ["Given...", "When...", "Then..."], "tags": ["..."] }

            Rules:
            - title: concise (≤10 words)
            - description: 1–3 sentences
            - reproSteps (Bug only): numbered steps as a single string
            - remainingWork (Task only): integer hours estimate
            - acceptanceCriteria (User Story only): 3–5 Given/When/Then strings
            - tags: 2–4 relevant tags
            """;

        var userPrompt = $"Type: {request.WorkItemType}\nDescription: {request.Description}";

        try
        {
            var raw = await _chat.GetStructuredJsonAsync(userId, system, userPrompt, ct);

            // Strip accidental markdown fences if Claude wraps in ```json
            var json = Regex.Replace(raw.Trim(), @"^```[a-z]*\n?|```$", "", RegexOptions.Multiline).Trim();

            var draft = JsonSerializer.Deserialize<WorkItemDraftResponse>(json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            return Ok(draft);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return StatusCode(502, new { error = "draft_failed", message = ex.Message });
        }
    }

    // POST /api/chat/pr-draft — draft a PR title + body from recent commits
    [HttpPost("pr-draft")]
    public async Task<IActionResult> PrDraft([FromBody] PrDraftRequest request, CancellationToken ct)
    {
        var userId = UserId();
        if (userId is null) return Unauthorized();

        const string system = """
            You are a pull request author. Return ONLY a valid JSON object, no markdown.
            Schema: { "title": "...", "body": "..." }
            Rules:
            - title: imperative sentence ≤72 chars summarizing the change
            - body: 3-5 bullet points covering what changed, why, and what to watch
              Use markdown: start with ## Summary, then bullet points
            - Be concise and specific, reference the branch name and commit messages
            """;

        var userPrompt = $"Platform: {request.Platform}\nRepo: {request.RepoId}\n" +
                         $"Source branch: {request.SourceBranch} → Target: {request.TargetBranch}\n\n" +
                         $"Write a PR title and description.";

        try
        {
            var raw = await _chat.GetStructuredJsonAsync(userId, system, userPrompt, ct);
            var json = Regex.Replace(raw.Trim(), @"^```[a-z]*\n?|```$", "", RegexOptions.Multiline).Trim();
            var draft = JsonSerializer.Deserialize<PrDraftResponse>(json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            return Ok(draft);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return StatusCode(502, new { error = "pr_draft_failed", message = ex.Message });
        }
    }

    // POST /api/chat/pr-summary — summarize a PR
    [HttpPost("pr-summary")]
    public async Task<IActionResult> PrSummary([FromBody] PrSummaryRequest request, CancellationToken ct)
    {
        var userId = UserId();
        if (userId is null) return Unauthorized();

        const string system = """
            You are a code reviewer. Write a plain-English summary of the pull request.
            3-5 sentences covering: what changed, why, and what reviewers should pay attention to.
            No markdown, no bullet points. Just prose.
            """;

        var files = request.ChangedFiles.Take(20);
        var userPrompt = $"PR: {request.Title}\n\nDescription: {request.Description ?? "(none)"}\n\n" +
                         $"Changed files:\n{string.Join("\n", files)}";

        try
        {
            var summary = await _chat.GetStructuredJsonAsync(userId, system, userPrompt, ct);
            return Ok(new { summary = summary.Trim() });
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return StatusCode(502, new { error = "pr_summary_failed", message = ex.Message });
        }
    }

    // POST /api/chat/email-draft — draft a reply or new email body
    [HttpPost("email-draft")]
    public async Task<IActionResult> EmailDraft([FromBody] EmailDraftRequest request, CancellationToken ct)
    {
        var userId = UserId();
        if (userId is null) return Unauthorized();

        const string system = """
            You are a professional email writer. Return ONLY a valid JSON object, no markdown.
            Schema: { "subject": "...", "body": "..." }
            Rules:
            - body: plain HTML paragraphs (<p>...</p>), professional tone
            - subject: keep or improve the existing subject, prefix with "Re: " if replying
            - be concise and direct
            """;

        var userPrompt = string.IsNullOrWhiteSpace(request.EmailBody)
            ? $"Write a new email. Subject: {request.EmailSubject}"
            : $"Draft a reply to this email.\nSubject: {request.EmailSubject}\n\nEmail body:\n{request.EmailBody}";

        try
        {
            var raw = await _chat.GetStructuredJsonAsync(userId, system, userPrompt, ct);
            var json = Regex.Replace(raw.Trim(), @"^```[a-z]*\n?|```$", "", RegexOptions.Multiline).Trim();
            var draft = JsonSerializer.Deserialize<EmailDraftResponse>(json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            return Ok(draft);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return StatusCode(502, new { error = "email_draft_failed", message = ex.Message });
        }
    }

    // POST /api/chat/event-draft — draft a calendar event
    [HttpPost("event-draft")]
    public async Task<IActionResult> EventDraft([FromBody] EventDraftRequest request, CancellationToken ct)
    {
        var userId = UserId();
        if (userId is null) return Unauthorized();

        var today = DateTimeOffset.UtcNow.ToString("yyyy-MM-dd");
        var system = $$"""
            You are a calendar assistant. Today is {{today}}. Return ONLY a valid JSON object, no markdown.
            Schema: {"title": "...", "startTime": "YYYY-MM-DDTHH:MM:00", "endTime": "YYYY-MM-DDTHH:MM:00", "attendees": ["email@example.com"], "description": "..."}
            Rules:
            - Use ISO 8601 UTC format for startTime/endTime
            - Default duration: 1 hour if not specified
            - If no date mentioned, schedule for tomorrow at 10:00 AM UTC
            - attendees: array of email addresses (empty array if none mentioned)
            - description: 1-2 sentences summarizing the meeting
            """;

        try
        {
            var raw = await _chat.GetStructuredJsonAsync(userId, system, request.Description, ct);
            var json = Regex.Replace(raw.Trim(), @"^```[a-z]*\n?|```$", "", RegexOptions.Multiline).Trim();
            var draft = JsonSerializer.Deserialize<EventDraftResponse>(json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            return Ok(draft);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return StatusCode(502, new { error = "event_draft_failed", message = ex.Message });
        }
    }

    // POST /api/chat/message-polish — polish a Teams message
    [HttpPost("message-polish")]
    public async Task<IActionResult> MessagePolish([FromBody] MessagePolishRequest request, CancellationToken ct)
    {
        var userId = UserId();
        if (userId is null) return Unauthorized();

        const string system = """
            You are a professional communicator. Return ONLY a JSON object, no markdown.
            Schema: { "polishedMessage": "..." }
            Rules:
            - Improve clarity, tone, and grammar
            - Keep the same intent and approximate length
            - Professional but friendly, suitable for a Teams channel
            - No exclamation marks
            """;

        try
        {
            var raw = await _chat.GetStructuredJsonAsync(userId, system, $"Polish this message:\n{request.Message}", ct);
            var json = Regex.Replace(raw.Trim(), @"^```[a-z]*\n?|```$", "", RegexOptions.Multiline).Trim();
            var result = JsonSerializer.Deserialize<MessagePolishResponse>(json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            return Ok(result);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return StatusCode(502, new { error = "polish_failed", message = ex.Message });
        }
    }

    private string? UserId() => User.FindFirstValue(JwtRegisteredClaimNames.Sub);
}
