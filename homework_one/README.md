# Welcome App

A training-scope account-creation flow: dark-themed sign-up / sign-in screen followed by a personalised welcome dashboard that pulls real workspace stats. Built to port a high-fidelity HTML/JSX prototype into a production-shaped full-stack codebase.

The visual source of truth is [`design_handoff_dark_auth/Welcome Flow.html`](design_handoff_dark_auth/Welcome%20Flow.html). The design has only one selected variant (Orbs background, Split card layout) — everything else in the prototype was discarded.

---

## What it does

- **Sign up** — name, email, password. Passwords are PBKDF2-hashed via ASP.NET Core Identity. A personal workspace + membership row are created in a single transaction.
- **Sign in** — email + password. Generic 401 on failure (no account enumeration); an equalising dummy-hash narrows the timing side-channel.
- **Welcome screen** — staggered title reveal, animated time-greeting clock, real "Today, in your space" stats fetched from `/api/stats` (drafts, pending invites, workspace name, plan).
- **Nova chatbot** — streaming AI assistant embedded in the welcome screen. Multi-turn conversations with per-user history, "Recent conversations" rail, and lazy stub materialisation. Backed by GitHub Models (GPT-4.1-mini via OpenAI-compatible SSE). Server-side system prompt personalises Nova with the user's first name, workspace name, plan, and live stats.
- **Remember me** — checked → token persists in `localStorage` across sessions; unchecked → `sessionStorage` only.

---

## Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Backend | ASP.NET Core 8 Web API + Identity Core + EF Core | Industry-standard auth primitives; controllers (not minimal APIs) for trainee discoverability. |
| Auth | JWT bearer (HS256, 60-min access, no refresh) | Bearer flow is teachable; refresh tokens are explicitly out of scope. |
| Persistence | SQL Server LocalDB + EF Core migrations | Real provider parity — tests run against the same SQL Server-flavored DB as production. |
| Frontend | React 19 + Vite 8 + TypeScript 6 | Latest stable; TS 6's `erasableSyntaxOnly` enforced. |
| Styling | Plain CSS (custom properties, no Tailwind/CSS-in-JS) | The prototype's hand-tuned cascading selectors port directly; `rem` throughout for accessibility + mobile scaling. |
| Backend tests | xUnit + `WebApplicationFactory<Program>` + Respawn | Same provider as prod, cheap per-test reset. |
| Frontend unit/component | Vitest + RTL + MSW | jsdom-driven, no real network. |
| End-to-end | Playwright (Chromium) + axe-core | Real browser; desktop + mobile-viewport projects. |

---

## Architecture at a glance

```text
Browser (Vite SPA :5173) ──/api/*──► Vite proxy ──► ASP.NET Core API :5000 ──► SQL Server LocalDB
                                                       │
                                                       ├─ AuthController     POST /api/auth/{register,login}
                                                       ├─ MeController       GET  /api/me            [Authorize]
                                                       ├─ StatsController    GET  /api/stats         [Authorize]
                                                       ├─ ChatController     /api/chat/*  SSE stream [Authorize]
                                                       │    └─ ChatService ──► GitHub Models (GPT-4.1-mini)
                                                       └─ GET  /health (anon, for Playwright readiness)
```

Three LocalDB databases keep environments isolated:

- `sqldb-welcomeapp-dev` — `dotnet run`
- `sqldb-welcomeapp-tests` — `dotnet test` (Respawned between tests)
- `sqldb-welcomeapp-e2e` — `npm run e2e`

None auto-migrate — `dotnet ef database update` is the single entry point.

---

## Project layout

```text
homework_one/
├─ DevObsessed_Training.sln
├─ global.json                       # pins SDK to 8.0.x
├─ src/WelcomeApp.Api/               # ASP.NET Core 8 Web API
├─ tests/WelcomeApp.Api.Tests/       # xUnit (56 tests)
├─ client/                           # React/Vite SPA
│  ├─ src/                           # components, hooks, lib, styles, MSW handlers
│  └─ e2e/                           # Playwright specs (14 tests)
├─ designs/design_handoff_dark_auth/ # Source-of-truth visual reference (unchanged)
└─ plans/                            # implementation-plan.md + chatbot-feature.md
```

---

## Getting started

Run everything locally — see **[runbook.md](runbook.md)** for the full setup steps including JWT user-secret, DB migrations, and Playwright browser install.

Quick version, once prerequisites are in place:

```powershell
# Terminal A — API on :5000
cd src/WelcomeApp.Api
dotnet run

# Terminal B — SPA on :5173 (proxies /api → :5000)
cd client
npm run dev
```

Browse [http://localhost:5173](http://localhost:5173).

---

## Testing

149 tests across three runners. All must be green before shipping:

```powershell
dotnet test homework_one/DevObsessed_Training.sln    # 56 backend (xUnit)
cd homework_one/client
npm test                                              # 79 frontend (Vitest)
npm run e2e                                           # 14 end-to-end (Playwright)
```

See [runbook.md](runbook.md#running-tests) for project-level and watch-mode variants.

---

## Notable design decisions

These are spelled out at length in [plans/implementation-plan.md](plans/implementation-plan.md); short version here.

- **JWT in storage (`localStorage` / `sessionStorage`), not HttpOnly cookies.** XSS-vulnerable by design — trainees can inspect tokens in DevTools. Production would invert this.
- **No refresh tokens.** 60-minute access tokens; SPA bounces to auth on 401.
- **No rate limiting on `/api/auth/login`.** `TODO` left in `AuthController.Login`; ASP.NET Core 8's `AddRateLimiter` is the production fix.
- **Password policy is min-6, no complexity.** Matches the prototype's UX. NIST SP 800-63B is the production policy.
- **`MapInboundClaims = false`** on JwtBearer — otherwise .NET 8's `JsonWebTokenHandler` rewrites `sub` → `ClaimTypes.NameIdentifier` and `MeController` can't read the user id by raw claim name.
- **`WorkspaceMember.UserId` FK uses `Restrict`, not `Cascade`.** Required to break the multi-cascade path SQL Server otherwise rejects at migration time.
- **`EmailIndex` promoted to unique.** Identity's default index on `NormalizedEmail` is non-unique; we override it so duplicate-email is rejected at the DB layer too.
- **Nova chatbot uses GitHub Models (OpenAI-compatible SSE) via `IHttpClientFactory`.** The `Authorization: Bearer <PAT>` header is added per-request inside `ChatService` so a key rotation doesn't require restarting the host. `IServiceScopeFactory` manages `AppDbContext` lifetimes explicitly so the context is never held open across `yield return` in the `IAsyncEnumerable` SSE loop.
- **Chat history uses a 20-message sliding window.** The oldest turns silently drop when a conversation exceeds the limit. Summarization for long context windows is out of scope for v1.
- **Stub-materialization pattern in `useChat`.** The frontend prepends a local stub conversation on mount (not POSTed yet). The stub is materialized via `POST /api/chat/conversations` only when the user sends their first message — avoiding orphan server records from abandoned `+ New` clicks.
- **CSS uses `rem`, not `px`, with `@media (max-width: 40rem)` and `@media (prefers-reduced-motion: reduce)`** breakpoints. The desktop-first px-heavy prototype was ported value-for-value through a `/16` divide; user font-size scaling now works.
- **Three separate LocalDB databases.** Isolating dev / tests / e2e prevents one suite's data from leaking into another and gives each its own reset strategy.

---

## Reading order for new contributors

1. [plans/implementation-plan.md](plans/implementation-plan.md) — the spec. Everything else implements this.
2. [runbook.md](runbook.md) — get the app running.
3. [src/WelcomeApp.Api/Program.cs](src/WelcomeApp.Api/Program.cs) — pipeline + DI in one file.
4. [client/src/App.tsx](client/src/App.tsx) — top-level routing between auth and welcome screens.
5. [tests/WelcomeApp.Api.Tests/Infrastructure/ApiFactory.cs](tests/WelcomeApp.Api.Tests/Infrastructure/ApiFactory.cs) — the integration-test harness; sets env vars in a static constructor to beat Program.cs's synchronous config reads.

---

## Out of scope

Refresh tokens · password reset · email confirmation · 2FA · production deployment / Docker · production API URL configuration · repository / unit-of-work abstractions · MediatR / FluentValidation. These are listed verbatim in the implementation plan's "Out of scope (deliberately)" section.
