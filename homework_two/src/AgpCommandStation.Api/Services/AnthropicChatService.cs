using System.Net.Http.Headers;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using AgpCommandStation.Api.Data;
using AgpCommandStation.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace AgpCommandStation.Api.Services;

public interface IAnthropicChatService
{
    Task<ConversationDetailDto> StartConversationAsync(string userId, CancellationToken ct = default);
    Task<IReadOnlyList<ConversationSummaryDto>> ListConversationsAsync(string userId, CancellationToken ct = default);
    Task<ConversationDetailDto?> GetConversationAsync(string userId, string conversationId, CancellationToken ct = default);
    Task<bool> UpdateTitleAsync(string userId, string conversationId, string newTitle, CancellationToken ct = default);
    IAsyncEnumerable<string> StreamReplyAsync(string userId, string conversationId, string userText, CancellationToken ct = default);
    Task<string> GetStructuredJsonAsync(string userId, string systemPrompt, string userPrompt, CancellationToken ct = default);
}

// ── DTOs (internal to chat service) ─────────────────────────────────────────
public record ConversationSummaryDto(string Id, string Title, DateTimeOffset UpdatedAt, int MessageCount);
public record ChatMessageDto(string Id, string Role, string Content, DateTimeOffset CreatedAt);
public record ConversationDetailDto(string Id, string Title, DateTimeOffset UpdatedAt, IReadOnlyList<ChatMessageDto> Messages);

public class AnthropicChatService : IAnthropicChatService
{
    private readonly HttpClient _http;
    private readonly IOptions<AnthropicChatOptions> _opts;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IClock _clock;
    private readonly IEncryptionService _encryption;
    private readonly IClaudePersonaService _persona;

    public AnthropicChatService(
        HttpClient http,
        IOptions<AnthropicChatOptions> opts,
        IServiceScopeFactory scopeFactory,
        IClock clock,
        IEncryptionService encryption,
        IClaudePersonaService persona)
    {
        _http = http;
        _opts = opts;
        _scopeFactory = scopeFactory;
        _clock = clock;
        _encryption = encryption;
        _persona = persona;
    }

    public async Task<ConversationDetailDto> StartConversationAsync(string userId, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await db.Users.FindAsync(new object[] { userId }, ct);
        var firstName = FirstName(user?.DisplayName);
        var now = _clock.Now;

        var conv = new Conversation { UserId = userId, Title = "New conversation", CreatedAt = now, UpdatedAt = now };
        db.Conversations.Add(conv);
        await db.SaveChangesAsync(ct);

        var greeting = new ChatMessage
        {
            ConversationId = conv.Id,
            Role = "assistant",
            Content = $"Hey {firstName}, what are we working on first?",
            CreatedAt = now,
        };
        db.ChatMessages.Add(greeting);
        await db.SaveChangesAsync(ct);

        return new ConversationDetailDto(conv.Id, conv.Title, conv.UpdatedAt,
            [new ChatMessageDto(greeting.Id, greeting.Role, greeting.Content, greeting.CreatedAt)]);
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
                c.Id, c.Title, c.UpdatedAt,
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
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        var opts = _opts.Value;
        string systemPrompt;
        string apiKey;
        List<(string Role, string Content)> historyWindow;

        // Phase 1: load context, save user message
        using (var scope = _scopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var conv = await db.Conversations
                .Include(c => c.Messages)
                .FirstOrDefaultAsync(c => c.Id == conversationId && c.UserId == userId, ct);

            if (conv is null) yield break;

            var user = await db.Users.FindAsync(new object[] { userId }, ct);
            if (user?.AnthropicApiKeyEncrypted is null) yield break;

            apiKey = _encryption.Decrypt(user.AnthropicApiKeyEncrypted);
            systemPrompt = BuildSystemPrompt(user, _persona);

            var existingMsgs = conv.Messages
                .Where(m => m.Role != "system")
                .OrderBy(m => m.CreatedAt)
                .ToList();

            if (conv.Title == "New conversation" && !existingMsgs.Any(m => m.Role == "user"))
                conv.Title = DeriveTitle(userText);

            var now = _clock.Now;
            var userMsg = new ChatMessage { ConversationId = conversationId, Role = "user", Content = userText, CreatedAt = now };
            db.ChatMessages.Add(userMsg);
            conv.UpdatedAt = now;
            await db.SaveChangesAsync(ct);

            existingMsgs.Add(userMsg);
            historyWindow = existingMsgs
                .TakeLast(opts.MaxHistoryMessages)
                .Select(m => (m.Role, m.Content))
                .ToList();
        }

        // Phase 2: stream from Anthropic
        var messages = historyWindow
            .Select(m => new { role = m.Role == "assistant" ? "assistant" : "user", content = m.Content })
            .ToList();

        var payload = new
        {
            model = opts.DefaultModel,
            max_tokens = opts.MaxTokens,
            stream = true,
            system = systemPrompt,
            messages,
        };

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "v1/messages");
        httpRequest.Headers.Add("x-api-key", apiKey);
        httpRequest.Headers.Add("anthropic-version", opts.ApiVersion);
        httpRequest.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        using var response = await _http.SendAsync(httpRequest, HttpCompletionOption.ResponseHeadersRead, ct);
        await using var contentStream = await response.Content.ReadAsStreamAsync(ct);
        using var reader = new StreamReader(contentStream);

        var fullReply = new StringBuilder();

        while (!ct.IsCancellationRequested)
        {
            var line = await reader.ReadLineAsync(ct);
            if (line is null) break;
            if (!line.StartsWith("data: ")) continue;

            var data = line[6..];
            if (data == "[DONE]") break;

            string? token = null;
            try
            {
                using var doc = JsonDocument.Parse(data);
                var root = doc.RootElement;
                // Anthropic SSE: type=content_block_delta, delta.type=text_delta, delta.text=...
                if (!root.TryGetProperty("type", out var typeEl)) continue;
                if (typeEl.GetString() != "content_block_delta") continue;
                if (!root.TryGetProperty("delta", out var delta)) continue;
                if (!delta.TryGetProperty("text", out var textEl)) continue;
                token = textEl.GetString();
            }
            catch (JsonException) { continue; }

            if (string.IsNullOrEmpty(token)) continue;

            fullReply.Append(token);
            yield return token;
        }

        // Phase 3: persist assistant reply
        var reply = fullReply.ToString().Trim();
        if (string.IsNullOrEmpty(reply)) reply = "I'm here.";

        using (var scope = _scopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var now = _clock.Now;
            db.ChatMessages.Add(new ChatMessage { ConversationId = conversationId, Role = "assistant", Content = reply, CreatedAt = now });
            var conv = await db.Conversations.FindAsync(new object[] { conversationId }, ct);
            if (conv is not null) conv.UpdatedAt = now;
            await db.SaveChangesAsync(ct);
        }
    }

    private static string BuildSystemPrompt(ApplicationUser user, IClaudePersonaService persona)
    {
        var personaMd = persona.GetPersonaMarkdown(user.BotPersonaMarkdownOverride);
        var roleGuidance = user.Role switch
        {
            UserRole.ProductOwner =>
                "Help write user stories with acceptance criteria, refine backlog items, and create well-structured Azure DevOps work items. Be concise and business-focused.",
            UserRole.QA =>
                "Help write test cases, identify edge cases, draft bug reports, and verify acceptance criteria. Be systematic and concise.",
            _ =>
                "Help understand requirements, break stories into technical tasks, estimate complexity, and navigate codebases. Be technical and concise.",
        };

        return $"""
            {personaMd}

            ---
            You are working inside AGP Command Station. Today is {DateTimeOffset.UtcNow:yyyy-MM-dd}.
            The user's role at AGP is {user.Role}.

            You have access to their Azure DevOps work items, Outlook email and calendar,
            Microsoft Teams messages, and AGP codebases via tools.

            {roleGuidance}
            """;
    }

    public static string DeriveTitle(string text)
    {
        var normalized = System.Text.RegularExpressions.Regex.Replace(text.Trim(), @"\s+", " ");
        return normalized.Length <= 38 ? normalized : normalized[..35] + "…";
    }

    /// <summary>
    /// Makes a non-streaming Anthropic call and returns the raw text response.
    /// Used for structured-output endpoints (workitem-draft, etc.) where the
    /// caller expects JSON, not an SSE stream.
    /// </summary>
    public async Task<string> GetStructuredJsonAsync(
        string userId,
        string systemPrompt,
        string userPrompt,
        CancellationToken ct = default)
    {
        var opts = _opts.Value;
        string apiKey;

        using (var scope = _scopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var user = await db.Users.FindAsync(new object[] { userId }, ct);
            if (user?.AnthropicApiKeyEncrypted is null)
                throw new InvalidOperationException("Anthropic API key not configured.");
            apiKey = _encryption.Decrypt(user.AnthropicApiKeyEncrypted);
        }

        var payload = new
        {
            model = opts.DefaultModel,
            max_tokens = 1024,
            system = systemPrompt,
            messages = new[] { new { role = "user", content = userPrompt } },
        };

        using var req = new HttpRequestMessage(HttpMethod.Post, "v1/messages");
        req.Headers.Add("x-api-key", apiKey);
        req.Headers.Add("anthropic-version", opts.ApiVersion);
        req.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        using var resp = await _http.SendAsync(req, ct);
        resp.EnsureSuccessStatusCode();

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
        return doc.RootElement
            .GetProperty("content")[0]
            .GetProperty("text")
            .GetString() ?? string.Empty;
    }

    private static string FirstName(string? displayName)
    {
        if (string.IsNullOrWhiteSpace(displayName)) return "there";
        var first = displayName.Trim().Split(' ')[0];
        return string.IsNullOrEmpty(first) ? "there" : first;
    }
}
