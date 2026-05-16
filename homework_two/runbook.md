# AGP Command Station — Runbook

Step-by-step guide for running the AGP Command Station (ASP.NET Core 8 API + React/Vite SPA) locally.

For architectural context see [plans/agp-command-station.md](plans/agp-command-station.md) and [README.md](README.md).

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| .NET SDK | 8.0.x | `dotnet --version` to confirm |
| Node.js | 18+ | Tested with 24.x |
| SQL Server LocalDB | any current | `(localdb)\MSSQLLocalDB`. Ships with Visual Studio; standalone installer available. |
| `dotnet-ef` | 8.0.x | `dotnet tool install --global dotnet-ef --version 8.0.*` once per machine |
| Azure AD app registration | — | One-time setup by IT or Dillon — see §1 below |

Quick check:

```powershell
dotnet --version
node --version
sqlcmd -S "(localdb)\MSSQLLocalDB" -Q "SELECT @@VERSION" -h-1
dotnet ef --version
```

---

## First-time setup

All paths below are relative to the repo root. Run these once per machine.

### 1. Azure AD app registration (one-time, done by IT or Dillon)

Skip this step if the app is already registered and you have the Tenant ID and Client ID.

1. Go to [portal.azure.com](https://portal.azure.com) → **Azure Active Directory → App registrations → New registration**
2. Name: `AGP Command Station`
3. Platform: **Single-page application** · Redirect URI: `http://localhost:5173`
4. Under **API permissions → Add a permission**, add all of the following:

| Permission | Type | Admin consent required? |
|---|---|---|
| `User.Read` | Delegated | No |
| `Mail.Read` | Delegated | No |
| `Mail.Send` | Delegated | No |
| `Calendars.ReadWrite` | Delegated | No |
| `Chat.ReadWrite` | Delegated | No |
| `ChannelMessage.Read.User` | Delegated | No |
| `ChannelMessage.Send` | Delegated | **Yes** |
| Azure DevOps `user_impersonation` | Delegated (add "Azure DevOps" as an API) | No |

5. Note the **Tenant ID** and **Client ID** from the app overview page.

> `ChannelMessage.Send` requires an Azure AD global admin to click "Grant admin consent". Without it, Teams is read-only. The app detects missing scope and shows a warning banner.

### 2. Set user-secrets on the API project

From `homework_two/src/AgpCommandStation.Api/`:

```powershell
cd homework_two/src/AgpCommandStation.Api

dotnet user-secrets set "AzureAd:TenantId"  "<tenant-guid>"
dotnet user-secrets set "AzureAd:ClientId"  "<client-id>"
dotnet user-secrets set "Jwt:Key"            "<32+ random chars>"
dotnet user-secrets set "Encryption:Key"     "<32-byte key as hex or base64>"
```

**Generating the Encryption key** — the service accepts either 64 hex chars or 44-char base64 (both encode 32 bytes):

```powershell
# Hex (PowerShell):
-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })

# Or base64:
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

The secrets live in `%APPDATA%\Microsoft\UserSecrets\agp-command-station-api\secrets.json`, outside the repo.

> The API throws `InvalidOperationException` at startup if `Jwt:Key` or `Encryption:Key` are missing. See the troubleshooting table at the bottom of this file.

### 3. Set the MSAL client ID in the frontend

The frontend reads `VITE_AZURE_CLIENT_ID` and `VITE_AZURE_TENANT_ID` from a `.env.local` file (ignored by git):

```powershell
# homework_two/client/.env.local
VITE_AZURE_CLIENT_ID=<client-id>
VITE_AZURE_TENANT_ID=<tenant-guid>
```

Create the file:

```powershell
cd homework_two/client
@"
VITE_AZURE_CLIENT_ID=<client-id>
VITE_AZURE_TENANT_ID=<tenant-guid>
"@ | Out-File -Encoding utf8 .env.local
```

Without these values the sign-in button will use placeholder IDs and the MSAL popup will fail.

### 4. Migrate the database

One LocalDB database is used (no separate test/e2e isolation — the API tests are unit-only and don't touch the DB).

From `homework_two/src/AgpCommandStation.Api/`:

```powershell
dotnet ef database update
```

The design-time factory in `Data/DesignTimeDbContextFactory.cs` connects to `(localdb)\mssqllocaldb;Database=AgpCommandStation` without requiring secrets to be set first.

### 5. Install frontend dependencies

```powershell
cd homework_two/client
npm install
```

---

## Running the app in dev

Two terminals — the SPA proxies `/api/*` to the API on `:5001`, so both must be running.

**Terminal A — API on `http://localhost:5001`:**

```powershell
cd homework_two/src/AgpCommandStation.Api
dotnet run
```

Wait for `Now listening on: http://localhost:5001`. Swagger lives at [http://localhost:5001/swagger](http://localhost:5001/swagger) — click **Authorize** and paste a JWT issued by `/api/auth/microsoft`.

**Terminal B — SPA on `http://localhost:5173`:**

```powershell
cd homework_two/client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Click **Sign in with Microsoft**, complete the MSAL popup, and finish the onboarding modal.

---

## Running tests

### Backend unit tests (xUnit — 6 tests)

```powershell
cd homework_two
dotnet test AgpCommandStation.sln
```

Tests cover `EncryptionService` (round-trip, unique ciphertext, corrupt input) and `AnthropicChatService.DeriveTitle` (three cases). No network or DB required.

### Frontend type-check + build

```powershell
cd homework_two/client
npm run build     # tsc -b && vite build
```

Catches TypeScript errors and produces a production bundle. Not a substitute for functional testing but catches regressions quickly.

---

## First-login onboarding

After signing in for the first time, the onboarding modal collects:

| Step | What to enter |
|---|---|
| **Role** | Product Owner / Software Engineer / QA — shapes Claude's system prompt |
| **Anthropic API key** | Your `sk-ant-api03-…` key. Encrypted with AES-256-GCM before storage. |
| **Azure DevOps** | Org name (e.g. `agp-co`) and project name (e.g. `ELO Platform`). No PAT — auth comes from your Microsoft login. |
| **GitHub** | Org/username and a fine-grained PAT with `repo` + `pull_request` scopes (or a classic PAT). Encrypted before storage. |
| **Teams channels** | Configured in Profile Settings after login (channel picker loads from Graph API). |

You can skip sections and fill them in later via the user menu → **Profile Settings**.

Each credential section saves independently — changing your GitHub PAT does not require re-entering your Anthropic key.

---

## Per-user profile setup (Profile Settings)

Open via the user menu (top-right) → **Profile Settings**, or press `Ctrl+/` → navigate there.

| Section | Fields |
|---|---|
| Role | Card picker (PO / SE / QA). Takes effect on next chat message. |
| Anthropic | API key (masked). Encrypted on save. |
| Azure DevOps | Org name + Project name. Auth from Microsoft login, no PAT. |
| GitHub | Org/username + PAT. PAT encrypted on save. |

---

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+K` | Open global search (Command Palette) |
| `Ctrl+J` | Toggle AI chat panel open/closed |
| `Ctrl+N` | New work item (opens Work Item Builder) |
| `Ctrl+/` | Show keyboard shortcuts modal |
| `1` – `5` | Switch tabs when no input is focused |
| `↑` / `↓` | Navigate Command Palette results |
| `Enter` | Open selected result |
| `Esc` | Close active overlay |

---

## Common operations

### Adding a migration

```powershell
cd homework_two/src/AgpCommandStation.Api
dotnet ef migrations add <DescriptiveName>
dotnet ef database update
```

### Resetting the database

```powershell
cd homework_two/src/AgpCommandStation.Api
dotnet ef database drop --force
dotnet ef database update
```

### Production build smoke test

```powershell
cd homework_two/client
npm run build && npm run preview
```

The preview server does **not** proxy `/api` — API calls will fail. Only checks that the bundle renders.

### Inspecting the database

```powershell
sqlcmd -S "(localdb)\MSSQLLocalDB" -d AgpCommandStation `
  -Q "SELECT DisplayName, Email, Role, DevOpsOrganization, OnboardingComplete FROM AspNetUsers;"
```

The `AnthropicApiKeyEncrypted` and `GitHubPatEncrypted` columns contain base64-encoded AES-GCM ciphertext — never the raw keys.

### Verifying the Anthropic endpoint

Quick curl (PowerShell) — replace `<key>` with any `sk-ant-…` key:

```powershell
$key = "<sk-ant-api03-...>"
$body = '{"model":"claude-sonnet-4-6","max_tokens":50,"messages":[{"role":"user","content":"ping"}]}'
curl.exe -s -H "x-api-key: $key" -H "anthropic-version: 2023-06-01" `
  -H "Content-Type: application/json" -d $body https://api.anthropic.com/v1/messages
```

Expected: a JSON response with `{"content":[{"type":"text","text":"..."}],...}`.

### Generating a test JWT manually

Useful for hitting the Swagger UI without going through the sign-in flow. Call `/api/auth/microsoft` with a real Microsoft ID token from the MSAL popup (copy from the browser's Network tab, `idToken` field in the response to the token endpoint).

---

## Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/health` | none | Readiness probe |
| `POST` | `/api/auth/microsoft` | none | ID token → app JWT; upserts user on first call |
| `GET` | `/api/profile` | Bearer | Current user profile (no raw keys) |
| `PATCH` | `/api/profile` | Bearer | Update role, keys, DevOps, GitHub, Teams config |
| `GET` | `/api/chat/conversations` | Bearer | Last 20 conversations with user turns |
| `POST` | `/api/chat/conversations` | Bearer | Create conversation; 201 + detail with greeting |
| `GET` | `/api/chat/conversations/:id` | Bearer | Full conversation |
| `PATCH` | `/api/chat/conversations/:id` | Bearer | Update title |
| `POST` | `/api/chat/conversations/:id/messages` | Bearer + X-DevOps-Token + X-Graph-Token | SSE stream: `{"token":"…"}` or `{"toolCall":{"name":"…","label":"…"}}` frames |
| `POST` | `/api/chat/workitem-draft` | Bearer | Claude returns Bug/Task/User Story JSON |
| `POST` | `/api/chat/email-draft` | Bearer | Claude returns `{subject, body}` |
| `POST` | `/api/chat/event-draft` | Bearer | Claude returns `{title, startTime, endTime, attendees, description}` |
| `POST` | `/api/chat/message-polish` | Bearer | Claude returns `{polishedMessage}` |
| `POST` | `/api/chat/pr-draft` | Bearer | Claude returns `{title, body}` |
| `POST` | `/api/chat/pr-summary` | Bearer | Claude returns `{summary}` |
| `GET` | `/api/devops/workitems` | Bearer + X-DevOps-Token | WIQL assigned to @Me |
| `POST` | `/api/devops/workitems/:type` | Bearer + X-DevOps-Token | Create work item (JSON Patch) |
| `PATCH` | `/api/devops/workitems/:id/state` | Bearer + X-DevOps-Token | Update state |
| `POST` | `/api/devops/workitems/:id/comments` | Bearer + X-DevOps-Token | Add comment |
| `GET` | `/api/devops/repos` | Bearer + X-DevOps-Token | List ADO repos |
| `GET` | `/api/devops/repos/:id/tree` | Bearer + X-DevOps-Token | File tree (one level) |
| `GET` | `/api/devops/repos/:id/file` | Bearer + X-DevOps-Token | File content |
| `GET` | `/api/devops/repos/:id/branches` | Bearer + X-DevOps-Token | Branch list |
| `GET` | `/api/devops/repos/:id/commits` | Bearer + X-DevOps-Token | Recent commits |
| `GET` | `/api/devops/pullrequests` | Bearer + X-DevOps-Token | PRs where reviewer = me |
| `POST` | `/api/devops/repos/:id/pullrequests` | Bearer + X-DevOps-Token | Create PR |
| `PUT` | `/api/devops/pullrequests/:id/vote` | Bearer + X-DevOps-Token | Approve/reject |
| `POST` | `/api/devops/pullrequests/:id/threads` | Bearer + X-DevOps-Token | Add thread |
| `GET` | `/api/repos/github` | Bearer | List GitHub org repos |
| `GET` | `/api/repos/github/:owner/:repo/tree` | Bearer | File tree |
| `GET` | `/api/repos/github/:owner/:repo/file` | Bearer | File content |
| `GET` | `/api/repos/github/:owner/:repo/branches` | Bearer | Branch list |
| `GET` | `/api/repos/github/:owner/:repo/commits` | Bearer | Recent commits |
| `GET` | `/api/repos/github/:owner/:repo/pulls` | Bearer | Open PRs |
| `POST` | `/api/repos/github/:owner/:repo/pulls` | Bearer | Create PR |
| `POST` | `/api/repos/github/:owner/:repo/pulls/:n/reviews` | Bearer | Submit review |
| `GET` | `/api/graph/mail` | Bearer + X-Graph-Token | Unread messages |
| `GET` | `/api/graph/mail/:id` | Bearer + X-Graph-Token | Full message |
| `POST` | `/api/graph/mail/send` | Bearer + X-Graph-Token | Send / reply |
| `GET` | `/api/graph/calendar` | Bearer + X-Graph-Token | Calendar week view |
| `POST` | `/api/graph/calendar/events` | Bearer + X-Graph-Token | Create event |
| `GET` | `/api/graph/teams/chats` | Bearer + X-Graph-Token | Recent chats |
| `GET` | `/api/graph/teams/channels/:teamId/:channelId` | Bearer + X-Graph-Token | Channel messages |
| `POST` | `/api/graph/teams/channels/:teamId/:channelId` | Bearer + X-Graph-Token | Post to channel |
| `GET` | `/api/search` | Bearer + X-DevOps-Token + X-Graph-Token | Fan-out search |
| `GET` | `/api/notifications` | Bearer + X-DevOps-Token + X-Graph-Token | Aggregated notifications |
| `GET` | `/swagger` | none (dev only) | Interactive API explorer |

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `InvalidOperationException: Jwt:Key is not configured` on startup | User-secrets not set | Run `dotnet user-secrets set "Jwt:Key" "…"` from `src/AgpCommandStation.Api/` |
| `InvalidOperationException: Encryption:Key is not configured` | Encryption key missing | Run `dotnet user-secrets set "Encryption:Key" "…"` (32-byte hex or base64) |
| `InvalidOperationException: AzureAd:TenantId not configured` | Azure AD secrets not set | Set both `AzureAd:TenantId` and `AzureAd:ClientId` via user-secrets |
| MSAL popup closes but no sign-in happens | Wrong redirect URI in app registration | Confirm `http://localhost:5173` is in the SPA platform redirect URIs |
| MSAL popup error "AADSTS700016: Application not found" | Wrong Client ID in `.env.local` | Check `VITE_AZURE_CLIENT_ID` matches the portal's **Application (client) ID** |
| `/api/auth/microsoft` returns `{"error":"invalid_token"}` | ID token expired or wrong audience | Tokens expire in ~5 min; retry. Also confirm `AzureAd:ClientId` matches the token's `aud` claim |
| Chat streams nothing / "Anthropic API key not configured" | No Anthropic key saved | Open Profile Settings and save a valid `sk-ant-…` key |
| ADO panels show "DevOps not configured" | Org/project not set in profile | Open Profile Settings → Azure DevOps, enter org and project name |
| ADO API returns 401 | Microsoft token expired | MSAL refreshes silently; if it fails, sign out and back in |
| GitHub panels show "GitHub not configured" | No GitHub PAT or org set in profile | Open Profile Settings → GitHub |
| LocalDB connection error | Instance not started | `sqllocaldb start MSSQLLocalDB` |
| `dotnet ef database update` fails with "No such host" | LocalDB not running | Start it first (see above) |
| Vite dev `/api` calls return "Connection refused" | API not running on `:5001`, or wrong port | Check Terminal A; proxy target is `http://localhost:5001` in `client/vite.config.ts` |
| Teams "Post to channel" button disabled | `ChannelMessage.Send` scope not granted | Contact your Azure AD admin to grant the permission for the app |
| Tool calls in chat show no results | ADO/Graph tokens not forwarded | Check that MSAL acquired tokens; look for `acquireTokenSilent` errors in the browser console |

---

## Project layout cheat sheet

```text
homework_two/
├─ AgpCommandStation.sln
├─ README.md
├─ runbook.md
├─ plans/agp-command-station.md
├─ designs/v2/                          # Visual reference (do not modify)
├─ src/AgpCommandStation.Api/
│  ├─ Program.cs                        # DI + pipeline
│  ├─ Controllers/                      # Auth, Profile, Chat, DevOps, Repos, Graph, Search, Notifications
│  ├─ Services/                         # AnthropicChatService, ClaudePersonaService, EncryptionService,
│  │                                    # JwtTokenService, ToolExecutorService, ToolDefinitions, SseEvent, ToolContext
│  ├─ Models/                           # ApplicationUser (UserRole, encrypted fields), Conversation, ChatMessage
│  ├─ Data/                             # AppDbContext (IdentityDbContext<ApplicationUser>), DesignTimeFactory
│  ├─ Dtos/                             # Auth, Profile, DevOps, Graph, Repos, Search, Notifications, Chat
│  └─ Migrations/
└─ tests/AgpCommandStation.Api.Tests/
   ├─ EncryptionServiceTests.cs         # 3 tests
   └─ AnthropicChatServiceTests.cs      # 3 tests
```
