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
    IAsyncEnumerable<SseEvent> StreamReplyAsync(string userId, string conversationId, string userText,
        ToolContext? toolCtx = null, string[]? pinnedFilePaths = null, CancellationToken ct = default);
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
    private readonly IToolExecutorService _toolExecutor;

    public AnthropicChatService(
        HttpClient http,
        IOptions<AnthropicChatOptions> opts,
        IServiceScopeFactory scopeFactory,
        IClock clock,
        IEncryptionService encryption,
        IClaudePersonaService persona,
        IToolExecutorService toolExecutor)
    {
        _http = http;
        _opts = opts;
        _scopeFactory = scopeFactory;
        _clock = clock;
        _encryption = encryption;
        _persona = persona;
        _toolExecutor = toolExecutor;
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

    public async IAsyncEnumerable<SseEvent> StreamReplyAsync(
        string userId,
        string conversationId,
        string userText,
        ToolContext? toolCtx = null,
        string[]? pinnedFilePaths = null,
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        var opts = _opts.Value;
        string systemPrompt;
        string apiKey;
        string? gitHubPat = null;
        List<Dictionary<string, object>> messages;

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
            if (user.GitHubPatEncrypted is not null)
                gitHubPat = _encryption.Decrypt(user.GitHubPatEncrypted);

            systemPrompt = BuildSystemPrompt(user, _persona);

            var existingMsgs = conv.Messages
                .Where(m => m.Role != "system")
                .OrderBy(m => m.CreatedAt)
                .ToList();

            if (conv.Title == "New conversation" && !existingMsgs.Any(m => m.Role == "user"))
                conv.Title = DeriveTitle(userText);

            var now = _clock.Now;
            db.ChatMessages.Add(new ChatMessage { ConversationId = conversationId, Role = "user", Content = userText, CreatedAt = now });
            conv.UpdatedAt = now;
            await db.SaveChangesAsync(ct);

            existingMsgs.Add(new ChatMessage { Role = "user", Content = userText });
            var history = existingMsgs.TakeLast(opts.MaxHistoryMessages).ToList();

            // Build pinned-files preamble (prepended as a system addendum)
            if (pinnedFilePaths?.Length > 0)
                systemPrompt += $"\n\n---\nThe user has pinned these files for this conversation:\n{string.Join("\n", pinnedFilePaths)}\n" +
                                "Use get_file to read them if the user asks about them.";

            messages = history.Select(m => new Dictionary<string, object>
            {
                ["role"]    = m.Role == "assistant" ? "assistant" : "user",
                ["content"] = (object)m.Content
            }).ToList();
        }

        // Phase 2: agentic tool-use loop
        var fullReply = new StringBuilder();
        var loopGuard = 0;
        const int MaxToolRounds = 8;

        while (loopGuard++ < MaxToolRounds && !ct.IsCancellationRequested)
        {
            var payload = new Dictionary<string, object>
            {
                ["model"]     = opts.DefaultModel,
                ["max_tokens"] = opts.MaxTokens,
                ["stream"]    = true,
                ["system"]    = systemPrompt,
                ["messages"]  = messages,
                ["tools"]     = ToolDefinitions.All,
            };

            using var httpReq = new HttpRequestMessage(HttpMethod.Post, "v1/messages");
            httpReq.Headers.Add("x-api-key", apiKey);
            httpReq.Headers.Add("anthropic-version", opts.ApiVersion);
            httpReq.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            using var response = await _http.SendAsync(httpReq, HttpCompletionOption.ResponseHeadersRead, ct);
            await using var stream = await response.Content.ReadAsStreamAsync(ct);
            using var reader = new StreamReader(stream);

            // Collect content blocks from this turn
            var textSoFar = new StringBuilder();
            var toolCalls = new List<(string Id, string Name, StringBuilder InputJson)>();
            (string Id, string Name, StringBuilder InputJson)? activeTool = null;
            var stopReason = "";

            while (!ct.IsCancellationRequested)
            {
                var line = await reader.ReadLineAsync(ct);
                if (line is null) break;
                if (!line.StartsWith("data: ")) continue;

                var data = line[6..];
                if (data == "[DONE]") break;

                JsonElement root;
                try { root = JsonDocument.Parse(data).RootElement; }
                catch (JsonException) { continue; }

                if (!root.TryGetProperty("type", out var typeEl)) continue;
                var type = typeEl.GetString();

                switch (type)
                {
                    case "content_block_start":
                        if (!root.TryGetProperty("content_block", out var cb)) break;
                        if (cb.TryGetProperty("type", out var cbType) && cbType.GetString() == "tool_use")
                        {
                            var toolId   = cb.TryGetProperty("id",   out var tid) ? tid.GetString() ?? "" : "";
                            var toolName = cb.TryGetProperty("name", out var tn)  ? tn.GetString()  ?? "" : "";
                            activeTool = (toolId, toolName, new StringBuilder());
                        }
                        break;

                    case "content_block_delta":
                        if (!root.TryGetProperty("delta", out var delta)) break;
                        if (!delta.TryGetProperty("type", out var deltaType)) break;

                        if (deltaType.GetString() == "text_delta" &&
                            delta.TryGetProperty("text", out var textEl))
                        {
                            var token = textEl.GetString() ?? "";
                            if (!string.IsNullOrEmpty(token))
                            {
                                textSoFar.Append(token);
                                fullReply.Append(token);
                                yield return new TextToken(token);
                            }
                        }
                        else if (deltaType.GetString() == "input_json_delta" &&
                                 delta.TryGetProperty("partial_json", out var pj) &&
                                 activeTool is not null)
                        {
                            activeTool.Value.InputJson.Append(pj.GetString());
                        }
                        break;

                    case "content_block_stop":
                        if (activeTool is not null)
                        {
                            toolCalls.Add(activeTool.Value);
                            activeTool = null;
                        }
                        break;

                    case "message_delta":
                        if (root.TryGetProperty("delta", out var md) &&
                            md.TryGetProperty("stop_reason", out var sr))
                            stopReason = sr.GetString() ?? "";
                        break;
                }
            }

            // If no tool calls, we're done
            if (stopReason != "tool_use" || toolCalls.Count == 0)
                break;

            // Add assistant's turn (with tool_use blocks) to messages
            var assistantContent = new List<object>();
            if (textSoFar.Length > 0)
                assistantContent.Add(new { type = "text", text = textSoFar.ToString() });
            foreach (var tc in toolCalls)
            {
                JsonElement parsedInput;
                try { parsedInput = JsonDocument.Parse(tc.InputJson.Length > 0 ? tc.InputJson.ToString() : "{}").RootElement; }
                catch { parsedInput = JsonDocument.Parse("{}").RootElement; }
                assistantContent.Add(new { type = "tool_use", id = tc.Id, name = tc.Name, input = parsedInput });
            }
            messages.Add(new Dictionary<string, object> { ["role"] = "assistant", ["content"] = (object)assistantContent });

            // Execute each tool and collect results
            var toolResults = new List<object>();
            foreach (var tc in toolCalls)
            {
                var label = ToolLabel(tc.Name, tc.InputJson.ToString());
                yield return new ToolCallEvent(tc.Name, label);

                JsonElement inputEl;
                try { inputEl = JsonDocument.Parse(tc.InputJson.Length > 0 ? tc.InputJson.ToString() : "{}").RootElement; }
                catch { inputEl = JsonDocument.Parse("{}").RootElement; }

                var result = await _toolExecutor.ExecuteAsync(tc.Name, inputEl, toolCtx ?? new ToolContext(null, null, null, null, null), gitHubPat, ct);
                toolResults.Add(new { type = "tool_result", tool_use_id = tc.Id, content = result });
            }

            messages.Add(new Dictionary<string, object> { ["role"] = "user", ["content"] = (object)toolResults });
        }

        // Phase 3: persist final assistant reply
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

    private static string ToolLabel(string name, string inputJson)
    {
        string arg = "";
        try
        {
            using var doc = JsonDocument.Parse(string.IsNullOrEmpty(inputJson) ? "{}" : inputJson);
            arg = name switch
            {
                "search_code"           => doc.RootElement.TryGetProperty("query", out var q) ? $"\"{q.GetString()}\"" : "",
                "get_file"              => doc.RootElement.TryGetProperty("path",  out var p) ? p.GetString() ?? "" : "",
                "list_directory"        => doc.RootElement.TryGetProperty("path",  out var p) ? p.GetString() ?? "" : "",
                "search_emails"         => doc.RootElement.TryGetProperty("query", out var q) ? $"\"{q.GetString()}\"" : "",
                "get_email_thread"      => "thread",
                "search_teams_messages" => doc.RootElement.TryGetProperty("query", out var q) ? $"\"{q.GetString()}\"" : "",
                "get_channel_messages"  => "channel",
                _                       => ""
            };
        }
        catch { /* ignore */ }

        return name switch
        {
            "search_code"           => $"🔍 Searching code for {arg}…",
            "get_file"              => $"📄 Reading {arg}…",
            "list_directory"        => $"📁 Listing {arg}…",
            "search_emails"         => $"✉️ Searching emails for {arg}…",
            "get_email_thread"      => "✉️ Reading email thread…",
            "search_teams_messages" => $"💬 Searching Teams for {arg}…",
            "get_channel_messages"  => "💬 Reading channel messages…",
            _                       => $"⚙️ Running {name}…"
        };
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
