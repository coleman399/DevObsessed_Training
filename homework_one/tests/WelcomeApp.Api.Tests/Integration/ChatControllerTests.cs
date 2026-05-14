using System.Net;
using System.Net.Http.Json;
using System.Text;
using FluentAssertions;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using WelcomeApp.Api.Dtos;
using WelcomeApp.Api.Models;
using WelcomeApp.Api.Services;
using WelcomeApp.Api.Tests.Infrastructure;

namespace WelcomeApp.Api.Tests.Integration;

public class ChatControllerTests : IntegrationTestBase
{
    public ChatControllerTests(ApiFactory factory) : base(factory) { }

    // ── Auth guard ───────────────────────────────────────────────────────────

    [Fact]
    public async Task Conversations_require_auth()
    {
        var routes = new[]
        {
            (HttpMethod.Get,    "/api/chat/conversations"),
            (HttpMethod.Post,   "/api/chat/conversations"),
            (HttpMethod.Get,    "/api/chat/conversations/any-id"),
            (HttpMethod.Patch,  "/api/chat/conversations/any-id"),
            (HttpMethod.Post,   "/api/chat/conversations/any-id/messages"),
        };

        foreach (var (method, path) in routes)
        {
            var req = new HttpRequestMessage(method, path);
            if (method != HttpMethod.Get)
                req.Content = new StringContent("{}", Encoding.UTF8, "application/json");
            var response = await Client.SendAsync(req);
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized, $"route {method} {path} should require auth");
        }
    }

    // ── Start + list ─────────────────────────────────────────────────────────

    [Fact]
    public async Task Start_then_list_returns_the_new_conversation_with_message_count()
    {
        var (_, authed) = await RegisterAsync(name: "Jane Doe", email: "chat-list@example.com");

        // List is empty before first user message
        var emptyList = await authed.GetFromJsonAsync<ConversationSummaryDto[]>("/api/chat/conversations");
        emptyList.Should().BeEmpty();

        // Create conversation
        var createResp = await authed.PostAsync("/api/chat/conversations", null);
        createResp.StatusCode.Should().Be(HttpStatusCode.Created);
        var detail = await createResp.Content.ReadFromJsonAsync<ConversationDetailDto>();
        detail.Should().NotBeNull();
        detail!.Title.Should().Be("New conversation");
        detail.Messages.Should().HaveCount(1);
        detail.Messages[0].Role.Should().Be("assistant");
        detail.Messages[0].Content.Should().Contain("Jane");

        // Still empty in list (no user message yet)
        var stillEmpty = await authed.GetFromJsonAsync<ConversationSummaryDto[]>("/api/chat/conversations");
        stillEmpty.Should().BeEmpty();

        // Seed a user message directly so we can test the list without hitting GitHub Models
        await using (var db = CreateDbContext())
        {
            db.ChatMessages.Add(new ChatMessage
            {
                ConversationId = detail.Id,
                Role = "user",
                Content = "hello",
                CreatedAt = DateTimeOffset.UtcNow,
            });
            var conv = await db.Conversations.FindAsync(detail.Id);
            conv!.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();
        }

        var list = await authed.GetFromJsonAsync<ConversationSummaryDto[]>("/api/chat/conversations");
        list.Should().HaveCount(1);
        list![0].Id.Should().Be(detail.Id);
        list[0].MessageCount.Should().Be(2); // greeting + user msg
    }

    // ── Cross-user isolation ─────────────────────────────────────────────────

    [Fact]
    public async Task Cannot_read_another_users_conversation()
    {
        var (_, alice) = await RegisterAsync(name: "Alice", email: "chat-alice@example.com");
        var (_, bob) = await RegisterAsync(name: "Bob", email: "chat-bob@example.com");

        var createResp = await alice.PostAsync("/api/chat/conversations", null);
        var aliceConv = await createResp.Content.ReadFromJsonAsync<ConversationDetailDto>();

        // Bob cannot GET, PATCH, or POST/messages on Alice's conversation
        var getResp = await bob.GetAsync($"/api/chat/conversations/{aliceConv!.Id}");
        getResp.StatusCode.Should().Be(HttpStatusCode.NotFound);

        var patchResp = await bob.PatchAsJsonAsync($"/api/chat/conversations/{aliceConv.Id}", new { title = "hack" });
        patchResp.StatusCode.Should().Be(HttpStatusCode.NotFound);

        var msgResp = await bob.PostAsJsonAsync($"/api/chat/conversations/{aliceConv.Id}/messages", new { message = "hi" });
        msgResp.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── Get conversation ─────────────────────────────────────────────────────

    [Fact]
    public async Task Get_conversation_returns_messages_in_order()
    {
        var (_, authed) = await RegisterAsync(name: "Jane", email: "chat-order@example.com");

        var createResp = await authed.PostAsync("/api/chat/conversations", null);
        var conv = await createResp.Content.ReadFromJsonAsync<ConversationDetailDto>();

        // Seed messages out-of-order by timestamp
        var t = DateTimeOffset.UtcNow;
        await using (var db = CreateDbContext())
        {
            db.ChatMessages.Add(new ChatMessage { ConversationId = conv!.Id, Role = "user", Content = "second", CreatedAt = t.AddSeconds(2) });
            db.ChatMessages.Add(new ChatMessage { ConversationId = conv.Id, Role = "assistant", Content = "third", CreatedAt = t.AddSeconds(3) });
            db.ChatMessages.Add(new ChatMessage { ConversationId = conv.Id, Role = "user", Content = "first", CreatedAt = t.AddSeconds(1) });
            await db.SaveChangesAsync();
        }

        var detail = await authed.GetFromJsonAsync<ConversationDetailDto>($"/api/chat/conversations/{conv!.Id}");
        var contents = detail!.Messages.Select(m => m.Content).ToArray();

        // Greeting was inserted at conversation creation time (before t), so it comes first
        contents[^3].Should().Be("first");
        contents[^2].Should().Be("second");
        contents[^1].Should().Be("third");
    }

    // ── List excludes empty stubs ─────────────────────────────────────────────

    [Fact]
    public async Task List_excludes_empty_stub_conversations()
    {
        var (_, authed) = await RegisterAsync(name: "Jane", email: "chat-stubs@example.com");

        var createResp = await authed.PostAsync("/api/chat/conversations", null);
        var conv = await createResp.Content.ReadFromJsonAsync<ConversationDetailDto>();

        // No user messages yet — must not appear in list
        var emptyList = await authed.GetFromJsonAsync<ConversationSummaryDto[]>("/api/chat/conversations");
        emptyList.Should().BeEmpty();

        // Add a user message
        await using (var db = CreateDbContext())
        {
            db.ChatMessages.Add(new ChatMessage { ConversationId = conv!.Id, Role = "user", Content = "hi", CreatedAt = DateTimeOffset.UtcNow });
            var c = await db.Conversations.FindAsync(conv.Id);
            c!.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();
        }

        var list = await authed.GetFromJsonAsync<ConversationSummaryDto[]>("/api/chat/conversations");
        list.Should().HaveCount(1);
    }

    // ── PATCH title ──────────────────────────────────────────────────────────

    [Fact]
    public async Task Patch_title_updates_and_validates()
    {
        var (_, authed) = await RegisterAsync(name: "Jane", email: "chat-patch@example.com");

        var createResp = await authed.PostAsync("/api/chat/conversations", null);
        var conv = await createResp.Content.ReadFromJsonAsync<ConversationDetailDto>();

        // Happy path — 204
        var patchResp = await authed.PatchAsJsonAsync($"/api/chat/conversations/{conv!.Id}", new { title = "My Chat" });
        patchResp.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var detail = await authed.GetFromJsonAsync<ConversationDetailDto>($"/api/chat/conversations/{conv.Id}");
        detail!.Title.Should().Be("My Chat");

        // Empty title — 400
        var badResp = await authed.PatchAsJsonAsync($"/api/chat/conversations/{conv.Id}", new { title = "" });
        badResp.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        // Title too long — 400
        var tooLong = await authed.PatchAsJsonAsync($"/api/chat/conversations/{conv.Id}", new { title = new string('x', 81) });
        tooLong.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        // Unknown conversation — 404
        var notFound = await authed.PatchAsJsonAsync("/api/chat/conversations/no-such-id", new { title = "X" });
        notFound.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── SSE streaming ────────────────────────────────────────────────────────

    [Fact]
    public async Task Send_message_streams_tokens_and_terminates_with_DONE()
    {
        var (_, authed) = await RegisterAsync(name: "Jane", email: "chat-sse@example.com");

        // Create conversation
        var createResp = await authed.PostAsync("/api/chat/conversations", null);
        var conv = await createResp.Content.ReadFromJsonAsync<ConversationDetailDto>();

        // Build a client that uses a stub IChatService returning known tokens
        var stubbedClient = Factory.WithWebHostBuilder(b =>
            b.ConfigureTestServices(services =>
                services.AddTransient<IChatService>(_ => new StubChatService(["Hello", " world"]))))
            .CreateClient();
        stubbedClient.DefaultRequestHeaders.Authorization =
            authed.DefaultRequestHeaders.Authorization;

        var msgResp = await stubbedClient.PostAsJsonAsync(
            $"/api/chat/conversations/{conv!.Id}/messages",
            new { message = "hi" });

        msgResp.StatusCode.Should().Be(HttpStatusCode.OK);
        msgResp.Content.Headers.ContentType!.MediaType.Should().Be("text/event-stream");

        var body = await msgResp.Content.ReadAsStringAsync();
        body.Should().Contain("data: {\"token\":\"Hello\"}");
        body.Should().Contain("data: {\"token\":\" world\"}");
        body.Should().EndWith("data: [DONE]\n\n");
    }

    [Fact]
    public async Task Send_message_emits_error_frame_on_mid_stream_exception()
    {
        var (_, authed) = await RegisterAsync(name: "Jane", email: "chat-sse-err@example.com");
        var createResp = await authed.PostAsync("/api/chat/conversations", null);
        var conv = await createResp.Content.ReadFromJsonAsync<ConversationDetailDto>();

        var stubbedClient = Factory.WithWebHostBuilder(b =>
            b.ConfigureTestServices(services =>
                services.AddTransient<IChatService>(_ => new StubChatService([], throwAfterTokens: 0))))
            .CreateClient();
        stubbedClient.DefaultRequestHeaders.Authorization =
            authed.DefaultRequestHeaders.Authorization;

        var body = await (await stubbedClient.PostAsJsonAsync(
            $"/api/chat/conversations/{conv!.Id}/messages",
            new { message = "hi" })).Content.ReadAsStringAsync();

        body.Should().Contain("\"error\":\"stream_failed\"");
        body.Should().EndWith("data: [DONE]\n\n");
    }

    // ── Stub IChatService ────────────────────────────────────────────────────

    private sealed class StubChatService : IChatService
    {
        private readonly IReadOnlyList<string> _tokens;
        private readonly int _throwAfterTokens;

        public StubChatService(IReadOnlyList<string> tokens, int throwAfterTokens = int.MaxValue)
        {
            _tokens = tokens;
            _throwAfterTokens = throwAfterTokens;
        }

        public Task<ConversationDetailDto> StartConversationAsync(string userId, CancellationToken ct) =>
            throw new NotImplementedException();

        public Task<IReadOnlyList<ConversationSummaryDto>> ListConversationsAsync(string userId, CancellationToken ct) =>
            throw new NotImplementedException();

        public Task<ConversationDetailDto?> GetConversationAsync(string userId, string conversationId, CancellationToken ct) =>
            Task.FromResult<ConversationDetailDto?>(new ConversationDetailDto(conversationId, "stub", DateTimeOffset.UtcNow, []));

        public Task<bool> UpdateTitleAsync(string userId, string conversationId, string newTitle, CancellationToken ct) =>
            throw new NotImplementedException();

        public async IAsyncEnumerable<string> StreamReplyAsync(
            string userId, string conversationId, string userText,
            [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken ct)
        {
            var sent = 0;
            foreach (var token in _tokens)
            {
                if (sent >= _throwAfterTokens) throw new InvalidOperationException("stub error");
                yield return token;
                sent++;
            }
            if (_throwAfterTokens == 0) throw new InvalidOperationException("stub error");
            await Task.CompletedTask;
        }
    }
}
