using System.Net.Http.Headers;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using WelcomeApp.Api.Data;
using WelcomeApp.Api.Dtos;
using WelcomeApp.Api.Models;

namespace WelcomeApp.Api.Services;

public class ChatService : IChatService
{
    private readonly HttpClient _http;
    private readonly IOptions<ChatOptions> _opts;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IClock _clock;

    public ChatService(HttpClient http, IOptions<ChatOptions> opts, IServiceScopeFactory scopeFactory, IClock clock)
    {
        _http = http;
        _opts = opts;
        _scopeFactory = scopeFactory;
        _clock = clock;
    }

    public async Task<ConversationDetailDto> StartConversationAsync(string userId, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var user = await db.Users.FindAsync(new object[] { userId }, ct);
        var firstName = FirstName(user?.DisplayName);

        var now = _clock.Now;
        var conversation = new Conversation
        {
            UserId = userId,
            Title = "New conversation",
            CreatedAt = now,
            UpdatedAt = now,
        };
        db.Conversations.Add(conversation);
        await db.SaveChangesAsync(ct);

        var greeting = new ChatMessage
        {
            ConversationId = conversation.Id,
            Role = "assistant",
            Content = $"Hey {firstName}, what are we working on first?",
            CreatedAt = now,
        };
        db.ChatMessages.Add(greeting);
        await db.SaveChangesAsync(ct);

        return new ConversationDetailDto(
            conversation.Id,
            conversation.Title,
            conversation.UpdatedAt,
            new[] { new ChatMessageDto(greeting.Id, greeting.Role, greeting.Content, greeting.CreatedAt) });
    }

    public async Task<IReadOnlyList<ConversationSummaryDto>> ListConversationsAsync(string userId, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        return await db.Conversations
            .Where(c => c.UserId == userId)
            .Where(c => db.ChatMessages.Any(m => m.ConversationId == c.Id && m.Role == "user"))
            .OrderByDescending(c => c.UpdatedAt)
            .Take(20)
            .Select(c => new ConversationSummaryDto(
                c.Id,
                c.Title,
                c.UpdatedAt,
                db.ChatMessages.Count(m => m.ConversationId == c.Id)))
            .ToListAsync(ct);
    }

    public async Task<ConversationDetailDto?> GetConversationAsync(string userId, string conversationId, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var conv = await db.Conversations
            .Include(c => c.Messages)
            .FirstOrDefaultAsync(c => c.Id == conversationId && c.UserId == userId, ct);

        if (conv is null) return null;

        var messages = conv.Messages
            .OrderBy(m => m.CreatedAt)
            .Select(m => new ChatMessageDto(m.Id, m.Role, m.Content, m.CreatedAt))
            .ToList();

        return new ConversationDetailDto(conv.Id, conv.Title, conv.UpdatedAt, messages);
    }

    public async Task<bool> UpdateTitleAsync(string userId, string conversationId, string newTitle, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var conv = await db.Conversations
            .FirstOrDefaultAsync(c => c.Id == conversationId && c.UserId == userId, ct);

        if (conv is null) return false;

        conv.Title = newTitle.Trim();
        conv.UpdatedAt = _clock.Now;
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async IAsyncEnumerable<string> StreamReplyAsync(
        string userId,
        string conversationId,
        string userText,
        [EnumeratorCancellation] CancellationToken ct)
    {
        var opts = _opts.Value;
        string systemPrompt;
        List<(string Role, string Content)> historyWindow;

        // Phase 1: load context, save user message, update title if first turn
        using (var scope = _scopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var conv = await db.Conversations
                .Include(c => c.Messages)
                .FirstOrDefaultAsync(c => c.Id == conversationId && c.UserId == userId, ct);

            if (conv is null) yield break;

            var user = await db.Users.FindAsync(new object[] { userId }, ct);
            var workspace = await db.Workspaces.FirstOrDefaultAsync(w => w.OwnerUserId == userId, ct);
            var drafts = await db.Drafts.CountAsync(d => d.UserId == userId, ct);
            var pendingInvites = workspace is not null
                ? await db.Invites.CountAsync(i => i.WorkspaceId == workspace.Id && i.Status == InviteStatus.Pending, ct)
                : 0;

            systemPrompt = RenderSystemPrompt(
                opts.SystemPromptTemplate,
                FirstName(user?.DisplayName),
                workspace?.Name ?? "your workspace",
                workspace?.Plan ?? "Free",
                drafts,
                pendingInvites);

            var existingMsgs = conv.Messages
                .Where(m => m.Role != "system")
                .OrderBy(m => m.CreatedAt)
                .ToList();

            // Auto-derive title on first user message
            if (conv.Title == "New conversation" && !existingMsgs.Any(m => m.Role == "user"))
                conv.Title = DeriveTitle(userText);

            var now = _clock.Now;
            var userMsg = new ChatMessage
            {
                ConversationId = conversationId,
                Role = "user",
                Content = userText,
                CreatedAt = now,
            };
            db.ChatMessages.Add(userMsg);
            conv.UpdatedAt = now;
            await db.SaveChangesAsync(ct);

            // Build sliding-window history including the new user message
            existingMsgs.Add(userMsg);
            historyWindow = existingMsgs
                .TakeLast(opts.MaxHistoryMessages)
                .Select(m => (m.Role, m.Content))
                .ToList();
        }

        // Phase 2: stream from GitHub Models
        var messages = new List<Dictionary<string, string>>
        {
            new() { ["role"] = "system", ["content"] = systemPrompt }
        };
        messages.AddRange(historyWindow.Select(m => new Dictionary<string, string>
        {
            ["role"] = m.Role,
            ["content"] = m.Content
        }));

        var payload = new Dictionary<string, object>
        {
            ["model"] = opts.Model,
            ["messages"] = messages,
            ["stream"] = true,
            ["max_tokens"] = 1024
        };

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "chat/completions");
        httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", opts.ApiKey);
        httpRequest.Content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json");

        using var response = await _http.SendAsync(httpRequest, HttpCompletionOption.ResponseHeadersRead, ct);
        await using var contentStream = await response.Content.ReadAsStreamAsync(ct);
        using var reader = new StreamReader(contentStream);

        var fullReply = new StringBuilder();

        while (!ct.IsCancellationRequested)
        {
            var line = await reader.ReadLineAsync(ct);
            if (line is null) break;
            line = line.TrimEnd('\r');
            if (!line.StartsWith("data: ")) continue;

            var data = line[6..];
            if (data == "[DONE]") break;

            string? token = null;
            try
            {
                using var doc = JsonDocument.Parse(data);
                var choices = doc.RootElement.GetProperty("choices");
                if (choices.GetArrayLength() == 0) continue;
                if (!choices[0].TryGetProperty("delta", out var delta)) continue;
                if (!delta.TryGetProperty("content", out var contentEl)) continue;
                if (contentEl.ValueKind == JsonValueKind.Null) continue;
                token = contentEl.GetString();
            }
            catch (JsonException)
            {
                continue;
            }

            if (string.IsNullOrEmpty(token)) continue;

            fullReply.Append(token);
            yield return token;
        }

        // Phase 3: clean and persist assistant reply
        var reply = fullReply.ToString().Trim();
        reply = Regex.Replace(reply, @"^Nova:\s*", string.Empty, RegexOptions.IgnoreCase);
        if (string.IsNullOrEmpty(reply)) reply = "I'm here.";

        using (var scope = _scopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var now = _clock.Now;
            db.ChatMessages.Add(new ChatMessage
            {
                ConversationId = conversationId,
                Role = "assistant",
                Content = reply,
                CreatedAt = now,
            });
            var conv = await db.Conversations.FindAsync(new object[] { conversationId }, ct);
            if (conv is not null) conv.UpdatedAt = now;
            await db.SaveChangesAsync(ct);
        }
    }

    public static string DeriveTitle(string text)
    {
        var normalized = Regex.Replace(text.Trim(), @"\s+", " ");
        return normalized.Length <= 38 ? normalized : normalized[..36] + "…";
    }

    public static string RenderSystemPrompt(
        string template, string firstName, string workspaceName, string plan, int drafts, int pendingInvites)
    {
        return template
            .Replace("{firstName}", firstName)
            .Replace("{workspaceName}", workspaceName)
            .Replace("{plan}", plan)
            .Replace("{drafts}", drafts.ToString())
            .Replace("{pendingInvites}", pendingInvites.ToString());
    }

    private static string FirstName(string? displayName)
    {
        if (string.IsNullOrWhiteSpace(displayName)) return "there";
        var first = displayName.Trim().Split(' ')[0];
        return string.IsNullOrEmpty(first) ? "there" : first;
    }
}
