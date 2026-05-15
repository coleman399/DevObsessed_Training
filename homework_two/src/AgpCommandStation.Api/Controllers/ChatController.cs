using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text.Json;
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

    private string? UserId() => User.FindFirstValue(JwtRegisteredClaimNames.Sub);
}
