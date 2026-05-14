# Add a streaming chatbot to the Welcome screen

## Context

The Welcome screen currently shows static stats. The user — a student in DevObsessed's 5-week AI Development course — wants to add a chatbot to it as a learning exercise.

**Constraint:** ChatGPT Plus/Pro only (no OpenAI API access). User picked **GitHub Models** as the free path — it's free with any GitHub account (PAT with `models:read` scope), exposes an OpenAI-compatible REST API at `https://models.github.ai/inference`, supports SSE streaming, and gives us multiple models (GPT-4.1-mini, Claude, Llama, Phi) behind one endpoint. Swapping to paid OpenAI later is ~5 lines.

**v1 scope (locked):**
- Streaming token-by-token replies (SSE on the backend, `fetch` + `ReadableStream` on the frontend — `EventSource` can't send the JWT bearer)
- Multi-turn conversation history persisted per user; **multiple conversations** with a "Recent conversations" list on the welcome screen
- New `Conversations` and `ChatMessages` EF entities + migration
- Personalized system prompt: bot knows the signed-in user's first name, workspace name, plan, and current stats
- **Embedded** in the welcome grid (single always-visible thread on the left; conversation list in the right rail below "Today, in your space") — per design v2 ([../designs/design_handoff_dark_auth/02_CHAT_ADDENDUM.md](../designs/design_handoff_dark_auth/02_CHAT_ADDENDUM.md))
- `PATCH /api/chat/conversations/{id}` endpoint to persist titles (no editing UI yet on welcome — future server-side summarization will use it)

**Out of scope for v1:** rate-limit handling beyond a TODO, conversation summarization for long context windows, `DELETE /api/chat/conversations/{id}` (design defers to the broader-app surface — no caller on welcome means no v1 implementation), attachments/tool-use.

---

## Recommended approach

### Backend — `homework_one/src/WelcomeApp.Api/`

**The assistant is named Nova.** The bot has a fixed persona — see the system prompt below. UI text, seed messages, and error fallbacks all reference Nova by name; backend identifiers stay generic (`ChatService`, `Conversation`, `ChatMessage`) so the persona can evolve without a rename.

**New entities** ([Models/](../src/WelcomeApp.Api/Models/)):

- `Conversation` — `Id` (string GUID), `UserId`, `Title` (auto-derived from first user message — see [02_CHAT_ADDENDUM.md `deriveTitle`](../designs/design_handoff_dark_auth/02_CHAT_ADDENDUM.md#title-derivation): trim + collapse whitespace, then ≤38 chars verbatim or first 36 chars + `…`. Default `"New conversation"` until a user message arrives), `CreatedAt`, `UpdatedAt`
- `ChatMessage` — `Id` (string GUID), `ConversationId`, `Role` (string: `user`/`assistant`/`system`), `Content` (nvarchar(max)), `CreatedAt`

**Fluent config in [AppDbContext.cs](../src/WelcomeApp.Api/Data/AppDbContext.cs):**
- `Conversation.UserId → AspNetUsers.Id`, `OnDelete(Cascade)` — single FK path, no multi-cascade risk
- `ChatMessage.ConversationId → Conversations.Id`, `OnDelete(Cascade)`
- Index on `Conversation(UserId, UpdatedAt DESC)` for fast conversation-list queries
- Index on `ChatMessage(ConversationId, CreatedAt)` for ordered loads

**Migration:** `dotnet ef migrations add AddChat` — apply to all three DBs (`dev`/`tests`/`e2e`) per the runbook pattern.

**New services** ([Services/](../src/WelcomeApp.Api/Services/)):
- `ChatOptions.cs` — POCO bound from `Chat:` config section: `Endpoint`, `Model` (default `openai/gpt-4.1-mini`), `ApiKey` (from user-secrets `Chat:ApiKey` = the GitHub PAT), `MaxHistoryMessages` (default 20), `SystemPromptTemplate`
- `IChatService.cs` / `ChatService.cs`:
  - `Task<Conversation> StartConversationAsync(string userId, CancellationToken ct)` — creates the conversation with `Title = "New conversation"` **and persists Nova's opening line** as the first `assistant` message: `"Hey {firstName}, what are we working on first?"`. Nova speaks first; the user sees a greeting before they type.
  - `Task<IReadOnlyList<Conversation>> ListConversationsAsync(string userId, CancellationToken ct)` — returns last 20, sorted by `UpdatedAt DESC`. **Excludes empty stubs:** filters via `WHERE EXISTS(SELECT 1 FROM ChatMessages WHERE ConversationId = c.Id AND Role = 'user')` so freshly-created conversations with no user turns never appear in the recents list (per design's empty-stub rule). Projects `MessageCount` into the result so the DTO can expose it without a follow-up round-trip.
  - `Task<Conversation?> GetConversationAsync(string userId, string conversationId, CancellationToken ct)` — returns the full conversation **including ordered messages** in one query (`.Include(c => c.Messages).OrderBy(m => m.CreatedAt)`), or `null` if not owned by the user. Replaces the old split list/messages endpoints — one round-trip on resume.
  - `Task<bool> UpdateTitleAsync(string userId, string conversationId, string newTitle, CancellationToken ct)` — backs the `PATCH` endpoint. Validates `newTitle` is non-empty + ≤80 chars; returns `false` if conversation is not owned (controller maps to 404). Touches `UpdatedAt`.
  - `IAsyncEnumerable<string> StreamReplyAsync(string userId, string conversationId, string userText, CancellationToken ct)` — loads last `MaxHistoryMessages`, assembles `messages[]` with the system prompt injected, POSTs to `{Endpoint}/chat/completions` with `stream: true` and `max_tokens: 1024` (Nova's replies are terse by design), parses the SSE response line-by-line, `yield return`s each `delta.content` token. Persists the user's message before the call and the full assistant reply after the stream ends (transactional). Before persisting: trim whitespace, strip any leading `Nova:` prefix the model echoes back (`Regex.Replace(reply, "^Nova:\\s*", "", RegexOptions.IgnoreCase)`), and fall back to `"I'm here."` if the cleaned reply is empty. **If `Conversation.Title == "New conversation"` and this is the first user message, derive the title server-side from the user's text** using the design's `deriveTitle` rule (so the recents list picks it up on next fetch without a client PATCH). Touches `Conversation.UpdatedAt`. Reads `IOptions<ChatOptions>` *once* at the top of the method — do not re-read per token.
- System prompt template substitution uses `{firstName}`, `{workspaceName}`, `{plan}`, `{drafts}`, `{pendingInvites}` — `ChatService` fetches the user's owned workspace + counts the same way `StatsController` does, but inlined. **Re-render the system prompt fresh on every send** (replace, don't append) so mid-conversation stats stay accurate — e.g. if the user creates a draft and then asks "how many drafts?", they see the current count, not the count from message 1.
- **System prompt template (default in `appsettings.json`):**

  ```text
  You are Nova, a calm and concise assistant inside {workspaceName}.
  The user's name is {firstName}. They are on the {plan} plan with {drafts} drafts and {pendingInvites} pending invites.
  Reply in 1–2 short sentences. Warm but never effusive. Never use exclamation marks.
  Plain prose only — no markdown, no lists, no headers. Do not sign off ("- Nova", "Best,"). Just reply.
  Address the user only by their first name.
  ```

- **History is a sliding window, not a summary.** When the conversation exceeds `MaxHistoryMessages` (20), the oldest user/assistant turns silently fall off — the model loses early context with no warning. Acceptable for v1 (summarization is out of scope); document the limit in the runbook so the user isn't surprised when a long chat "forgets" early turns.

**HTTP client:** register via `IHttpClientFactory` in [Program.cs](../src/WelcomeApp.Api/Program.cs):
```csharp
builder.Services.AddHttpClient<IChatService, ChatService>((sp, client) =>
{
    var opts = sp.GetRequiredService<IOptions<ChatOptions>>().Value;
    client.BaseAddress = new Uri(opts.Endpoint);
    client.Timeout = TimeSpan.FromMinutes(2); // streaming can hang for a while
});
```
The `Authorization: Bearer <PAT>` header is added per-request inside `ChatService` (so a key rotation doesn't require restarting the host).

**New DTOs** ([Dtos/](../src/WelcomeApp.Api/Dtos/)):

- `ConversationSummaryDto(string Id, string Title, DateTimeOffset UpdatedAt, int MessageCount)` — list payload shape from the design's endpoint table.
- `ConversationDetailDto(string Id, string Title, DateTimeOffset UpdatedAt, IReadOnlyList<ChatMessageDto> Messages)` — full conversation, returned from `GET /conversations/:id`.
- `ChatMessageDto(string Id, string Role, string Content, DateTimeOffset CreatedAt)`
- `SendMessageRequest(string Message)` with `[Required][StringLength(4000)]` — note: 4000 chars is *our* input cap to keep requests bounded, **not** the GitHub Models token limit (which is much higher). Comment this on the DTO so future readers don't conflate the two.
- `UpdateTitleRequest(string Title)` with `[Required][StringLength(80, MinimumLength = 1)]` — body of the `PATCH` endpoint.

**New controller** (`Controllers/ChatController.cs`) — `[ApiController][Route("api/chat")][Authorize]`:

- `GET /api/chat/conversations` → 200 `[ConversationSummaryDto]` (newest first, last 20, **empty stubs filtered out** server-side).
- `POST /api/chat/conversations` → 201 `ConversationDetailDto` (creates a conversation with `Title = "New conversation"` and the seeded Nova greeting as the first assistant message; returns the full detail shape so the client can render immediately without a follow-up GET).
- `GET /api/chat/conversations/{id}` → 200 `ConversationDetailDto` (full conversation with messages in one round-trip — replaces the old `/messages` route). 404 if not owned.
- `PATCH /api/chat/conversations/{id}` → 204 on success, 404 if not owned, 400 if title fails validation. Body: `UpdateTitleRequest`. No editing UI on welcome — endpoint is built for future server-side title summarization and the broader-app surface.
- `POST /api/chat/conversations/{id}/messages` → SSE stream of `data: {"token":"..."}` events, terminated by `data: [DONE]`. 404 if not owned. 503 ProblemDetails on upstream rate-limit (`429` from GitHub Models). `// TODO: rate limit /api/chat/* per user — production gap. Target: ~60 messages/minute/user (per design recommendation).`
- `// TODO: DELETE /api/chat/conversations/{id} — design defers to broader-app surface; out of v1 scope.`
- SSE plumbing pattern — `try/finally` is required so the client always sees a terminator (without it, an upstream mid-stream error leaves `streamChat` hanging on `getReader().read()` forever):
  ```csharp
  Response.ContentType = "text/event-stream";
  Response.Headers.CacheControl = "no-cache";
  Response.Headers["X-Accel-Buffering"] = "no";
  try
  {
      await foreach (var token in chatService.StreamReplyAsync(userId, id, request.Message, HttpContext.RequestAborted))
      {
          await Response.WriteAsync($"data: {JsonSerializer.Serialize(new { token })}\n\n");
          await Response.Body.FlushAsync();
      }
  }
  catch (Exception ex) when (ex is not OperationCanceledException)
  {
      await Response.WriteAsync($"data: {JsonSerializer.Serialize(new { error = "stream_failed" })}\n\n");
  }
  finally
  {
      await Response.WriteAsync("data: [DONE]\n\n");
      await Response.Body.FlushAsync();
  }
  ```

  `streamChat` on the frontend recognizes both the `{ token }` and `{ error }` frame shapes.

**Config** ([appsettings.json](../src/WelcomeApp.Api/appsettings.json)) — new `Chat` section with `Endpoint`, `Model`, `MaxHistoryMessages`, `SystemPromptTemplate`. `Chat:ApiKey` lives in `dotnet user-secrets` — never in the repo.

### Frontend — `homework_one/client/src/`

**Layout** — per [02_CHAT_ADDENDUM.md](../designs/design_handoff_dark_auth/02_CHAT_ADDENDUM.md) (v2 design). `WelcomePage.tsx` restructures into a CSS grid: `grid-template-columns: minmax(0, 1fr) 280px` with `gap: 3rem`. **Left column**: eyebrow → title → sub → `<ChatHeader />` → `<MessageList />` → `<ChatInput />`. **Right column** (the rail): `<TodayPanel />` (existing stats) stacked above `<RecentConversationsList />` with `border-left: 1px solid rgba(255,255,255,.08); padding-left: 2rem`. No floating button, no slide-in panel, no toggle — chat is always visible.

**New types** in [lib/types.ts](../client/src/lib/types.ts):
- `Conversation`, `ChatMessage`, `MessageRole = 'user' | 'assistant' | 'system'`

**New lib** — `lib/chat.ts`:

- `streamChat(conversationId, message, token, onToken, signal)` — uses `fetch()` (not `EventSource`, which can't send the JWT bearer header) + `Response.body.getReader()` to parse `data: {...}\n\n` frames as they arrive. Calls `onToken(piece)` for each delta. Returns when `data: [DONE]` is seen. Recognizes both `{ token }` and `{ error }` frame shapes.
- `apiFetch`-style wrappers: `listConversations()`, `createConversation()`, `getConversation(id)`, `patchTitle(id, title)`. Note: no `getMessages` — `getConversation` returns the full detail shape in one trip.
- `relativeTime(date)` — port of the design's exact formatter ([02_CHAT_ADDENDUM.md L98-L106](../designs/design_handoff_dark_auth/02_CHAT_ADDENDUM.md)): `"just now"` / `"Nm ago"` / `"Nh ago"` / `"Nd ago"` for <7 days, otherwise `toLocaleDateString({month:'short', day:'numeric'})`. Used by `RecentConversationsList`.
- `deriveTitle(firstUserMessage)` — port of the design's title rule ([02_CHAT_ADDENDUM.md L376-L381](../designs/design_handoff_dark_auth/02_CHAT_ADDENDUM.md)). Used **only** for optimistic local display of the title between `POST /conversations` and the next `GET /conversations` — the server is authoritative.

**New hook** — `hooks/useChat.tsx`. **Provider hoisted to `WelcomePage`** so state survives any re-renders of child rails.

State shape (matches the design's contract in [02_CHAT_ADDENDUM.md `WelcomeState`](../designs/design_handoff_dark_auth/02_CHAT_ADDENDUM.md#state)):

```ts
interface Conversation {
  id: string;                   // server id once materialized; local 'stub-<uuid>' until then
  title: string;                // "New conversation" until first user turn
  messages: ChatMessage[];
  updatedAt: Date;
  userTurnsCount: number;       // 0 = stub, hidden from recents
  isStub: boolean;              // true if not yet POSTed
}
```

**Lazy stub materialization (the key pattern from v2):**

1. **On mount** — `listConversations()` hydrates the rail, then **locally prepend a fresh stub** with `id: 'stub-' + crypto.randomUUID()`, `title: 'New conversation'`, `isStub: true`, one seeded bot message (`"Hey {firstName}, what are we working on first?"`), `userTurnsCount: 0`. Set `activeConversationId` to the stub. The stub is **not** POSTed yet.
2. **On first user message in a stub** (`sendMessage(text)`):
   - Append the user message to local state, optimistically derive title via `deriveTitle(text)`.
   - `await createConversation()` to materialize on the server (server persists Nova's greeting; returns real id).
   - **Reconcile**: replace the stub's `id` with the server id, flip `isStub: false`.
   - Open the SSE stream via `streamChat(realId, text, ...)`, accumulate tokens into a draft assistant message.
   - On `[DONE]`: bump `updatedAt`, increment `userTurnsCount`. Server has already derived the title — no client `patchTitle` call needed.
3. **On `+ New`** (`startNewConversation()`) — prepend another local stub. Don't POST. The previously-active conversation, if it had user turns, is now visible in the rail.
4. **On recent-row click** (`selectConversation(id)`) — if the conversation's messages aren't loaded yet, `getConversation(id)` to lazy-load, then swap `activeConversationId`.

**Other behaviors:**

- `streaming: boolean` — drives the typing indicator and disables the composer.
- **Stream errors surface as a bot bubble**, not a toast — when `streamChat` sees an `{ error }` frame or the fetch throws, append an assistant message with the text `"I'm offline at the moment — try again in a sec."` and clear `streaming`. Keeps the persona in-character.
- **Recents filter** — `recentConversations` is a memoized selector: `conversations.filter(c => !c.isStub && c.userTurnsCount > 0).slice(0, 5)`. Server already filters empty stubs from `listConversations()`, but client also filters its own local stubs (which the server has never seen).

**New components** — `components/chat/`:

- `ChatHeader.tsx` — thin row above the thread. Accent dot (5×5 with accent glow) + active conversation title (mono 11px, uppercase, letter-spacing .16em, ellipsis truncate) on the left; `<NewConversationButton />` on the right (12×12 plus icon + "New" label, calls `startNewConversation()` from `useChat`). Wraps in `display: flex; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.75rem`.
- `MessageList.tsx` — scrollable, auto-scrolls to bottom on new tokens. While `streaming` and before the first token arrives, render a bot bubble containing the **three-dot typing indicator** from the design (`.wc-typing` — three `6×6px` dots with staggered `wcDot` translateY animation, 0.15s + 0.3s delays). Once tokens start arriving, the dots are replaced by the streaming text in the same bubble. Bot byline (the `● Nova` accent-glow square + label) renders **only above the first bot bubble** in the thread.
- `MessageBubble.tsx` — distinct styling for `user` vs `assistant` (no system messages rendered).
- `ChatInput.tsx` — composer. Textarea with Enter-to-send / Shift+Enter for newline, auto-grow up to `8.75rem` (140px), placeholder `"Ask Nova anything…"`. Send button disabled when input empty or `streaming` (visual: `filter: saturate(.4) brightness(.7)`).
- `RecentConversationsList.tsx` — right-rail panel below `<TodayPanel />` with 1.75rem top margin. Renders header `"RECENT CONVERSATIONS"` + count (`recentConversations.length`, mono, right-aligned). Each row is a full-width button with `padding: 0.5rem 0.625rem; margin: 0 -0.625rem; border-radius: 0.5rem`, two stacked lines (title 12.5px weight 500 / `relativeTime(updatedAt)` mono 10.5px). **Active row** (`id === activeConversationId`): `background: rgba(255,255,255,.05)`, `box-shadow: inset 2px 0 0 var(--accent)`, white text. Hover: lighter background, brighter text. Caps at 5 visible rows.

**New styles** — `styles/chat.css`:

Port the design's chat surface (`.wc-chat`, `.wc-thread`, `.wc-msg`, `.wc-bubble`, `.wc-byline`, `.wc-typing`, `.wc-composer`, `.wc-send`) verbatim, converting every fixed pixel value to **rem** (`16px` ≈ `1rem`) so it scales with root font-size. Keep the design's `color-mix(in oklab, …)` accent math and `backdrop-filter` glass effects unchanged — those are tokenless.

- Bubbles: bot = subtle white tint with 4px corner cut bottom-left, left-aligned; user = accent-tinted with dark text + accent glow, right-aligned. `max-width: 78%` on both.
- Composer: glass background with focus-ring glow (`box-shadow` ring + outer accent bloom on `:focus-within`).
- Send button: 2.25rem white-to-grey gradient square, `:active` scales to 0.95, disabled state desaturates and removes shadow.

**Mobile & responsive — explicit requirement:**

- **Breakpoint at `40rem` (640px).** Below that, the welcome grid collapses from `minmax(0, 1fr) 280px` (two columns) to a **single column** — chat stacks below the greeting, and the "Today, in your space" stats panel drops *below* the chat (or moves into a collapsible disclosure). The 280px right column must not force horizontal scroll on a 360px-wide phone.
- **Page padding** scales down: desktop `5rem 3.75rem 3rem` → mobile `4rem 1.25rem 1.5rem`. Use a single media query in `WelcomePage.css`, not inline-styled magic numbers.
- **Title** uses `clamp(2.5rem, 9vw, 5.5rem)` on mobile (overrides the desktop `clamp(56px, 7vw, 88px)` — converted to rem). Don't let the name line wrap awkwardly.
- **Composer textarea must have `font-size: 1rem` minimum (16px equivalent).** Anything smaller triggers iOS Safari's auto-zoom on focus — disorienting and breaks the layout. The design's `14px` is fine on desktop, but bump to `16px`/`1rem` at the mobile breakpoint.
- **Use `100dvh` (dynamic viewport height), not `100vh`,** anywhere the welcome stage is sized to the viewport. iOS Safari's `100vh` includes the URL bar even when collapsed, pushing the composer offscreen. `100dvh` shrinks correctly when the keyboard opens. Provide a `100vh` fallback for older browsers (`min-height: 100vh; min-height: 100dvh;`).
- **Thread `max-height`** scales down on mobile — desktop `15rem` (240px) shrinks to `min(60vh, 18rem)` so the composer stays visible above the keyboard.
- **Tap targets ≥ 2.75rem (44px)** — the send button (currently 2.25rem) needs a 0.5rem padding ring on mobile to hit Apple's touch-target guideline. Sign-out button in the corner chrome too.
- **Hover-only affordances** (the composer's focus ring, send button hover glow) need `:focus-visible` equivalents — mobile has no hover state, so any hover-only feedback is dead on touch devices.
- **Reduced-motion respect:** the design's `wcReveal`, `wcMsgIn`, `wcDot`, `wcPulse` animations should be gated behind `@media (prefers-reduced-motion: no-preference)`. With reduced motion, the chat surface fades in without translateY/blur, and the typing dots become a static `…`.

**Mobile design coverage is still missing — flag for designer.** The v2 handoff added multi-conversation UI but is still desktop-only. Open questions for v3 (or a separate mobile addendum):

- Below 40rem, where does `<RecentConversationsList />` go? Drawer triggered by a hamburger? Bottom sheet? Separate route entirely?
- Does the chat header (active title + `+ New`) stay in-line or move into a top bar?
- Does the composer pin to the viewport bottom (sticky) or scroll with the page?
- Where does `<TodayPanel />` sit — below the chat, in the same drawer as recents, or hidden behind a disclosure?

Until the designer addresses these, the implementation will follow the rules in the **Mobile & responsive** subsection above — single-column collapse, stats below chat, composer in normal flow. Treat this as a known v1 gap to revisit, not a blocker.

**WelcomePage integration** — [components/welcome/WelcomePage.tsx](../client/src/components/welcome/WelcomePage.tsx): **restructure** the existing layout (not a drop-in addition). The current `.w-grid` is replaced by the design's `minmax(0, 1fr) 280px` grid. Wrap everything in the `<ChatProvider>` (the hoisted `useChat` provider). The existing static stats become `<TodayPanel />` and move into the right rail; `<RecentConversationsList />` stacks below it. The left column owns the eyebrow → title → sub copy plus the chat (`<ChatHeader />` + `<MessageList />` + `<ChatInput />`). The chat surface inherits the reveal animation timing from the design — 1.5s delay so it appears last after the title/sub/right-rail reveals.

### Tests

**Backend** (`homework_one/tests/WelcomeApp.Api.Tests/`):

- `Unit/ChatServiceTests.cs` — system prompt substitution renders `firstName` / `workspaceName` / `plan` / counts correctly; history truncation at `MaxHistoryMessages`; `deriveTitle` (≤38 verbatim, >38 truncated with `…`); title is auto-set on first user message; uses `FakeHttpMessageHandler` to mock the upstream SSE response. Reuses [Infrastructure/FakeClock.cs](../tests/WelcomeApp.Api.Tests/Infrastructure/FakeClock.cs).
- `Integration/ChatControllerTests.cs` — `[Collection(ApiCollection.Name)]`, extends `IntegrationTestBase`:
  - `Conversations_require_auth` (401 without token across all routes)
  - `Start_then_list_returns_the_new_conversation_with_message_count`
  - `Cannot_read_another_users_conversation` (404 on `GET /:id`, `PATCH /:id`, and `POST /:id/messages`)
  - `Get_conversation_returns_messages_in_order` (verifies `GetConversationAsync` projects ordered messages)
  - `List_excludes_empty_stub_conversations` — creates a conversation, asserts it's absent from `GET /conversations` until a user message is posted, then asserts it appears
  - `Patch_title_updates_and_validates` — happy path (204 + persists), 400 on empty/too-long title, 404 on other user's conversation
  - `Send_message_streams_back_tokens_in_SSE_format` — registers a stub `IChatService` via `WithWebHostBuilder(b => b.ConfigureTestServices(...))` that yields known tokens, then reads `Response.Content.ReadAsStreamAsync` and asserts the framed bytes (including `[DONE]` terminator after both happy path and thrown-mid-stream error)

**Frontend** (`homework_one/client/src/`):

- `lib/chat.test.ts` — SSE parser splits `data:` frames correctly across buffer boundaries; handles `[DONE]` sentinel; recognizes `{ error }` frames; `relativeTime` returns the right buckets for `just now` / `Nm` / `Nh` / `Nd` / absolute date >7d; `deriveTitle` matches design rule. MSW intercepts with a `ReadableStream` body.
- `hooks/useChat.test.tsx` — covers the stub-materialization flow specifically:
  - Mount prepends a local stub with the Nova greeting; the stub does **not** appear in `recentConversations` until the user sends their first message
  - First `sendMessage`: POSTs to `/conversations` (server returns real id), reconciles the local stub's id, then streams the reply via SSE
  - `+ New` while a populated conversation is active: previous stays in recents, new stub becomes active
  - Stream error surfaces as a bot bubble with the offline message
- `components/chat/ChatSurface.test.tsx` — message bubble appears on submit, three-dot indicator shows then transitions to streamed text, composer disables while streaming.
- `components/chat/RecentConversationsList.test.tsx` — renders up to 5 rows, highlights the active row with the accent inset shadow, filters out `isStub: true` and `userTurnsCount === 0`, shows the design's relative-time strings.

**E2E:** skip chat in v1 Playwright. The real `models.github.ai` endpoint is slow + rate-limited + non-deterministic, so a meaningful e2e would need a server-side stub flag. Add a TODO in [runbook.md](../runbook.md).

---

## Files

**Create:**

- `homework_one/src/WelcomeApp.Api/Models/Conversation.cs`
- `homework_one/src/WelcomeApp.Api/Models/ChatMessage.cs`
- `homework_one/src/WelcomeApp.Api/Services/ChatOptions.cs`
- `homework_one/src/WelcomeApp.Api/Services/IChatService.cs`
- `homework_one/src/WelcomeApp.Api/Services/ChatService.cs`
- `homework_one/src/WelcomeApp.Api/Controllers/ChatController.cs`
- `homework_one/src/WelcomeApp.Api/Dtos/ConversationSummaryDto.cs`
- `homework_one/src/WelcomeApp.Api/Dtos/ConversationDetailDto.cs`
- `homework_one/src/WelcomeApp.Api/Dtos/ChatMessageDto.cs`
- `homework_one/src/WelcomeApp.Api/Dtos/SendMessageRequest.cs`
- `homework_one/src/WelcomeApp.Api/Dtos/UpdateTitleRequest.cs`
- `homework_one/src/WelcomeApp.Api/Migrations/<timestamp>_AddChat.cs`
- `homework_one/tests/WelcomeApp.Api.Tests/Unit/ChatServiceTests.cs`
- `homework_one/tests/WelcomeApp.Api.Tests/Integration/ChatControllerTests.cs`
- `homework_one/client/src/hooks/useChat.tsx`
- `homework_one/client/src/hooks/useChat.test.tsx`
- `homework_one/client/src/lib/chat.ts`
- `homework_one/client/src/lib/chat.test.ts`
- `homework_one/client/src/components/chat/ChatHeader.tsx`
- `homework_one/client/src/components/chat/MessageList.tsx`
- `homework_one/client/src/components/chat/MessageBubble.tsx`
- `homework_one/client/src/components/chat/ChatInput.tsx`
- `homework_one/client/src/components/chat/RecentConversationsList.tsx`
- `homework_one/client/src/components/chat/ChatSurface.test.tsx`
- `homework_one/client/src/components/chat/RecentConversationsList.test.tsx`
- `homework_one/client/src/styles/chat.css`

**Modify:**

- `homework_one/src/WelcomeApp.Api/Program.cs` — `Configure<ChatOptions>`, `AddHttpClient<IChatService, ChatService>`
- `homework_one/src/WelcomeApp.Api/Data/AppDbContext.cs` — `DbSet`s + fluent config for `Conversation` + `ChatMessage`
- `homework_one/src/WelcomeApp.Api/appsettings.json` — new `Chat` section
- `homework_one/src/WelcomeApp.Api/WelcomeApp.Api.http` — sample chat requests for all five routes (`GET list`, `GET /:id`, `POST`, `PATCH`, `POST /:id/messages`)
- `homework_one/client/src/lib/types.ts` — `Conversation`, `ChatMessage`, `MessageRole`
- `homework_one/client/src/components/welcome/WelcomePage.tsx` — **restructure** into the design's grid; integrate `<ChatProvider>`, `<ChatHeader />`, `<MessageList />`, `<ChatInput />`, `<RecentConversationsList />`; move existing static stats into `<TodayPanel />`
- `homework_one/client/src/main.tsx` — import `chat.css`
- `homework_one/client/src/test/handlers.ts` — default MSW handlers for all five `/api/chat/*` routes
- `homework_one/runbook.md` — new "Chat setup" section (GitHub PAT, user-secret command, sliding-window note)
- `homework_one/README.md` — mention chatbot in features
- `homework_one/plans/implementation-plan.md` — addendum noting the chat feature (or keep as-is and reference this plan)

---

## Reused patterns

- **Controller shape** — mirrors [AuthController.cs](../src/WelcomeApp.Api/Controllers/AuthController.cs) (Authorize, ProblemDetails, DTO-based DI)
- **Service+Options** — mirrors [JwtTokenService.cs](../src/WelcomeApp.Api/Services/JwtTokenService.cs) + [JwtOptions.cs](../src/WelcomeApp.Api/Services/JwtOptions.cs) (IOptions<T> + IClock injection)
- **Migration workflow** — same `dotnet ef migrations add` → apply to each DB pattern from [runbook.md](../runbook.md#1-set-the-jwt-signing-key)
- **Test infrastructure** — `ApiFactory`, `IntegrationTestBase`, `[Collection(ApiCollection.Name)]` — all in [Infrastructure/](../tests/WelcomeApp.Api.Tests/Infrastructure/). `ChatControllerTests` overrides `IChatService` via `WithWebHostBuilder` to inject a stub for the SSE round-trip.
- **MSW handlers** — extend [src/test/handlers.ts](../client/src/test/handlers.ts) with `/api/chat/*`. For streaming responses, return a `ReadableStream` body (MSW 2.x supports this natively).
- **`apiFetch` wrapper** — [lib/api.ts](../client/src/lib/api.ts) for non-streaming chat endpoints; only `streamChat` in `lib/chat.ts` bypasses it (because we need access to the raw response body reader).

---

## Verification

**Setup** (one-time):
1. Create a GitHub PAT at github.com/settings/tokens with `models:read` scope (no other scopes)
2. From `homework_one/src/WelcomeApp.Api/`: `dotnet user-secrets set "Chat:ApiKey" "<the-PAT>"`
3. From the same dir: `dotnet ef database update` against all three connection strings (dev / tests / e2e) — the runbook will be updated with the commands

**Tests:**
- `dotnet test homework_one/DevObsessed_Training.sln` → still all green, plus new `ChatServiceTests` + `ChatControllerTests`
- `cd homework_one/client && npm test` → still green, plus new `chat.test.ts`, `useChat.test.tsx`, `ChatPanel.test.tsx`
- `npm run e2e` → unchanged (chat not in e2e for v1)

**Live smoke (the real proof):**

1. Set the JWT user-secret from the Phase-1 reminder, plus the new `Chat:ApiKey`
2. Terminal A: `dotnet run` from API; Terminal B: `npm run dev` from client
3. Register a fresh user → land on welcome. Chat surface fades in below the greeting at 1.5s; Nova has already said `"Hey {firstName}, what are we working on first?"`. The "Recent conversations" rail is empty (just the header + count of 0).
4. Type `"What's my workspace called?"` → see tokens stream in, ending with something like `"Your workspace is called jane-hq."` (proves the system prompt got the personalization right). The chat header title updates from `NEW CONVERSATION` to a derived title; the conversation appears in the Recent conversations rail.
5. Click `+ New` → a fresh stub becomes active with the Nova greeting again. **The previous conversation stays in recents.** The empty stub does **not** appear in recents (proves the `userTurnsCount > 0` filter).
6. Click the older conversation in the rail → `GET /api/chat/conversations/{id}` lazy-loads its messages; the active-row accent shadow appears on its row. Type a follow-up that references the previous turn → bot answers correctly (proves history is being sent and tied to the right conversation).
7. Refresh the page → recents list re-hydrates from the server, the stub is regenerated locally, and prior conversations remain.
8. Sign out → sign back in → conversation still in the list (proves persistence works across sessions).
9. Disconnect network mid-stream → an `"I'm offline at the moment — try again in a sec."` bot bubble appears in-thread; the composer re-enables. Reconnect and send again → works.

**Gotchas to watch:**
- GitHub Models endpoint URL has shifted historically (`models.inference.ai.azure.com` → `models.github.ai/inference`). Confirm current URL from [docs.github.com/rest/models](https://docs.github.com/rest/models) before wiring `appsettings.json`.
- The SPA's CSP in [index.html](../client/index.html) is `default-src 'self'` — `/api/chat/*` is same-origin via the Vite proxy so this is fine, but the API's own CSP (`default-src 'self'` set in security-headers middleware) needs to keep skipping `/api/chat/*` the way it already skips `/swagger`. Actually it should be fine — the CSP only restricts what the response can load, not what the response can stream.
- `Response.Body.FlushAsync()` after every token is critical — without it, output buffers and tokens arrive in batches instead of one-by-one.
- `IAsyncEnumerable<string>` + EF Core in the same scope: open the DbContext, save the user message, dispose the context, stream from the LLM, open a new context, save the assistant message. Don't hold a DbContext open during the SSE loop.

---

## Effort estimate

~7–9 focused hours. Breakdown: backend entities + migration (30 min), `ChatService` (5 methods incl. `GetConversationAsync`, `UpdateTitleAsync`, server-side title derivation) + SSE plumbing (2 h), `ChatController` (5 routes incl. PATCH) + backend tests (incl. empty-stub filter + PATCH coverage) (1.5 h), frontend `useChat` with **stub-materialization** flow + SSE parser + `relativeTime`/`deriveTitle` + lib tests (2 h), chat components (`ChatHeader`, `MessageList`, `MessageBubble`, `ChatInput`, `RecentConversationsList`) + styles ported to rem (2 h), `WelcomePage` grid restructure + mobile breakpoint + integration polish + runbook/README updates (1 h).
