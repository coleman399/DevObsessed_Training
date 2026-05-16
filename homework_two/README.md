# AGP Command Station

A role-aware AI workbench for AGP team members (PO, SE, QA). Sign in with your Microsoft account, bring your own Anthropic API key, and get a unified command station wired into Azure DevOps, Outlook, Calendar, Microsoft Teams, and ADO + GitHub repositories.

The visual source of truth is [`designs/v2/`](designs/v2/). The selected variant is Option Workbench v2 (light theme, AGP navy/amber palette).

---

## What it does

- **Microsoft Entra ID sign-in** — MSAL popup flow acquires an ID token, the backend validates it via OpenID Connect discovery, upserts the user by `oid`, and issues an HS256 app JWT (60-min).
- **Role-aware AI chat** — streaming Claude assistant (per-user Anthropic key, AES-256-GCM encrypted at rest). System prompt assembles your `~/.claude/CLAUDE.md` persona + role guidance (PO / SE / QA).
- **Agentic tool use** — Claude calls `search_code`, `get_file`, `list_directory`, `search_emails`, `get_email_thread`, `search_teams_messages`, `get_channel_messages` server-side. Tool indicators stream to the UI in real time. Up to 8 tool rounds per message.
- **Work Items (Phase B)** — list assigned ADO items, AI-assisted create (Bug / Task / User Story), inline state transitions, add comments. No PAT — auth flows through the Microsoft token.
- **Microsoft 365 (Phase C)** — Outlook inbox with AI reply drafting, Calendar week view with AI event drafting, Teams chats + channel messages with inline DM replies and AI message polish and "Post to channel".
- **Repos & PRs (Phase D)** — ADO and GitHub repos, lazy file tree browser, inline code viewer, Pin to chat, PR list with AI summary, approve (ADO), and comment thread.
- **Global search (Phase F)** — `Ctrl+K` command palette fans out to ADO Work Item Search, ADO Code Search, GitHub Issues/PRs, GitHub Code, and Graph unified search simultaneously.
- **Notification bell (Phase G)** — aggregates ADO work item changes, PR review requests, unread email, upcoming meetings, and Teams @mentions; 60-second poll.
- **Keyboard shortcuts (Phase H)** — `Ctrl+K` search, `Ctrl+J` toggle chat, `Ctrl+N` new work item, `Ctrl+/` shortcuts modal, `1–5` switch tabs, `Esc` close overlay.

---

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Backend | ASP.NET Core 8 Web API + Identity Core + EF Core | Controllers, not minimal APIs |
| Auth | Microsoft Entra ID OIDC → app HS256 JWT (60-min) | MSAL popup on frontend, OpenIdConnect discovery on backend |
| Encryption | AES-256-GCM (`EncryptionService`) | Anthropic key + GitHub PAT encrypted at rest |
| AI | Anthropic API (`claude-sonnet-4-6`) | Per-user key, streaming SSE with tool-use loop |
| Persona | `ClaudePersonaService` reads `~/.claude/CLAUDE.md` | Cached 5 min; invalidated on profile save |
| Persistence | SQL Server LocalDB + EF Core migrations | |
| Frontend | React 19 + Vite 8 + TypeScript 6 | |
| Styling | Plain CSS, rem throughout, AGP brand tokens | |
| Backend tests | xUnit + FluentAssertions | 6 unit tests (EncryptionService, DeriveTitle) |

---

## Architecture at a glance

```text
Browser (Vite SPA :5173)
  │  MSAL popup → Microsoft Entra ID
  │  POST /api/auth/microsoft (ID token) → app JWT
  │
  ├─/api/auth/*        AuthController        OIDC validation → upsert user → issue JWT
  ├─/api/profile       ProfileController     GET/PATCH role, keys, DevOps, GitHub, Teams
  ├─/api/chat/*        ChatController        Anthropic SSE + tool-use loop
  ├─/api/devops/*      DevOpsController      ADO proxy (X-DevOps-Token, no PAT)
  ├─/api/repos/github  ReposController       GitHub proxy (stored encrypted PAT)
  ├─/api/graph/*       GraphController       Microsoft Graph proxy (X-Graph-Token)
  ├─/api/search        SearchController      Parallel fan-out across all sources
  ├─/api/notifications NotificationsController  Aggregated from ADO + Graph (60s poll)
  └─/health            anon readiness probe

SQL Server LocalDB ← AgpCommandStation (single dev DB)

Token flow:
  MSAL caches separate tokens per audience in sessionStorage.
  Frontend sends X-Graph-Token on /api/graph/* and X-DevOps-Token on /api/devops/*.
  Backend forwards each as Authorization: Bearer to the respective API.
  Neither token is stored in the DB.
```

---

## Project layout

```text
homework_two/
├─ AgpCommandStation.sln
├─ plans/agp-command-station.md        # Full design spec for all 8 phases
├─ designs/v2/                         # Visual source of truth (do not modify)
├─ src/AgpCommandStation.Api/          # ASP.NET Core 8 Web API
│  ├─ Program.cs
│  ├─ Controllers/
│  │  ├─ AuthController.cs             # OIDC token → app JWT
│  │  ├─ ProfileController.cs          # GET/PATCH /api/profile
│  │  ├─ ChatController.cs             # SSE + workitem/email/event/pr drafts
│  │  ├─ DevOpsController.cs           # ADO work items + repos + PRs
│  │  ├─ ReposController.cs            # GitHub repos + PRs
│  │  ├─ GraphController.cs            # Outlook + Calendar + Teams
│  │  ├─ SearchController.cs           # Global search fan-out
│  │  └─ NotificationsController.cs    # Notification aggregation
│  ├─ Services/
│  │  ├─ AnthropicChatService.cs       # Streaming loop + tool use
│  │  ├─ ClaudePersonaService.cs       # ~/.claude/ persona assembly
│  │  ├─ EncryptionService.cs          # AES-256-GCM
│  │  ├─ JwtTokenService.cs
│  │  ├─ ToolExecutorService.cs        # Executes all 7 Claude tools
│  │  ├─ ToolDefinitions.cs            # Anthropic tool schemas
│  │  ├─ SseEvent.cs                   # TextToken | ToolCallEvent
│  │  └─ ToolContext.cs
│  ├─ Models/                          # ApplicationUser, Conversation, ChatMessage, UserRole
│  ├─ Data/                            # AppDbContext, DesignTimeDbContextFactory
│  ├─ Dtos/
│  └─ Migrations/
├─ tests/AgpCommandStation.Api.Tests/  # xUnit (6 unit tests)
└─ client/                             # Vite + React 19 + TypeScript
   ├─ src/
   │  ├─ components/
   │  │  ├─ auth/           # SignInPage, OnboardingModal
   │  │  ├─ chat/           # ChatInput, MessageList, MessageBubble, ToolCallIndicator, PinnedFilesBar
   │  │  ├─ command/        # CommandStation (shell)
   │  │  ├─ workitems/      # WorkItemList, WorkItemCard, WorkItemBuilder
   │  │  ├─ outlook/        # MailPanel, ComposeModal
   │  │  ├─ calendar/       # CalendarPanel, NewEventModal
   │  │  ├─ teams/          # TeamsPanel, SendToChannelModal
   │  │  ├─ repos/          # RepoPanel, RepoTree, PullRequestCard, NewPrModal
   │  │  ├─ search/         # CommandPalette
   │  │  ├─ notifications/  # NotificationBell
   │  │  ├─ shortcuts/      # KeyboardShortcutsModal
   │  │  └─ profile/        # ProfileSettings
   │  ├─ hooks/             # useAuth, useChat, useWorkItems, useMail, useCalendar, useTeams,
   │  │                     # useRepos, useSearch, useNotifications, useKeyboardShortcuts, useToast
   │  ├─ lib/               # api.ts, auth.ts (MSAL), chat.ts, types.ts
   │  └─ styles/            # tokens.css (AGP brand), global.css, command.css, chat.css,
   │                        # workitems.css, m365.css, repos.css, overlay.css
   ├─ vite.config.ts        # proxies /api → :5001
   └─ vitest.config.ts
```

---

## Getting started

Run everything locally — see **[runbook.md](runbook.md)** for the full setup including Azure AD registration, user-secrets, and DB migration.

Quick version once prerequisites are in place:

```powershell
# Terminal A — API on :5001
cd src/AgpCommandStation.Api
dotnet run

# Terminal B — SPA on :5173 (proxies /api → :5001)
cd client
npm run dev
```

Browse [http://localhost:5173](http://localhost:5173). Sign in with your AGP Microsoft account, complete the onboarding modal, and start working.

---

## Testing

```powershell
# Backend unit tests (6 — EncryptionService + DeriveTitle)
cd homework_two
dotnet test AgpCommandStation.sln

# Frontend type-check + build
cd homework_two/client
npm run build
```

---

## Notable design decisions

- **Microsoft Entra ID auth, no email/password.** The `oid` claim is the user's stable identifier — not their email. Avoids duplicate accounts on email rename.
- **Per-user Anthropic key, AES-256-GCM encrypted.** The raw key never appears in API responses. `EncryptionService` uses a random 12-byte nonce per encryption, so the same plaintext always produces a different ciphertext.
- **No ADO PAT.** Azure DevOps access comes through the Microsoft OAuth token (`499b84ac-...` scope). The frontend acquires a separate ADO access token via MSAL and sends it as `X-DevOps-Token` on each proxied call. Backend forwards it as `Bearer` — never stored.
- **Graph token passthrough, same pattern.** `X-Graph-Token` header for all Graph calls. Neither token touches the DB.
- **GitHub PAT stored encrypted, not passed as a header.** Unlike ADO/Graph, GitHub has no delegated OAuth flow here. The PAT is decrypted server-side per-request inside `ReposController` and `ToolExecutorService`.
- **Streaming tool-use loop (up to 8 rounds).** `AnthropicChatService.StreamReplyAsync` handles `content_block_start` (tool_use), collects `input_json_delta` chunks, executes tools on `stop_reason: tool_use`, and resumes streaming. `ToolCallEvent` SSE events let the frontend show animated indicators.
- **`ClaudePersonaService` reads `~/.claude/CLAUDE.md` at runtime.** Backtick file references (`\`SOUL.md\``) are resolved and concatenated in order. Cached for 5 minutes; invalidated on `PATCH /api/profile`. Falls back to `BotPersonaMarkdownOverride` then a generic AGP persona.
- **`ChannelMessage.Send` scope requires IT admin consent.** The app detects missing scope and shows a warning banner in both the Teams panel and `SendToChannelModal`. "Post to channel" is disabled without the grant.
- **Pinned files bypass the tool loop.** File paths pinned in `PinnedFilesBar` are appended to the system prompt as a note. Claude then uses `get_file` to read them if asked — no separate fetch at send time.
- **Notifications are session-only.** `useNotifications` polls every 60 seconds and stores state in React. Nothing persists to the DB — mark-as-read is client-side only.
- **CSS uses `rem`, not `px`, with `@media (max-width: 48rem)` breakpoints.** AGP brand tokens (`--agp-navy-600: #03345a`, `--agp-amber-500: #ebb63b`) defined in `tokens.css`.

---

## Reading order for new contributors

1. [`plans/agp-command-station.md`](plans/agp-command-station.md) — the full spec for all 8 phases.
2. [`runbook.md`](runbook.md) — get the app running.
3. [`src/AgpCommandStation.Api/Program.cs`](src/AgpCommandStation.Api/Program.cs) — DI and pipeline.
4. [`src/AgpCommandStation.Api/Services/AnthropicChatService.cs`](src/AgpCommandStation.Api/Services/AnthropicChatService.cs) — the streaming tool-use loop.
5. [`client/src/components/command/CommandStation.tsx`](client/src/components/command/CommandStation.tsx) — the root shell; all tabs, overlays, and keyboard shortcuts wire here.

---

## Out of scope

Refresh tokens · password reset · `ChannelMessage.Send` IT admin consent flow · real-time notifications via SignalR or webhooks (replaced by 60s poll) · production deployment / Docker · code-splitting the bundle · multi-tenant ADO (only one org/project per user profile) · Playwright e2e suite.
