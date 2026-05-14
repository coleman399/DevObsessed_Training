# Welcome App — Dark Auth (ASP.NET Core 8 + React/Vite)

## Context

The repo currently contains only `design_handoff_dark_auth/` — an interactive React/JSX prototype of a dark-mode sign-up / sign-in flow plus a post-auth welcome greeting. We're building the real thing: a training-scope welcome app that authenticates users (with hashed passwords), then shows them a personalised welcome screen with "Today in your space" stats.

**Decisions locked in with the user:**

- Backend: ASP.NET Core 8 Web API + ASP.NET Core Identity (password hashing) + EF Core
- Storage: SQL Server LocalDB instance `(localdb)\MSSQLLocalDB`, with a dedicated database `sqldb-welcomeapp-dev` (created by EF on first `database update` — do not reuse `sqldb-elodata-cus-dev` to avoid `AspNetUsers` table collisions with that project)
- Auth state: JWT bearer tokens
- Scope: full prototype port (signup, signin, welcome with name + greeting + stats) and **real persistence** of the stats data (drafts, invites, workspace, plan)
- Frontend: React 18 + Vite + TypeScript, ported from the JSX prototype, Orbs background variant (per `design_handoff_dark_auth/README.md`)

## High-level architecture

```text
DevObsessed_Training/
├─ DevObsessed_Training.sln
├─ src/WelcomeApp.Api/         ← ASP.NET Core 8 Web API (:5000)
├─ tests/WelcomeApp.Api.Tests/ ← xUnit tests (unit + integration)
├─ client/                     ← Vite + React + TS SPA (:5173, proxies /api → :5000)
└─ design_handoff_dark_auth/   (existing, untouched)
```

Vite dev proxies `/api/*` to the backend, so the SPA always speaks same-origin during dev — keeps the JWT story simple, no CORS preflights to debug. CORS policy still added on the backend for safety when the SPA isn't proxied.

---

## Backend — `src/WelcomeApp.Api/`

### Project shape

- Single Web API project, target `net8.0` (LTS).
- Controllers (not minimal APIs) — better trainee discoverability with `[ApiController]` + `[Authorize]`.
- Folders: `Controllers/`, `Data/`, `Models/`, `Dtos/`, `Services/`, `Migrations/`.

### Files to create

| Path | Purpose |
| --- | --- |
| `DevObsessed_Training.sln` | Solution referencing the API project |
| `.gitignore` | Standard .NET ignores |
| `src/WelcomeApp.Api/WelcomeApp.Api.csproj` | `net8.0` + packages below |
| `src/WelcomeApp.Api/Program.cs` | DI, Identity, JWT, EF, CORS, controllers, pipeline, `MapGet("/health", () => Results.Ok())` |
| `src/WelcomeApp.Api/appsettings.json` | Connection string + Jwt + Cors sections |
| `src/WelcomeApp.Api/appsettings.Development.json` | Dev logging |
| `src/WelcomeApp.Api/Properties/launchSettings.json` | Two profiles: `WelcomeApp.Api` bound to `http://localhost:5000` (default dev), `e2e` bound to the same URL but with `ConnectionStrings__Default` pointed at the e2e DB |
| `src/WelcomeApp.Api/Models/ApplicationUser.cs` | `IdentityUser` + `DisplayName`, `CreatedAt` |
| `src/WelcomeApp.Api/Models/Workspace.cs` | Id, Name, OwnerUserId, Plan, CreatedAt |
| `src/WelcomeApp.Api/Models/WorkspaceMember.cs` | Composite key (WorkspaceId, UserId) |
| `src/WelcomeApp.Api/Models/Draft.cs` | Id, UserId, Title, CreatedAt |
| `src/WelcomeApp.Api/Models/Invite.cs` | Id, WorkspaceId, InvitedEmail, Status, CreatedAt |
| `src/WelcomeApp.Api/Models/InviteStatus.cs` | enum Pending/Accepted/Declined |
| `src/WelcomeApp.Api/Data/AppDbContext.cs` | `IdentityDbContext<ApplicationUser>` + DbSets + Fluent config |
| `src/WelcomeApp.Api/Dtos/RegisterRequest.cs` | name, email, password (DataAnnotations) |
| `src/WelcomeApp.Api/Dtos/LoginRequest.cs` | email, password |
| `src/WelcomeApp.Api/Dtos/AuthResponse.cs` | token, expiresAt, user |
| `src/WelcomeApp.Api/Dtos/MeResponse.cs` | id, name, email, createdAt |
| `src/WelcomeApp.Api/Dtos/StatsResponse.cs` | drafts, pendingInvites, workspaceName, memberCount, plan |
| `src/WelcomeApp.Api/Services/JwtOptions.cs` | POCO bound from `Jwt:` |
| `src/WelcomeApp.Api/Services/IJwtTokenService.cs` + `JwtTokenService.cs` | Issue tokens |
| `src/WelcomeApp.Api/Services/IUserRegistrationService.cs` + `UserRegistrationService.cs` | Transactional create-user-and-personal-workspace |
| `src/WelcomeApp.Api/Controllers/AuthController.cs` | `POST /api/auth/register`, `POST /api/auth/login` |
| `src/WelcomeApp.Api/Controllers/MeController.cs` | `GET /api/me` `[Authorize]` |
| `src/WelcomeApp.Api/Controllers/StatsController.cs` | `GET /api/stats` `[Authorize]` |
| `src/WelcomeApp.Api/WelcomeApp.Api.http` | REST Client verification |

### Key code decisions

**Minimal Identity** — use `AddIdentityCore<ApplicationUser>(...)` (not `AddIdentity`) so we get `UserManager`, `IUserStore`, `IPasswordHasher` (PBKDF2 + HMAC-SHA256, salted, ~100k iterations) without the cookie scheme or MVC UI. Layer JWT bearer as the only auth scheme.

**Identity options** — set in `AddIdentityCore`:

- `User.RequireUniqueEmail = true` — backs the "email may not be reused" rule with a unique index on `NormalizedEmail`. Identity will reject a second registration with `IdentityError.Code = "DuplicateEmail"` (or `"DuplicateUserName"` if names collide).
- `Password.RequiredLength = 6`, all `Require*` complexity flags `false` (matches prototype UX; see Password rules below).
- `User.AllowedUserNameCharacters` left at the default but **`UserName` is set to the email** in `UserRegistrationService` so the unique-email guarantee actually covers the registration path. Both `UserName` and `Email` are populated; Identity normalizes both for case-insensitive uniqueness.

**Duplicate-email handling** — `AuthController.Register` inspects `IdentityResult.Errors`:

- Any error with `Code` in `{ "DuplicateEmail", "DuplicateUserName" }` → return `409 Conflict` with a `ProblemDetails` whose `title` is `"Email already registered."` and a stable `type` URI. **Do not** echo whether the conflict was on the email or username — both map to the same outward signal.
- Any other Identity error (e.g. weak password slipping past DataAnnotations) → `400 Bad Request` with the Identity error descriptions surfaced in `ProblemDetails.errors`.
- The frontend maps `409` from `/api/auth/register` to the inline "That email is already in use. Try signing in instead." copy under the email field (with a one-click "Switch to Sign in" affordance that preserves the typed email).

**Password rules** — min length 6, no character-class requirements. Deliberately matches the prototype's UX, not production-grade policy. Document this in code as a training-scope choice so it isn't cargo-culted into other apps. `RegisterRequest.Password` also carries `[StringLength(128)]` to cap the input fed to PBKDF2 (prevents a trivial DoS from a multi-MB password body).

**JWT claims**: `sub = user.Id`, `email`, `name = DisplayName`, `jti`, `iat`. Signed with `SymmetricSecurityKey` from `Jwt:Key`. 60-min lifetime. No refresh tokens (out of scope) — the welcome screen will silently 401 and bounce back to auth when the token expires; this is documented behaviour, not a bug.

**Claim mapping** — JWT bearer's default mappers expect SOAP-style claim URIs, so `User.Identity!.Name` will be `null` if you set a bare `"name"` claim and stop there. Pin the mapping in `Program.cs`:

```csharp
JwtBearerDefaults.AuthenticationScheme → options.TokenValidationParameters.NameClaimType = JwtRegisteredClaimNames.Name;
JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();  // stop SOAP-URI rewriting; keep raw claim names
```

Without this, step 5 of the implementation sequence (placeholder `MeController` returning `User.Identity.Name`) silently returns nothing and the bearer-pipeline smoke test gives a false positive.

**JwtTokenService + `IClock`** — inject `IClock` (a one-method `DateTimeOffset Now { get; }` abstraction with a `SystemClock : IClock` default) instead of calling `DateTimeOffset.UtcNow` inline. Lets `JwtTokenServiceTests` assert expiry deterministically by swapping in a `FakeClock`. Tiny abstraction, real test-quality win, and a teachable pattern.

**DbContext** — `IdentityDbContext<ApplicationUser>` with default `string` (GUID) keys for uniformity. Fluent rules: `WorkspaceMember` composite key (`WorkspaceId`, `UserId`); `Invite.Status` stored as string via `HasConversion<string>()`; unique index on `Workspace(OwnerUserId)` since each user owns exactly one personal workspace in scope.

**FK delete behaviour — pinned explicitly** to prevent the SQL Server "may cause cycles or multiple cascade paths" error at migration time. Without `WorkspaceMember.UserId` set to `Restrict`, deleting a user triggers two cascade paths into `WorkspaceMembers` (one via `User → WorkspaceMember`, one via `User → Workspace → WorkspaceMember`) and `dotnet ef database update` fails:

| FK | OnDelete | Notes |
| --- | --- | --- |
| `Workspace.OwnerUserId → AspNetUsers.Id` | `Cascade` | Deleting a user removes their owned workspaces (training-scope simplicity). |
| `WorkspaceMember.WorkspaceId → Workspaces.Id` | `Cascade` | Workspace deletion clears its membership rows. |
| `WorkspaceMember.UserId → AspNetUsers.Id` | `Restrict` | Required to break the multi-cascade-path. Manual `DELETE FROM WorkspaceMembers WHERE UserId = @id` is needed if you ever wire a user-delete flow (out of scope today). |
| `Draft.UserId → AspNetUsers.Id` | `Cascade` | Single path. |
| `Invite.WorkspaceId → Workspaces.Id` | `Cascade` | Single path. |

Configure each with `entity.HasOne(...).WithMany(...).OnDelete(DeleteBehavior.Cascade \| .Restrict)` in `OnModelCreating`.

**Auto-create workspace on register** — done in `UserRegistrationService`, not the controller. Wraps user creation + workspace insert + membership insert in `BeginTransactionAsync`. `UserName` and `Email` are both set to the submitted email (so Identity's `RequireUniqueEmail` covers the username path too). Plan = `"Free"`. This keeps `AuthController` thin and makes the multi-entity write reviewable in one place.

**Workspace name derivation** — input is `DisplayName`. Steps: trim → take everything before the first space → `string.Normalize(NormalizationForm.FormD)` → drop chars where `CharUnicodeInfo.GetUnicodeCategory == NonSpacingMark` (folds Latin diacritics: `ç`→`c`, `é`→`e`, `ñ`→`n`, `ü`→`u`) → lowercase (invariant culture) → strip every remaining char not matching `[a-z0-9]` → if the result is empty, fall back to `"user"` → append `-hq`. Examples: `"Jane Doe"` → `jane-hq`, `"François O'Brien"` → `francois-hq`, `"Zoë"` → `zoe-hq`, `"張偉"` → `user-hq` (non-Latin scripts have no diacritic decomposition and get stripped — ASCII-only keeps URLs and SQL filters simple in training scope), `"——"` → `user-hq`. Covered by a dedicated unit test (see Testing section).

**Stats query** — four small awaits in `StatsController`: pick the user's owned workspace (oldest), count drafts by userId, count pending invites in that workspace, count members. Returns 0/0/`{name}-hq`/1/Free immediately after register. `StatsResponse.plan` is the raw plan value (`"Free"`); the `· trial` suffix in the design copy is **client-side formatting** applied via a `formatPlan(plan: string): string` helper in `src/lib/format.ts` (currently maps `"Free" → "Free · trial"`, everything else returns as-is). `StatsList.tsx` calls `formatPlan(stats.plan)` — keeps the DTO contract clean and isolates the suffix logic for future plan tiers (`Pro`, `Team`, etc.). `memberCount` is included in the DTO but is not rendered in the prototype's four-row list; it's exposed for future use and asserted in tests, not displayed.

**Generic 401 on bad login** — don't leak "unknown email" vs "wrong password" (avoids account enumeration). Both paths return 401 with the same `ProblemDetails`. To **narrow** the timing-attack side channel, the unknown-email path still invokes `IPasswordHasher<ApplicationUser>.HashPassword(new ApplicationUser(), submittedPassword)` against a throwaway instance before returning — this equalises the *hash* cost (the dominant CPU work) with the wrong-password path. The dummy hash is discarded. **Caveat**: the unknown-email path still skips the `FindByEmailAsync` DB roundtrip, so wall-clock parity is approximate, not constant-time. The right production answer is rate limiting on `/api/auth/login`, called out in Security trade-offs.

**CORS** — named policy `"spa"` from `Cors:SpaOrigin` config, applied before `UseAuthentication`. No `AllowCredentials` (JWT in `Authorization` header). Configured in `Program.cs` from day one (step 1 of the implementation sequence) so the pipeline is correct when the first endpoint goes in — adding CORS late forces a re-verification pass of every prior auth round trip.

**Dev HTTP only** — `launchSettings.json` binds `http://localhost:5000` exclusively in the default profile. `UseHttpsRedirection` is **not** added in development (`if (!app.Environment.IsDevelopment()) app.UseHttpsRedirection();`). Rationale: the Vite proxy targets HTTP, there's no dev cert to manage, and trainees don't hit the "redirect to a port nothing listens on" trap. Production deployment (out of scope) re-enables HTTPS with a real cert.

**Swagger** — `AddEndpointsApiExplorer()` + `AddSwaggerGen()` in services; `if (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); }` in the pipeline. Swagger config registers the JWT bearer security definition so the **Authorize** button in the UI accepts a token from `/api/auth/login` and stamps `Authorization: Bearer …` on subsequent requests — turns Swagger into a self-contained smoke-test surface alongside the `.http` file. Swagger UI lives at `http://localhost:5000/swagger`.

**Security headers** — small middleware added immediately after `UseRouting`:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY` (the SPA never frames the API)
- `Content-Security-Policy: default-src 'self'` on API responses — **but skip on `/swagger*` paths.** Swagger UI loads inline scripts and styles; a strict `default-src 'self'` blocks them and the `/swagger` page renders blank. In the middleware, check `if (!ctx.Request.Path.StartsWithSegments("/swagger")) ctx.Response.Headers.Append("Content-Security-Policy", "default-src 'self'");`. The SPA's own CSP is set in `index.html` and is broader; the API serves JSON, so a strict CSP is free for non-Swagger responses.

Inline as a small `app.Use(async (ctx, next) => { ... ; await next(); })` block, or extracted to `Middleware/SecurityHeadersMiddleware.cs` if it grows. Documented as the cheap baseline mitigation against the JWT-in-`localStorage` XSS surface called out in the trade-offs section.

**Pipeline order** in `Program.cs` (full sequence — `WebApplication` adds `UseRouting` implicitly, but list it so trainees can see where it sits):

```text
UseSwagger (dev only) → UseRouting → SecurityHeaders → UseCors("spa") → UseAuthentication → UseAuthorization → MapControllers
```

`UseCors` must come after `UseRouting` and before `UseAuthentication` — getting this order wrong is the #1 source of "the preflight works but the real request 401s" confusion.

### NuGet packages

- `Microsoft.AspNetCore.Authentication.JwtBearer` (8.0.x)
- `Microsoft.AspNetCore.Identity.EntityFrameworkCore` (8.0.x)
- `Microsoft.EntityFrameworkCore.SqlServer` (8.0.x)
- `Microsoft.EntityFrameworkCore.Design` (8.0.x) — required for `dotnet ef migrations` CLI
- `Microsoft.EntityFrameworkCore.Tools` (8.0.x) — optional; only adds Package Manager Console cmdlets (`Add-Migration`, `Update-Database`). Omit if the team uses the CLI exclusively.
- `Swashbuckle.AspNetCore` (6.6.x) — Swagger UI in dev

Global tool: `dotnet tool install --global dotnet-ef` (once per machine).

### `appsettings.json` shape

```json
{
  "ConnectionStrings": {
    "Default": "Server=(localdb)\\MSSQLLocalDB;Database=sqldb-welcomeapp-dev;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Issuer": "WelcomeApp",
    "Audience": "WelcomeApp.Spa",
    "ExpiresMinutes": 60
  },
  "Cors": { "SpaOrigin": "http://localhost:5173" },
  "AllowedHosts": "*"
}
```

`appsettings.Development.json` overrides `"Jwt": { "ExpiresMinutes": 480 }` (8 hours) so trainees don't get bounced to auth mid-session while exploring. The test fixture overrides back to 60 (or shorter) when asserting expiry behaviour. Production keeps the 60-minute baseline.

`TrustServerCertificate=True` pre-empts the LocalDB TLS handshake error that's a common trainee gotcha.

**`Jwt:Key` lives in `dotnet user-secrets` from day one — never in `appsettings.json`.** Setup commands (run once per machine, from `src/WelcomeApp.Api/`):

```text
dotnet user-secrets init
dotnet user-secrets set "Jwt:Key" "<at least 32 random chars — generate with: openssl rand -base64 48>"
```

This keeps a real signing key out of the repo even by accident. The configuration system layers user-secrets over `appsettings.json` in Development automatically, so no code change is needed.

User-secrets are keyed by the project's `UserSecretsId` (in `WelcomeApp.Api.csproj`), not by launch profile — so the `e2e` launch profile reads the same `Jwt:Key` as the default `WelcomeApp.Api` profile and no additional setup is required for Playwright. The only thing the `e2e` profile overrides is `ConnectionStrings__Default`, pointed at `sqldb-welcomeapp-e2e`.

### Migrations

From `src/WelcomeApp.Api/`:

```text
dotnet ef migrations add InitialSchema
dotnet ef database update
```

No `Database.Migrate()` at startup — trainees should run migrations explicitly so they see what's happening. If schema gets corrupted mid-dev: `dotnet ef database drop --force && dotnet ef database update`.

---

## Frontend — `client/`

### Scaffold

```text
npm create vite@latest client -- --template react-ts
cd client && npm install
```

### `vite.config.ts` — dev proxy

```ts
server: {
  port: 5173,
  proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } }
}
```

All fetches use relative `/api/...`. No `VITE_API_URL` needed.

### Project structure

```text
client/
├─ index.html                # Geist + Geist Mono <link> from Google Fonts; <html lang="en"> + dark color-scheme
├─ vite.config.ts
└─ src/
   ├─ main.tsx               # createRoot + <AuthProvider><App/></AuthProvider>
   ├─ App.tsx                # picks <AuthScreen/> vs <WelcomeScreen/> from useAuth().status
   ├─ styles/
   │  ├─ tokens.css          # :root { --accent: #22d3a8; --bg-base; --text-*; --radius-*; easings }
   │  ├─ global.css          # reset, font-family, app shell
   │  ├─ auth.css            # ported from __AUTH_STYLE — split-layout only
   │  └─ background.css      # ported from __BG_STYLE — .bg-orbs only
   ├─ components/
   │  ├─ auth/
   │  │  ├─ AuthCard.tsx     # split card shell, owns mode + leaving + error banner; exposes onSwitchToSignIn(hintEmail?: string) so the SignUpForm 409 path can hand a typed email up before the mode flips, and SignInForm reads it as its initial email value
   │  │  ├─ SignInForm.tsx
   │  │  ├─ SignUpForm.tsx
   │  │  ├─ PasswordStrength.tsx
   │  │  ├─ FieldRow.tsx     # label + input + meta, used 3x
   │  │  └─ ModeToggle.tsx
   │  ├─ welcome/
   │  │  ├─ WelcomePage.tsx  # title + greeting + time + signout
   │  │  └─ StatsList.tsx    # fed by /api/stats
   │  ├─ backgrounds/
   │  │  └─ OrbsBackground.tsx
   │  └─ icons/index.tsx     # mail/lock/user/eye/tick/warn/caps inline SVG
   ├─ hooks/
   │  └─ useAuth.tsx         # context: user, token, status, login, register, logout
   ├─ lib/
   │  ├─ api.ts              # apiFetch<T>(path, init) — attaches JWT, throws ApiError
   │  ├─ auth.ts             # tokenStorage with remember-me localStorage/sessionStorage switch
   │  ├─ validation.ts       # emailValid, passwordStrength, deriveName, timeGreeting
   │  └─ types.ts            # User, Stats, AuthResponse, ApiError
   └─ test/
      ├─ setup.ts            # imports @testing-library/jest-dom; starts MSW server
      └─ handlers.ts         # MSW request handlers for /api/auth/*, /api/me, /api/stats
```

### Styling approach

**Plain global CSS files** imported once in `main.tsx`. Not CSS Modules (the prototype's cascading selectors like `.auth-card.layout-split .left .quote em` and `:focus-within` chains would require lots of `:global()` escapes). Not Tailwind/CSS-in-JS (extra learning surface, prototype's hand-tuned CSS ports directly). Custom properties (`--accent`, etc.) on `:root` so `color-mix(in oklab, var(--accent), …)` works app-wide and welcome reuses tokens.

**Use `rem`, not `px`, for mobile.** The prototype is px-heavy desktop-first; that won't survive on a phone or respect user font-size preferences. Port every value during the move:

- Root `font-size: 100%` (16 px baseline). `1rem = 16 px`.
- Convert prototype `px` → `rem` by dividing by 16. Examples: `14.5px → 0.906rem`, `360px → 22.5rem`, `820px → 51.25rem`, `28px heading → 1.75rem`, `11.5px label → 0.719rem`.
- Keep `1px` only for hairline borders (`border: 1px solid …`) — sub-rem borders blur.
- The welcome title already uses `clamp(56px, 9vw, 128px)` — convert the bounds to rem (`clamp(3.5rem, 9vw, 8rem)`) and leave the `vw` middle term alone (it's intentionally viewport-relative).
- Card max-width becomes `min(51.25rem, calc(100vw - 2rem))` so it never overflows narrow viewports.

**Mobile breakpoint** — add `@media (max-width: 40rem)` (640 px) to:

- Collapse the split `.auth-card` from two columns to one (`flex-direction: column`, drop the fixed `22.5rem` left column, hide the brand "quote" block or shrink it).
- Pad the stage with `1rem` instead of the desktop spacing.
- Reduce welcome page horizontal padding so the title doesn't run off-screen.
- Stack the welcome "Today in your space" right-column under the title instead of side-by-side.
- **Cap orb GPU cost.** The 6 always-on + 4 welcome orbs each carry two `box-shadow` blooms (`0 0 60px` + `0 0 120px`) plus a radial-gradient background. On a mid-range phone that's a real frame-rate hit. At `≤ 40rem`: hide 3 of the always-on orbs (drop the largest-radius entries — the `200px` and `160px` ones — via `.bg-orbs .orb:nth-of-type(3), .bg-orbs .orb:nth-of-type(5) { display: none; }`), and reduce the second box-shadow on the rest from `120px` to `60px`. Visual fidelity holds because the smaller orbs and the gradient overlays carry the atmosphere; cost roughly halves.
- Also honour `@media (prefers-reduced-motion: reduce)` globally: set all orb animations to `animation: none` and collapse the title fade-up delays to a single instant transition. One block, applies everywhere.

`<meta name="viewport" content="width=device-width, initial-scale=1">` already comes in the Vite template — confirm it's there.

**What to port** — from `__AUTH_STYLE`: keep `layout-split` rules + all keyframes (`shakeIn`, `fadeUp`, `spin`); drop `layout-card`, `layout-minimal`, `.divider`. From `__BG_STYLE`: keep `.bg-orbs` + `@keyframes orbRise`; drop aurora/mesh. From welcome CSS: keep `variant-split` + `reveal`/`pulse` keyframes; drop `variant-minimal` and `.w-actions` (README says no CTAs on welcome). **All ports are px → rem conversions, not literal copies.**

### State + API

**`useAuth`** context shape:

```ts
type AuthCtx = {
  user: User | null;
  token: string | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  login: (email, password, remember) => Promise<void>;
  register: (name, email, password) => Promise<void>;
  logout: () => void;
};
```

On mount, read token from storage; if present, call `/api/me` to hydrate user and set `status`. `login`/`register` POST to backend, expect `{ token, user }`, persist token, set state. `logout` clears token + user.

**Token storage** — `localStorage` if "Remember me" is checked, `sessionStorage` otherwise. This gives the prototype's checkbox actual behaviour. Single key `devobsessed.auth.token`; `tokenStorage.set(token, remember)` writes to one store and clears the other so we never end up with both populated. `tokenStorage.get()` reads `localStorage` first, then falls back to `sessionStorage` — the "remembered" token always wins if both somehow exist (e.g. older app version left a stray). `tokenStorage.clear()` clears both. `useAuth.test.tsx` asserts this precedence.

**`apiFetch`** — single fetch wrapper: attaches `Authorization: Bearer ${token}` when present; on non-2xx, **branches on response `Content-Type`** — if it starts with `application/json`, parse the body as JSON and throw `ApiError(status, jsonBody, message)`; otherwise read it as text and throw `ApiError(status, { raw: text }, message)`. This matters because in Development a backend 500 returns the HTML developer-exception page, not JSON — without the guard, `response.json()` rejects with a SyntaxError and the real status code is lost. On 401 after initial auth, `useAuth` effect calls `logout()` and returns the user to the auth screen.

### Mapping the prototype to real flow

| Prototype | Replace with |
| --- | --- |
| `setTimeout(..., 1100)` fake submit | `await auth.login(...)` / `await auth.register(...)`; keep spinner + "Signing in…" / "Creating account…" copy |
| `/wrong/i.test(password)` Easter egg | **Delete entirely** — replaced by real backend response. On `auth.login` rejection: 400/401 → "That doesn't match our records." (prototype copy, regardless of server message). On `auth.register` rejection: 409 → "That email is already in use. Try signing in instead." inline under the email field with a one-click "Switch to Sign in" link that preserves the typed email; 400 → "We couldn't create your account. Please check your details." |
| "Forgot?" link (signin only) | Render as a `<button type="button">` (not `<a href="#">`) with `onClick={(e) => e.preventDefault()}`; shows a small inline `<span role="status">` reading "Password reset isn't available yet." for ~3s, then fades. Logged with `console.info('TODO: password reset flow')` so it surfaces during dev. Confirms the link is present and accessible, signals it's intentional WIP, doesn't break keyboard nav. |
| `deriveName(email)` for greeting | Use `user.name` from `/api/me`; keep `deriveName` only as fallback if name empty |
| `screen === 'auth' \| 'welcome'` local state | Driven by `useAuth().status` |
| Background `data-state` toggle | Background mounted once at `<App/>`, reads status — survives auth→welcome swap with no remount |
| Time-based greeting + 30s clock tick | Keep verbatim, pure client |
| "Remember me" (visual only) | Now drives `tokenStorage` localStorage vs sessionStorage |

### What to drop entirely

- `tweaks-panel.jsx`, `design-canvas.jsx` — design-tool only
- Aurora + Mesh backgrounds — Orbs only
- `layout-card`, `layout-minimal`, `variant-centered`, `variant-minimal` — split only
- `.w-actions` + `.w-btn` — README: no CTAs on welcome
- The `tweaks` prop and all consumers — hard-code accent `#22d3a8`, split layout, orbs, Geist, "Welcome,"
- `Object.assign(window, {...})` globals — use real ES module imports
- **The `/wrong/i.test(password)` Easter egg in `handleSubmit`** — fake-error path now comes from the real API. A line-by-line port of `auth-app.jsx` will silently re-introduce this; explicitly delete it during the SignInForm port.

---

## Testing

Two test projects — one per stack. Goal is meaningful coverage of the security-sensitive auth paths and the validation logic, **not** 100% line coverage. For a training app, opinionated tests on the things that matter > shotgun tests on getters.

### Backend — `tests/WelcomeApp.Api.Tests/` (xUnit)

**Packages:**

- `xunit`, `xunit.runner.visualstudio` (latest 2.x)
- `Microsoft.NET.Test.Sdk`
- `Microsoft.AspNetCore.Mvc.Testing` — `WebApplicationFactory<Program>` for integration tests
- `Respawn` (optional but recommended) — resets table data between tests cheaply (`DELETE`s in FK order, much faster than drop/create)
- `FluentAssertions` (optional, nicer assertion syntax for trainees)

Add `public partial class Program {}` at the bottom of `Program.cs` so `WebApplicationFactory<Program>` can resolve the generated `Program` type. **Don't also add `InternalsVisibleTo`** — either approach works on its own, and stacking both is redundant noise that confuses trainees about which mechanism is doing the work. Use the shim alone; if tests later genuinely need to reach an `internal` API type (rare in this scope), add `InternalsVisibleTo` at that moment.

**Database strategy — same provider as production (SQL Server LocalDB).** No SQLite swap. Tests run against a dedicated database `sqldb-welcomeapp-tests` on the same `(localdb)\MSSQLLocalDB` instance. This keeps SQL Server-specific behaviour (T-SQL syntax, `nvarchar` semantics, `IDENTITY`, real `BeginTransactionAsync`) in the test path so green tests actually mean the production code works.

**Test fixture** — `ApiFactory : WebApplicationFactory<Program>, IAsyncLifetime`:

- Overrides the connection string with the test DB name via `builder.UseSetting("ConnectionStrings:Default", "Server=(localdb)\\MSSQLLocalDB;Database=sqldb-welcomeapp-tests;Trusted_Connection=True;TrustServerCertificate=True;")`.
- `InitializeAsync`: **no migration here.** Following the same rule as dev and e2e — auto-migration is not wired anywhere; the implementor runs `dotnet ef database update --connection "Server=(localdb)\MSSQLLocalDB;Database=sqldb-welcomeapp-tests;Trusted_Connection=True;TrustServerCertificate=True;"` once against `sqldb-welcomeapp-tests` before the first `dotnet test` (documented in `tests/WelcomeApp.Api.Tests/README.md` and step 8 of the implementation sequence). The fixture's `InitializeAsync` only handles per-test-run setup that isn't schema (e.g. seeding shared reference data if added later) — currently empty.
- Per-test reset: `Respawn.Checkpoint.Reset(connection)` in a base class `IAsyncLifetime.InitializeAsync` (fast — `DELETE`s in FK order, milliseconds). Falls back to a `DELETE FROM` sweep across the seven tables in FK order if Respawn isn't installed.
- Overrides `Jwt:Key` with a known test value and `Jwt:ExpiresMinutes` back to 60 (or shorter, per test) so tokens are predictable.
- Registers a `FakeClock : IClock` in DI so the JWT-expiry unit test can advance time without `Task.Delay`.

**Shared via collection fixture** — `WebApplicationFactory<Program>` is per-test-class by default, so multiple test classes hitting `MigrateAsync` against the same `sqldb-welcomeapp-tests` DB on a cold start would race. Wrap `ApiFactory` in an xUnit `[CollectionDefinition(nameof(ApiCollection))]` / `ICollectionFixture<ApiFactory>` and tag every integration test class with `[Collection(nameof(ApiCollection))]`. Migration runs once per test run, tests within the collection run serially (Respawn keeps per-test reset cheap), and the noisy concurrent-migration failure mode is gone.

**Seed helpers** — `TestData.cs` static class in the test project exposes small helpers: `await db.SeedUserAsync(email, password = "Pass123")` (returns `(ApplicationUser, string token)`), `await db.SeedDraftAsync(userId, title = "Draft")`, `await db.SeedInviteAsync(workspaceId, status = Pending)`. Keeps integration tests free of inline EF and makes Stats-test setups one-liners. Avoid the temptation to grow these into a fixture-builder DSL — three helpers is plenty for this app.

**Test files — 6 distinct files, ~18–20 `[Fact]` methods (Auth has three rows in the table below; they are facts inside the same `AuthControllerTests.cs`, totalling 8+ facts in that file alone):**

| File | What it covers |
| --- | --- |
| `Unit/JwtTokenServiceTests.cs` | Token contains `sub`, `email`, `name`, `jti`; expiry honours config (`FakeClock` advances time deterministically); signed with configured key; tampered signature fails validation |
| `Unit/ValidationTests.cs` | `RegisterRequest` DataAnnotations: rejects empty name, malformed email, password < 6 chars |
| `Integration/AuthControllerTests.cs` | Register happy path → 200 + token; **duplicate email → 409 with stable `ProblemDetails`** (re-register same email after first success, assert status + title); register with already-taken email cased differently (`Foo@Bar.com` vs `foo@bar.com`) also → 409 (proves `NormalizedEmail` is doing the work); login with correct creds → 200; login with wrong password → 401 (generic); login with unknown email → 401 (same generic shape — no enumeration) |
| `Integration/AuthControllerTests.cs` | Password is **hashed** in DB after register (read `AspNetUsers.PasswordHash`, assert not equal to plaintext, asserts starts with Identity v3 hash marker byte) |
| `Integration/UserRegistrationServiceTests.cs` | Register creates user **and** personal workspace **and** WorkspaceMember row in one transaction; failure mid-flow rolls back (force a duplicate email after workspace insert to assert atomicity — DB ends with the *original* user's rows only, no orphan workspace) |
| `Unit/WorkspaceNameTests.cs` | Workspace-name derivation: `"Jane Doe"` → `jane-hq`; trims and lowercases; Latin diacritics are folded via `FormD` + `NonSpacingMark` strip (`"François"` → `francois-hq`, `"Zoë"` → `zoe-hq`, `"Ñoño"` → `nono-hq`); non-Latin scripts have no decomposition and fall back (`"張偉"` → `user-hq`); all-symbol input falls back to `user-hq`; leading/trailing whitespace handled |
| `Integration/AuthControllerTests.cs` | Timing parity sanity check: login with unknown email is within `[0.5×, 1.5×]` the wall-clock of login with wrong password. **Caveat documented in the test**: this only equalises the *hash* cost (via the dummy `HashPassword` call) — the unknown-email path still skips a `FindByEmailAsync` DB roundtrip, so a determined attacker on a fast LAN could still distinguish the two. Full parity would require a constant-time control flow (or rate limiting, which is the production answer). Assertion is intentionally loose; this test is a regression guard, not a security proof. |
| `Integration/MeControllerTests.cs` | Authorized request returns the right user; no token → 401; expired/tampered token → 401 |
| `Integration/StatsControllerTests.cs` | New user: `drafts=0`, `pendingInvites=0`, `workspaceName="{first}-hq"`, `memberCount=1`, `plan="Free"`. Seed a draft + invite → counts update. |

Use `ApiFactory.CreateClient()` and a small `LoginAsync(email, password)` helper that posts to `/api/auth/login` and returns a `HttpClient` with the bearer header pre-set. Keeps the integration tests readable.

### Frontend — `client/` (Vitest + React Testing Library)

**Packages:** `vitest`, `@vitest/ui` (optional), `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`, `msw` (Mock Service Worker — intercepts fetch in tests).

**Vitest config** — sibling file `client/vitest.config.ts` (not merged into `vite.config.ts` — keeps dev and test configs cleanly separated, which is the documented Vitest pattern):

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'jsdom', setupFiles: './src/test/setup.ts', globals: true },
});
```

`setup.ts` imports `@testing-library/jest-dom` and starts the MSW server.

**Test files (~5 total):**

| File | What it covers |
| --- | --- |
| `src/lib/validation.test.ts` | `emailValid` accepts/rejects per the **prototype regex** `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` (frontend-only hint — backend `[EmailAddress]` is a parser, not a regex, and is the authoritative check; the regex is documented as "early UX feedback only" in `validation.ts`, with a comment pointing at the backend `RegisterRequest`); `passwordStrength` returns 0–4 across documented thresholds; `deriveName('jane.doe@x.com')` → "Jane Doe"; `timeGreeting(date)` returns correct string per hour |
| `src/lib/api.test.ts` | `apiFetch` attaches Bearer when token present; throws `ApiError` with status + body on 4xx; works with no token |
| `src/hooks/useAuth.test.tsx` | `login` happy path sets user + token + status=authenticated (MSW mocks `/api/auth/login`); `login` 401 leaves state unauthenticated and throws; `logout` clears storage; mount-time `/api/me` hydration works when token in storage |
| `src/components/auth/SignUpForm.test.tsx` | Renders fields; invalid email shows error after blur; weak password disables submit; valid form enables submit; submit calls `auth.register`. **On a `409` from MSW: inline error "That email is already in use…" appears under the email field; clicking "Switch to Sign in" calls the mode-change handler with the typed email as a hint.** |
| `src/components/auth/SignInForm.test.tsx` | "Remember me" toggle drives the second arg to `auth.login`; bad-credentials response shows "That doesn't match our records." |

Skip snapshot tests — they're noise for an app this size.

### E2E — `client/e2e/` (Playwright)

Real-browser coverage of the auth → welcome flow. Catches the bugs Vitest can't: CSS layout, Vite proxy plumbing, real cookies/localStorage, navigation timing, the actual JWT round-trip.

**Packages** (in `client/`): `@playwright/test`, `@axe-core/playwright` (accessibility assertions — used in `mobile.spec.ts` and one desktop spec). One-time install after `npm install`: `npx playwright install chromium` (downloads the browser binary, ~150 MB; only Chromium for training scope — Firefox/WebKit are easy to add later).

**Corporate-proxy note** — if `npx playwright install chromium` fails behind an AGP-managed proxy, set `HTTPS_PROXY` (and `HTTP_PROXY`) in the shell before running, or set `PLAYWRIGHT_DOWNLOAD_HOST` to an internal mirror if one exists. Document this in the README; trainees on AGP laptops will hit it.

**Database strategy** — dedicated `sqldb-welcomeapp-e2e` LocalDB database, separate from dev and unit-test DBs. **No auto-migration on startup — anywhere.** The implementor creates and migrates the e2e DB explicitly before the first `npm run e2e` run, using the same `dotnet ef` workflow as dev:

```text
cd src/WelcomeApp.Api
dotnet ef database update --connection "Server=(localdb)\MSSQLLocalDB;Database=sqldb-welcomeapp-e2e;Trusted_Connection=True;TrustServerCertificate=True;"
```

This is added as step 16 in the implementation sequence (before the Playwright run) and documented in the README's "Running E2E tests" section. Playwright's `webServer` only boots the API against an already-migrated DB. **The same rule applies to every DB** — dev, tests, and e2e — none of them auto-migrate. The implementor runs `dotnet ef database update --connection "..."` once against each DB the first time they need it (step 4 for dev, step 8 for tests, step 16 for e2e).

Tests use unique emails per case (`` `e2e-${Date.now()}-${Math.random().toString(36).slice(2,8)}@test.local` ``) so no per-test reset is needed — the DB accumulates rows but each test is isolated. Run `dotnet ef database drop --connection "...e2e..." --force` and re-apply the update above if it gets noisy.

**Config — `client/playwright.config.ts`** highlights:

- `testDir: './e2e'`, `timeout: 30_000`, `retries: process.env.CI ? 2 : 0`
- `use: { baseURL: 'http://localhost:5173', trace: 'on-first-retry', video: 'retain-on-failure' }`
- `projects: [{ name: 'chromium-desktop', use: devices['Desktop Chrome'], testIgnore: /mobile\.spec\.ts/ }, { name: 'chromium-mobile', use: devices['iPhone 14 Pro'], grep: /@mobile|mobile\.spec\.ts/ }]` — shared specs (`auth.spec.ts`, `validation.spec.ts`, `persistence.spec.ts`) run under desktop; `mobile.spec.ts` runs **only** under the mobile project. Tests that should run on both viewports get a `@mobile` tag in their title so the mobile project's `grep` picks them up too. This prevents the duplicate-run trap where `mobile.spec.ts` would otherwise execute under both projects.
- `webServer: [ { command: 'dotnet run --project ../src/WelcomeApp.Api --launch-profile e2e', url: 'http://localhost:5000/health', reuseExistingServer: !process.env.CI }, { command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: !process.env.CI } ]` — Playwright boots both servers and waits for readiness. The API needs an `e2e` launch profile in `launchSettings.json` that sets `ConnectionStrings__Default` to the e2e DB, and a trivial `GET /health` endpoint (returns `200 OK`) so Playwright has a readiness probe that doesn't require auth.

**Test files (~4 total, kept lean):**

| File | What it covers |
| --- | --- |
| `e2e/auth.spec.ts` | Register a fresh user → lands on welcome with greeting + `{first}-hq` workspace + stats all zero. Sign out → back to auth. Sign in with same creds → welcome. Sign in with wrong password → "That doesn't match our records." shake-in, stays on auth. **Re-register same email → inline "already in use" error + the "Switch to Sign in" link populates the sign-in email field with that address.** |
| `e2e/validation.spec.ts` | Invalid email blur shows error + warn icon. Weak password keeps submit disabled. Password strength bars update across 4 tiers. (Real-browser confirmation of what `SignUpForm.test.tsx` covers in jsdom — jsdom doesn't render the animations.) |
| `e2e/persistence.spec.ts` | Remember-me checked: sign in, reload page → still authenticated. Remember-me unchecked: sign in, simulate new session via `context.clearCookies()` + `localStorage.clear()` of the wrong store → back at auth. Asserts the right storage key is set in each case. |
| `e2e/mobile.spec.ts` | Runs only under the `chromium-mobile` project. Asserts auth card stacks (`flex-direction: column`), brand quote block is hidden or visually collapsed, no horizontal overflow (`document.documentElement.scrollWidth <= clientWidth`), welcome stats stack below the title. Also runs `@axe-core/playwright` against the auth screen and the welcome screen and asserts zero `serious`/`critical` violations (training-scope threshold; `moderate` issues logged but non-fatal). **Baseline pass first** — run axe-core once against the prototype before committing the assertion; the dark-mode text-on-glass surfaces (e.g. `rgba(232,236,242,.4)` on the glassy card) are likely contrast offenders. Either bump those text alphas to clear AA, or `disableRules(['color-contrast'])` with a TODO link until the contrast tier is revisited. Don't merge a spec that's red on first run. |

**`package.json` scripts:**

```json
"e2e": "playwright test",
"e2e:ui": "playwright test --ui",
"e2e:report": "playwright show-report"
```

**Trainee notes** — keep the manual UI checklist (Verification section) alongside Playwright; the manual checks cover *visual fidelity* against the prototype HTML (orb motion, gradient on title, eyebrow pulse) which Playwright can verify exists in the DOM but not "looks right." Use Playwright to catch regressions; use the manual checklist to confirm new visual work matches the design.

### Running tests

- Backend unit + integration: `dotnet test` from repo root (or `dotnet test tests/WelcomeApp.Api.Tests`)
- Frontend unit + component: `npm test` (alias for `vitest`) or `npm run test:watch` from `client/`
- Frontend E2E: `npm run e2e` from `client/` (Playwright auto-starts both servers; or run the two `dotnet run` / `npm run dev` terminals yourself and Playwright will reuse them)
- Backend tests require a local SQL Server LocalDB instance (`(localdb)\MSSQLLocalDB`) — this is a known dependency, not a CI promise. If we add CI later, either install LocalDB on the runner or accept a SQLite-backed CI target with the provider-parity caveat documented. Vitest tests require no network (MSW intercepts fetches). Playwright requires LocalDB + Chromium binary.

---

## Reuse from the prototype

These existing files in `design_handoff_dark_auth/` are the source for porting (don't re-derive them):

- [auth-app.jsx](../design_handoff_dark_auth/auth-app.jsx) — full component logic, validation, animations, CSS in `__AUTH_STYLE`
- [backgrounds.jsx](../design_handoff_dark_auth/backgrounds.jsx) — `OrbsBg` component + `__BG_STYLE`
- [Welcome Flow.html](../design_handoff_dark_auth/Welcome%20Flow.html) — runnable side-by-side reference for visual fidelity
- [README.md](../design_handoff_dark_auth/README.md) — design spec, selected variants, accessibility notes

---

## Implementation sequence

Order so nothing is broken in more than one place at a time:

0. **Prereqs check + repo baseline** — confirm `dotnet --version` reports 8.x and `node --version` reports 18+; add `.gitignore` (standard .NET + Node) and `.editorconfig` (4-space C#, 2-space TS/JSON, LF line endings) at the repo root before any project files exist.
1. **Backend skeleton** — solution, project, NuGet packages, empty `Program.cs` that wires **CORS (`"spa"` policy), Swagger, and the security-headers middleware** from day one — even before any endpoint exists. Drop `WelcomeApp.Api.http` in now (empty file) so steps 5–7 have a verification surface to fill in immediately. Add the `GET /health` minimal endpoint here too so Playwright's `webServer` readiness probe (step 16) doesn't get added retroactively.
2. **`appsettings.json` + user-secrets + `AppDbContext` (empty) + `ApplicationUser` + Identity wiring** (with `RequireUniqueEmail = true` and the password policy options). Run `dotnet user-secrets init && dotnet user-secrets set "Jwt:Key" "<32+ random chars>"` in `src/WelcomeApp.Api/`. `dotnet build` succeeds.
3. **Domain entities** (`Workspace`, `WorkspaceMember`, `Draft`, `Invite`, `InviteStatus`) + `OnModelCreating` (cascade rules, composite key, unique index on `Workspace(OwnerUserId)`, `Invite.Status` string conversion).
4. **First migration**: `dotnet ef migrations add InitialSchema` → `dotnet ef database update`. Verify tables in SSMS / Azure Data Studio, including the unique `EmailIndex` on `AspNetUsers.NormalizedEmail`.
5. **JWT setup** (`JwtOptions`, `IClock`/`SystemClock`, `JwtTokenService`, bearer config with `NameClaimType` pinned + `DefaultInboundClaimTypeMap.Clear()`) + placeholder `MeController` returning `User.Identity!.Name`. Verify bearer pipeline — confirm `User.Identity.Name` returns the display name (catches the claim-mapping gotcha early).
6. **`AuthController`** + `UserRegistrationService`. Test register + login via `.http` file, including the duplicate-email 409 and case-collision 409 cases.
7. **Real `MeController` + `StatsController`.**
8. **Backend test project** — scaffold `tests/WelcomeApp.Api.Tests`, add `ApiFactory` pointed at the dedicated `sqldb-welcomeapp-tests` LocalDB database, add the `TestData` seed helpers, write the 6 test files (~18–20 facts total, including workspace-name + timing-parity + duplicate-email + case-insensitive-email-collision additions). **Migrate the test DB explicitly** before the first `dotnet test`: `dotnet ef database update --connection "Server=(localdb)\MSSQLLocalDB;Database=sqldb-welcomeapp-tests;Trusted_Connection=True;TrustServerCertificate=True;"` from `src/WelcomeApp.Api/`. Document the same command in `tests/WelcomeApp.Api.Tests/README.md`. `dotnet test` green before moving to frontend.
9. **Frontend scaffold** — `npm create vite`, install, blank page renders at `:5173`. Add Vitest + RTL + MSW dev deps in the same step.
10. **Port styles + Orbs background** — get the visual chrome on screen with a hard-coded "Sign up" form skeleton.
11. **Port AuthCard + forms + validation** — sign-up renders identically to prototype (still fake submit). Add `validation.test.ts` alongside.
12. **Wire `useAuth` + `apiFetch`** — real register/login round trip; welcome screen replaces auth on success. Add `api.test.ts` and `useAuth.test.tsx` alongside.
13. **Welcome page + `StatsList`** fetching `/api/stats`.
14. **Error states** — 401 (login), **409 (register, with the "Switch to Sign in" affordance)**, network errors. Add `SignInForm.test.tsx` + `SignUpForm.test.tsx`.
15. **Playwright scaffold** — install `@playwright/test` + `@axe-core/playwright`, `npx playwright install chromium`, add `playwright.config.ts` (with the per-project `testIgnore`/`grep` filters), add the `e2e` launch profile on the API, write the 4 spec files.
16. **Create + migrate the e2e DB explicitly** — `dotnet ef database update --connection "Server=(localdb)\MSSQLLocalDB;Database=sqldb-welcomeapp-e2e;Trusted_Connection=True;TrustServerCertificate=True;"` from `src/WelcomeApp.Api/`. No auto-migrate is wired anywhere — the implementor runs this once before the first Playwright run, same rule as the dev DB. Document the same command in the README's "Running E2E tests" section. Then `npm run e2e` green at both desktop and mobile projects.
17. **Full test sweep** — `dotnet test`, `npm test`, and `npm run e2e` all green; manual visual-fidelity checklist in Verification section passes.

---

## Verification

### Run both

- Terminal A: `dotnet run --project src/WelcomeApp.Api` (`http://localhost:5000`)
- Terminal B: `npm run dev` in `client/` (`http://localhost:5173`)
- Browse `http://localhost:5173`

### Backend smoke test (`WelcomeApp.Api.http`)

- `POST /api/auth/register` → 200 + token
- `POST /api/auth/register` **again with the same email** → `409 Conflict` with `ProblemDetails.title = "Email already registered."`
- `POST /api/auth/register` with the same email cased differently → `409 Conflict` (confirms `NormalizedEmail` uniqueness)
- `POST /api/auth/login` with same creds → 200 + token
- `POST /api/auth/login` with wrong password → 401
- `GET /api/me` with bearer → 200 + `{ id, name, email, createdAt }`
- `GET /api/me` no bearer → 401
- `GET /api/stats` with bearer → 200 + `{ drafts:0, pendingInvites:0, workspaceName:"{first}-hq", memberCount:1, plan:"Free" }`
- Swagger interactive smoke at `http://localhost:5000/swagger` in dev (the **Authorize** button accepts a token from the prior login call)

### Manual visual-fidelity checks

Playwright (see Testing section) covers the *functional* flow at desktop and mobile viewports — register/sign-in/sign-out, validation, persistence, layout-stack assertions. The manual list below stays as belt-and-suspenders for the things Playwright can confirm exist in the DOM but not "look right": animation feel, gradient stops, blur radii, the side-by-side comparison with the design HTML.

1. Open `:5173` — auth card renders with split layout, orbs animate, "Sign up" tab selected.
2. Type invalid email + blur → shake + warn icon + error copy. Fix → tick + "Looks good".
3. Type password through 4 strength tiers — bars + label update.
4. Press Caps Lock with focus in password → yellow warning appears.
5. Submit sign-up with a fresh email → spinner → 350 ms card-leaving → welcome screen reveals with staggered title; stats column populates (`drafts: 0`, `pending invites: 0`, `{name}-hq`, `Free · trial`).
6. Sign out, return to auth, submit sign-up **with the same email** → inline error under email field: "That email is already in use. Try signing in instead." with a "Switch to Sign in" link that preserves the typed email. No card-leaving animation (the request 409'd, the card stays).
7. Click "Switch to Sign in" from step 6 → email field stays populated; enter the correct password → welcome.
8. Click Sign out → back to auth screen.
9. Sign in with wrong password → card un-leaves, "That doesn't match our records." shake-in below password.
10. Click "Forgot?" → small "Password reset isn't available yet." note appears for ~3s under the link, then fades. No navigation, no console error.
11. Uncheck Remember me, sign in, close tab, reopen `:5173` → back at auth (sessionStorage cleared).
12. Stop the backend, trigger a stats refetch on welcome → 401 → returns to auth screen.
13. Open `design_handoff_dark_auth/Welcome Flow.html` side-by-side with `:5173` — compare card chrome (blur, border, shadow), orbs movement, gradient on title line 2, eyebrow pulse.
14. **Mobile responsiveness** — open DevTools, toggle device toolbar, pick iPhone 14 Pro (390 × 844). Confirm the auth card stacks to a single column with the brand row hidden/condensed, no horizontal scroll, inputs fill width, welcome title fluid-scales without overflowing, stats list stacks below the title, and the orb count is visibly reduced.
15. **Reduced motion** — enable "Reduce motion" in OS accessibility settings (or `prefers-reduced-motion: reduce` via DevTools rendering tab), reload `:5173`. Orbs hold still; title appears without fade-up. Form interactions still respond.
16. **Font-size accessibility** — in browser settings increase the default page font-size to 20px, reload `:5173`. The whole UI should scale proportionally (proves `rem` everywhere). If anything stays fixed-size, that's a leftover `px` to fix.
17. **Production build smoke** — from `client/`, run `npm run build && npm run preview`. Open the preview URL. Auth card must render with full styling (catches Vite chunking / CSS-import bugs). The preview server does **not** proxy `/api`, so submitting the form will fail — that's expected; we're only checking the build artefact renders. The production API URL story (env var, hard-coded, separate host) is deliberately deferred along with deployment, see Out of scope.

### Database verification

- Open SSMS / Azure Data Studio on `(localdb)\MSSQLLocalDB` → `sqldb-welcomeapp-dev`
- Confirm `AspNetUsers`, `Workspaces`, `WorkspaceMembers`, `Drafts`, `Invites` exist
- After register: `SELECT * FROM AspNetUsers` shows the new row with a non-plaintext `PasswordHash` column (PBKDF2 base64 blob, ~84 chars)
- Verify the unique index on `NormalizedEmail`: `SELECT name, is_unique FROM sys.indexes WHERE object_id = OBJECT_ID('AspNetUsers') AND name LIKE '%Email%'` shows `UserNameIndex` and `EmailIndex` with `is_unique = 1`. This is the index Identity uses to reject duplicate-email registration — proves the rule is enforced at the database level, not only in application code.

---

## Security trade-offs we accepted (training scope)

These are *deliberate* choices for a training app. None of them should be copied into a production codebase without a second look.

- **JWT in `localStorage` / `sessionStorage`** — readable by any XSS in the SPA. The production-grade alternative is an HttpOnly, Secure, SameSite=Strict cookie issued by the API, with CSRF protection on state-changing routes. We chose the storage approach so trainees can inspect tokens in DevTools and understand the bearer flow end-to-end.
- **No refresh tokens, 60-minute access tokens** — sessions end abruptly; the SPA bounces to auth on 401. Production needs a refresh endpoint, rotation, and revocation.
- **No rate limiting on `/api/auth/login`** — a real deployment must rate-limit or lock out after N failures. ASP.NET Core 8's built-in `AddRateLimiter` is the natural fit; left as a `TODO` comment on `AuthController.Login`.
- **Password minimum 6 characters, no complexity rules** — matches the prototype's UX so visual fidelity holds. Production should follow NIST SP 800-63B (min 8, breach-list check, no composition rules).
- **No email confirmation, no password reset, no MFA** — listed in Out of scope below; trainees should know these are the next features a real app would add.
- **HTTPS via `UseHttpsRedirection` only in dev** — production needs a real cert and HSTS.

## Out of scope (deliberately)

- Refresh tokens, password reset flow, email confirmation, 2FA — "Forgot password?" link logs `TODO` for now
- Repository / Unit-of-Work abstractions, AutoMapper, MediatR, FluentValidation — `DbContext` and DataAnnotations cover it
- Production deployment / Docker / single-`concurrently` dev command — two terminals is the right starting point
- Production API URL configuration — the Vite proxy handles dev; the prod-build smoke test (verification step 17) confirms the artefact renders but does not exercise the API call path. **Forward pointer for whoever picks this up**: switch `apiFetch` to prepend `import.meta.env.VITE_API_URL` when it's defined (fall back to relative `/api/...` when it isn't, so dev keeps working unchanged), and document the env var in a `.env.production.example` file. One change in `lib/api.ts`, one config file, no proxy.
