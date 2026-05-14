# Homework One — Runbook

Step-by-step guide for running the Welcome App (ASP.NET Core 8 API + React/Vite SPA) locally.

For architectural context, see [plans/implementation-plan.md](plans/implementation-plan.md).

---

## Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| .NET SDK | 8.0.x | Pinned by [global.json](global.json). Newer SDKs installed side-by-side are fine. |
| Node.js | 18+ | Tested with 24.x. |
| SQL Server LocalDB | any current | Instance name `(localdb)\MSSQLLocalDB`. Ships with Visual Studio / can be installed standalone. |
| `dotnet-ef` | 8.0.x | `dotnet tool install --global dotnet-ef --version 8.0.*` once per machine. |

Quick check that everything's on PATH:

```powershell
dotnet --version   # should report 8.0.x (global.json forces it)
node --version
sqlcmd -S "(localdb)\MSSQLLocalDB" -Q "SELECT @@VERSION" -h-1
dotnet ef --version
```

---

## First-time setup

Run these once per machine. All paths below are relative to this `homework_one/` folder.

### 1. Set the JWT signing key

The API refuses to start without `Jwt:Key` in user-secrets (the throw at `Program.cs` line 36 points at the missing setup). Pick any 32+ character base64 string:

```powershell
cd src/WelcomeApp.Api
dotnet user-secrets set "Jwt:Key" "<32+ random chars — e.g. openssl rand -base64 48>"
```

The value lives in `%APPDATA%\Microsoft\UserSecrets\<UserSecretsId>\secrets.json`, outside the repo. The xUnit and Playwright suites inject their own throwaway keys, so this step only affects the live dev API (`dotnet run` from the API project).

### 2. Migrate the three databases

Each suite gets its own LocalDB database. None of them auto-migrate; the implementer runs `dotnet ef database update` against each once, then again whenever a new migration lands. From `src/WelcomeApp.Api/`:

```powershell
# Dev DB — used by `dotnet run`
dotnet ef database update --connection "Server=(localdb)\MSSQLLocalDB;Database=sqldb-welcomeapp-dev;Trusted_Connection=True;TrustServerCertificate=True;"

# Test DB — used by xUnit integration tests (sqldb-welcomeapp-tests)
dotnet ef database update --connection "Server=(localdb)\MSSQLLocalDB;Database=sqldb-welcomeapp-tests;Trusted_Connection=True;TrustServerCertificate=True;"

# E2E DB — used by Playwright (sqldb-welcomeapp-e2e)
dotnet ef database update --connection "Server=(localdb)\MSSQLLocalDB;Database=sqldb-welcomeapp-e2e;Trusted_Connection=True;TrustServerCertificate=True;"
```

The design-time factory at [src/WelcomeApp.Api/Data/DesignTimeDbContextFactory.cs](src/WelcomeApp.Api/Data/DesignTimeDbContextFactory.cs) lets `dotnet ef` resolve the DbContext without booting the app — so these commands work even before step 1.

### 3. Install frontend dependencies

```powershell
cd client
npm install
npx playwright install chromium   # downloads the browser binary (~112 MB)
```

---

## Running the app in dev

Two terminals — the SPA proxies `/api/*` to the API, so both must be running.

**Terminal A — API on `http://localhost:5000`:**

```powershell
cd src/WelcomeApp.Api
dotnet run
```

Wait for `Now listening on: http://localhost:5000`. Swagger lives at [http://localhost:5000/swagger](http://localhost:5000/swagger) — the **Authorize** button accepts a token issued by `/api/auth/login`.

**Terminal B — SPA on `http://localhost:5173`:**

```powershell
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in a browser. The Vite dev server proxies `/api/*` to the API on `:5000`.

---

## Running tests

Three runners cover different layers. Each can run independently of the others, but all three together is the canonical "green" sweep.

### Backend (xUnit — 37 tests)

From repo root:

```powershell
dotnet test homework_one/DevObsessed_Training.sln
```

`ApiFactory` overrides connection string + JWT key in-process, so user-secrets are not required for tests. See [tests/WelcomeApp.Api.Tests/README.md](tests/WelcomeApp.Api.Tests/README.md) for the per-test reset strategy (Respawn keeps `__EFMigrationsHistory` intact).

### Frontend unit / component (Vitest — 51 tests)

```powershell
cd client
npm test          # one-shot
npm run test:watch # watch mode
```

MSW intercepts all fetches — no network or backend required.

### End-to-end (Playwright — 14 tests)

```powershell
cd client
npm run e2e                  # full sweep, headless
npm run e2e -- --project=chromium-desktop  # desktop only
npm run e2e -- --project=chromium-mobile   # mobile only
npm run e2e:ui               # GUI test runner
npm run e2e:report           # open the last HTML report
```

Playwright auto-starts both the API (against `sqldb-welcomeapp-e2e`) and the Vite dev server via its `webServer` config. The throwaway e2e JWT key is in [client/playwright.config.ts](client/playwright.config.ts); never reuse it elsewhere.

### Everything in one shot

```powershell
dotnet test homework_one/DevObsessed_Training.sln && cd homework_one/client && npm test && npm run e2e
```

---

## Common operations

### Adding a migration

```powershell
cd src/WelcomeApp.Api
dotnet ef migrations add <DescriptiveName>
# Then apply to each DB (see "Migrate the three databases" above)
```

### Resetting a corrupted DB

```powershell
cd src/WelcomeApp.Api
dotnet ef database drop --connection "Server=(localdb)\MSSQLLocalDB;Database=sqldb-welcomeapp-dev;Trusted_Connection=True;TrustServerCertificate=True;" --force
dotnet ef database update --connection "Server=(localdb)\MSSQLLocalDB;Database=sqldb-welcomeapp-dev;Trusted_Connection=True;TrustServerCertificate=True;"
```

Same pattern for `-tests` and `-e2e`.

### Production build smoke

```powershell
cd client
npm run build && npm run preview
```

Opens the built SPA on a preview port. The preview server does **not** proxy `/api`, so form submissions fail — that's expected; we're only checking the build artefact renders. Production API URL wiring is intentionally deferred (see plan's "Out of scope" section).

### Inspecting the database

```powershell
sqlcmd -S "(localdb)\MSSQLLocalDB" -d sqldb-welcomeapp-dev -Q "SELECT Email, DisplayName, CreatedAt FROM AspNetUsers ORDER BY CreatedAt DESC;"
```

`AspNetUsers.PasswordHash` is base64'd PBKDF2 — starts with `AQ` (Identity v3 marker byte).

---

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `InvalidOperationException: Jwt:Key is not configured` on `dotnet run` | User-secrets not set | Re-run the `dotnet user-secrets set` command from setup step 1 |
| `dotnet ef` reports the same `Jwt:Key` error in passing but still completes | Informational only — the design-time factory bypasses Program.cs | Ignore; check that the migration was applied |
| API starts but `/api/me` returns 401 with a fresh token | `MapInboundClaims = false` got reverted | Confirm Program.cs sets it on `AddJwtBearer` — without it, .NET 8's JsonWebTokenHandler rewrites `sub` to `ClaimTypes.NameIdentifier` and `MeController` can't find the user id |
| LocalDB connection error | Instance not started | `sqllocaldb start MSSQLLocalDB` |
| Playwright "Executable doesn't exist at ...webkit" | Mobile project pulled the iPhone preset which forces WebKit | The repo uses `devices['Pixel 7']` (Chromium); if you swap back to iPhone, run `npx playwright install webkit` |
| Vite dev `/api` calls hit nothing | API not running on `:5000`, or wrong port | Check Terminal A; the proxy target is `http://localhost:5000` in [client/vite.config.ts](client/vite.config.ts) |
| `npm run e2e` times out waiting for `/health` | API didn't start — usually missing env or DB | Look at the `[WebServer]` lines in the Playwright output; common culprit is the e2e DB not being migrated yet |
| Stale e2e data piling up (test emails like `register-...@test.local`) | Expected — e2e tests use unique emails per case, no per-test reset | Drop + recreate `sqldb-welcomeapp-e2e` periodically (see "Resetting a corrupted DB") |

---

## Project layout cheat sheet

```text
homework_one/
├─ DevObsessed_Training.sln
├─ global.json                     # SDK pin: 8.0.x
├─ .gitignore / .editorconfig
├─ src/WelcomeApp.Api/             # ASP.NET Core 8 Web API
│  ├─ Program.cs                   # pipeline: CORS → security headers → auth → controllers
│  ├─ Controllers/{Auth,Me,Stats}Controller.cs
│  ├─ Services/{JwtTokenService,UserRegistrationService,WorkspaceNameHelper,IClock}.cs
│  ├─ Models/                      # ApplicationUser, Workspace, WorkspaceMember, Draft, Invite
│  ├─ Data/{AppDbContext,DesignTimeDbContextFactory}.cs
│  ├─ Migrations/
│  └─ WelcomeApp.Api.http          # REST Client smoke requests
├─ tests/WelcomeApp.Api.Tests/     # xUnit (37 tests; Respawn + collection fixture)
├─ client/                         # Vite + React 19 + TypeScript
│  ├─ src/
│  │  ├─ components/{auth,welcome,backgrounds,icons}/
│  │  ├─ hooks/useAuth.tsx
│  │  ├─ lib/{api,auth,types,validation}.ts
│  │  ├─ styles/                   # tokens, global, auth, welcome, background (all in rem)
│  │  ├─ test/{setup,handlers}.ts  # MSW server + default handlers
│  │  └─ App.tsx + main.tsx
│  ├─ e2e/                         # Playwright specs (14 tests)
│  ├─ vite.config.ts               # proxies /api → :5000
│  ├─ vitest.config.ts             # excludes e2e/
│  └─ playwright.config.ts         # chromium-desktop + chromium-mobile projects
├─ design_handoff_dark_auth/       # Source-of-truth visual reference (do not modify)
└─ plans/implementation-plan.md    # Full design spec
```

---

## Endpoints

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `GET` | `/health` | none | Playwright readiness probe |
| `POST` | `/api/auth/register` | none | 200 with JWT, or 409 on duplicate email (case-insensitive) |
| `POST` | `/api/auth/login` | none | 200 with JWT, or generic 401 |
| `GET` | `/api/me` | Bearer | Returns `{ id, name, email, createdAt }` |
| `GET` | `/api/stats` | Bearer | Returns `{ drafts, pendingInvites, workspaceName, memberCount, plan }` |
| `GET` | `/swagger` | none (dev only) | Interactive API explorer |
