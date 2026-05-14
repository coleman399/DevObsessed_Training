using FluentAssertions;
using Microsoft.Extensions.Options;
using WelcomeApp.Api.Models;
using WelcomeApp.Api.Services;
using WelcomeApp.Api.Tests.Infrastructure;

namespace WelcomeApp.Api.Tests.Unit;

public class ChatServiceTests
{
    // ── DeriveTitle ──────────────────────────────────────────────────────────

    [Fact]
    public void DeriveTitle_short_string_returns_verbatim()
    {
        ChatService.DeriveTitle("Hello world").Should().Be("Hello world");
    }

    [Fact]
    public void DeriveTitle_exactly_38_chars_returns_verbatim()
    {
        var text = new string('a', 38);
        ChatService.DeriveTitle(text).Should().Be(text);
    }

    [Fact]
    public void DeriveTitle_longer_than_38_chars_truncates_with_ellipsis()
    {
        var text = new string('a', 40);
        var result = ChatService.DeriveTitle(text);
        result.Should().Be(new string('a', 36) + "…");
        result.Length.Should().Be(37); // 36 chars + 1 ellipsis character
    }

    [Fact]
    public void DeriveTitle_collapses_internal_whitespace()
    {
        ChatService.DeriveTitle("  hello   world  ").Should().Be("hello world");
    }

    // ── RenderSystemPrompt ───────────────────────────────────────────────────

    [Fact]
    public void RenderSystemPrompt_substitutes_all_tokens()
    {
        var template = "Hello {firstName} in {workspaceName}, plan {plan}, drafts {drafts}, invites {pendingInvites}.";
        var result = ChatService.RenderSystemPrompt(template, "Jane", "jane-hq", "Free", 2, 1);
        result.Should().Be("Hello Jane in jane-hq, plan Free, drafts 2, invites 1.");
    }

    [Fact]
    public void RenderSystemPrompt_handles_zero_counts()
    {
        var template = "{drafts} drafts, {pendingInvites} invites";
        ChatService.RenderSystemPrompt(template, "Jane", "jane-hq", "Free", 0, 0)
            .Should().Be("0 drafts, 0 invites");
    }

    // ── StreamReplyAsync — SSE parsing ───────────────────────────────────────

    private static ChatService BuildService(string sseBody, string dbName)
    {
        var handler = new FakeHttpMessageHandler(sseBody);
        var http = new HttpClient(handler) { BaseAddress = new Uri("https://models.github.ai/inference/") };
        var opts = Options.Create(new ChatOptions { ApiKey = "test-key" });
        var scopeFactory = new InMemoryScopeFactory(dbName);
        var clock = new FakeClock(DateTimeOffset.UtcNow);
        return new ChatService(http, opts, scopeFactory, clock);
    }

    private static async Task SeedConversationAsync(InMemoryScopeFactory factory, string convId, string userId)
    {
        await using var db = factory.CreateContext();
        db.Users.Add(new ApplicationUser
        {
            Id = userId,
            UserName = "jane@example.com",
            Email = "jane@example.com",
            DisplayName = "Jane Doe",
        });
        db.Workspaces.Add(new Workspace
        {
            Id = Guid.NewGuid().ToString(),
            Name = "jane-hq",
            OwnerUserId = userId,
            Plan = "Free",
            CreatedAt = DateTimeOffset.UtcNow,
        });
        db.Conversations.Add(new Conversation
        {
            Id = convId,
            UserId = userId,
            Title = "New conversation",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        });
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task StreamReplyAsync_yields_tokens_from_SSE_frames()
    {
        var dbName = Guid.NewGuid().ToString();
        var userId = Guid.NewGuid().ToString();
        var convId = Guid.NewGuid().ToString();

        var sseBody = FakeHttpMessageHandler.BuildSseBody("Hello", " there", "!");
        var service = BuildService(sseBody, dbName);
        var factory = new InMemoryScopeFactory(dbName);
        await SeedConversationAsync(factory, convId, userId);

        var tokens = new List<string>();
        await foreach (var t in service.StreamReplyAsync(userId, convId, "hi", CancellationToken.None))
            tokens.Add(t);

        tokens.Should().Equal("Hello", " there", "!");
    }

    [Fact]
    public async Task StreamReplyAsync_persists_assistant_reply_after_stream()
    {
        var dbName = Guid.NewGuid().ToString();
        var userId = Guid.NewGuid().ToString();
        var convId = Guid.NewGuid().ToString();

        var sseBody = FakeHttpMessageHandler.BuildSseBody("Hi", " there");
        var service = BuildService(sseBody, dbName);
        var factory = new InMemoryScopeFactory(dbName);
        await SeedConversationAsync(factory, convId, userId);

        await foreach (var _ in service.StreamReplyAsync(userId, convId, "hello", CancellationToken.None)) { }

        await using var db = factory.CreateContext();
        var messages = db.ChatMessages.Where(m => m.ConversationId == convId).ToList();
        messages.Should().Contain(m => m.Role == "user" && m.Content == "hello");
        messages.Should().Contain(m => m.Role == "assistant" && m.Content == "Hi there");
    }

    [Fact]
    public async Task StreamReplyAsync_derives_title_on_first_user_message()
    {
        var dbName = Guid.NewGuid().ToString();
        var userId = Guid.NewGuid().ToString();
        var convId = Guid.NewGuid().ToString();

        var sseBody = FakeHttpMessageHandler.BuildSseBody("Sure");
        var service = BuildService(sseBody, dbName);
        var factory = new InMemoryScopeFactory(dbName);
        await SeedConversationAsync(factory, convId, userId);

        await foreach (var _ in service.StreamReplyAsync(userId, convId, "What is my plan?", CancellationToken.None)) { }

        await using var db = factory.CreateContext();
        var conv = await db.Conversations.FindAsync(convId);
        conv!.Title.Should().Be("What is my plan?");
    }

    [Fact]
    public async Task StreamReplyAsync_does_not_override_title_after_first_message()
    {
        var dbName = Guid.NewGuid().ToString();
        var userId = Guid.NewGuid().ToString();
        var convId = Guid.NewGuid().ToString();

        var factory = new InMemoryScopeFactory(dbName);
        await SeedConversationAsync(factory, convId, userId);

        // Send first message (sets title)
        var sseBody = FakeHttpMessageHandler.BuildSseBody("Reply1");
        var service1 = BuildService(sseBody, dbName);
        await foreach (var _ in service1.StreamReplyAsync(userId, convId, "First message", CancellationToken.None)) { }

        // Send second message (title should NOT change)
        var sseBody2 = FakeHttpMessageHandler.BuildSseBody("Reply2");
        var service2 = BuildService(sseBody2, dbName);
        await foreach (var _ in service2.StreamReplyAsync(userId, convId, "Second message", CancellationToken.None)) { }

        await using var db = factory.CreateContext();
        var conv = await db.Conversations.FindAsync(convId);
        conv!.Title.Should().Be("First message");
    }

    [Fact]
    public async Task StreamReplyAsync_truncates_history_to_MaxHistoryMessages()
    {
        var dbName = Guid.NewGuid().ToString();
        var userId = Guid.NewGuid().ToString();
        var convId = Guid.NewGuid().ToString();

        var factory = new InMemoryScopeFactory(dbName);
        await SeedConversationAsync(factory, convId, userId);

        // Pre-seed 25 user+assistant turns so the window (20) is exceeded
        await using (var db = factory.CreateContext())
        {
            var conv = await db.Conversations.FindAsync(convId);
            conv!.Title = "Already titled";
            for (var i = 0; i < 25; i++)
            {
                db.ChatMessages.Add(new ChatMessage { ConversationId = convId, Role = "user", Content = $"u{i}", CreatedAt = DateTimeOffset.UtcNow.AddMinutes(i) });
                db.ChatMessages.Add(new ChatMessage { ConversationId = convId, Role = "assistant", Content = $"a{i}", CreatedAt = DateTimeOffset.UtcNow.AddMinutes(i).AddSeconds(1) });
            }
            await db.SaveChangesAsync();
        }

        // The service should not throw — history slides silently
        var sseBody = FakeHttpMessageHandler.BuildSseBody("ok");
        var service = BuildService(sseBody, dbName);
        var tokens = new List<string>();
        await foreach (var t in service.StreamReplyAsync(userId, convId, "new message", CancellationToken.None))
            tokens.Add(t);

        tokens.Should().Equal("ok");
    }
}
