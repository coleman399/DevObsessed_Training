# AGP Command Station — homework_two

## Context

Each team member (PO, SE, QA) logs in with their Microsoft account, brings their own Anthropic API key, and gets a role-aware AI assistant wired into Azure DevOps, Outlook (email + calendar), Microsoft Teams, and both Azure DevOps and GitHub repos — a full command station for the team's day.

Built with the same stack as homework_one: ASP.NET Core 8, React + Vite + TypeScript, plain CSS, SQL Server LocalDB.

---

## The Command Station Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  AGP COMMAND STATION                           [Dillon Coleman ▼]   │
├────────────────────┬──────────────────┬─────────────────────────────┤
│   AI CHAT          │  AZURE DEVOPS    │  MICROSOFT 365               │
│                    │                  │  ┌───────────────────────┐   │
│  Role-aware        │  Assigned items  │  │ CALENDAR (this week)  │   │
│  Claude            │  + state update  │  │ Mon Tue Wed Thu Fri   │   │
│  assistant         │  + comments      │  │ [week grid + join]    │   │
│                    │                  │  └───────────────────────┘   │
│                    │  PO: Work Item   │  ┌───────────────────────┐   │
│                    │  Builder         │  │ OUTLOOK (unread)      │   │
│                    │                  │  │ [read + AI compose]   │   │
│                    │                  │  └───────────────────────┘   │
│                    │  REPOS & PRs     │  ┌───────────────────────┐   │
│                    │  ADO + GitHub    │  │ TEAMS                 │   │
│                    │  file browser    │  │ @mentions + channels  │   │
│                    │  + PR review     │  │ [send to channel]     │   │
└────────────────────┴──────────────────┴─────────────────────────────┘
```

Right panel is tabbed: **Work Items | Repos & PRs | Email | Calendar | Teams**

---

## Architecture Overview

```
homework_two/
├── plans/
│   └── agp-command-station.md
├── src/AgpCommandStation.Api/
│   ├── Controllers/
│   │   ├── AuthController.cs          # Microsoft OIDC token → app JWT
│   │   ├── ProfileController.cs       # Role, API keys, PATs
│   │   ├── ChatController.cs          # Anthropic SSE streaming + tool use loop
│   │   ├── DevOpsController.cs        # Work items + ADO repos + PRs
│   │   ├── ReposController.cs         # GitHub repos + PRs
│   │   └── GraphController.cs         # Outlook + Calendar + Teams proxy
│   ├── Services/
│   │   ├── AnthropicChatService.cs    # Anthropic API, per-user key, tool use loop
│   │   ├── CodeSearchService.cs       # search_code / get_file / list_directory tools
│   │   ├── DevOpsService.cs           # Azure DevOps REST (PAT auth)
│   │   ├── GitHubService.cs           # GitHub REST (PAT auth)
│   │   ├── GraphService.cs            # Microsoft Graph (Graph token passthrough)
│   │   └── EncryptionService.cs       # AES-256-GCM for all stored keys/PATs
│   ├── Models/
│   │   ├── ApplicationUser.cs
│   │   ├── Conversation.cs
│   │   └── ChatMessage.cs
│   ├── Data/AppDbContext.cs
│   └── Program.cs
├── tests/AgpCommandStation.Api.Tests/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── MicrosoftSignInButton.tsx
│   │   │   │   └── OnboardingModal.tsx       # Role + keys after first login
│   │   │   ├── chat/
│   │   │   │   ├── ChatInput.tsx
│   │   │   │   ├── MessageList.tsx
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   ├── ToolCallIndicator.tsx     # "Searching code..." status lines
│   │   │   │   └── PinnedFilesBar.tsx        # Pinned file pills above input
│   │   │   ├── workitems/
│   │   │   │   ├── WorkItemList.tsx
│   │   │   │   ├── WorkItemCard.tsx
│   │   │   │   └── WorkItemBuilder.tsx       # PO only: AI-assisted create
│   │   │   ├── repos/
│   │   │   │   ├── RepoPanel.tsx             # Tabbed: ADO | GitHub
│   │   │   │   ├── RepoTree.tsx              # File browser
│   │   │   │   ├── PullRequestList.tsx
│   │   │   │   ├── PullRequestCard.tsx       # Detail: AI summary, review, comment
│   │   │   │   └── CreatePrModal.tsx         # AI-assisted PR drafting
│   │   │   ├── outlook/
│   │   │   │   ├── MailPanel.tsx
│   │   │   │   └── ComposeModal.tsx          # AI-drafted email editor
│   │   │   ├── calendar/
│   │   │   │   ├── CalendarPanel.tsx         # Week grid
│   │   │   │   ├── EventCard.tsx             # Meeting + Teams join link
│   │   │   │   └── CreateEventModal.tsx      # AI-assisted event creation
│   │   │   ├── teams/
│   │   │   │   ├── TeamsPanel.tsx            # @mentions + channels
│   │   │   │   └── SendToChannelModal.tsx
│   │   │   ├── command/
│   │   │   │   └── CommandStation.tsx        # 3-column layout + tab nav
│   │   │   └── profile/
│   │   │       └── ProfileSettings.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts         # MSAL state + JWT + Graph token
│   │   │   ├── useChat.ts         # Streaming chat + tool_call SSE events
│   │   │   ├── useWorkItems.ts
│   │   │   ├── useRepos.ts        # ADO + GitHub repos, PRs, file tree
│   │   │   ├── useMail.ts
│   │   │   ├── useCalendar.ts
│   │   │   └── useTeams.ts
│   │   ├── lib/
│   │   │   ├── api.ts             # apiFetch with JWT header
│   │   │   ├── auth.ts            # Token storage helpers
│   │   │   └── types.ts
│   │   └── styles/
│   │       ├── tokens.css         # AGP brand palette
│   │       └── *.css
│   └── e2e/
└── designs/                       # Designer handoff goes here
```

---

## Phase A — Foundation

### 1. Auth: Microsoft Entra ID (MSAL)

**Frontend** (`@azure/msal-browser`):
- Single "Sign in with Microsoft" button (replaces email/password forms)
- MSAL popup flow → gets ID token (name, email, object ID)
- ID token sent to `POST /api/auth/microsoft` → receive app JWT

**Backend** (`Microsoft.Identity.Web`):
- Validate Microsoft ID token → upsert user by `oid` → issue HS256 app JWT (60 min)
- First login creates user record with no role/keys; onboarding modal handles the rest

**MSAL scopes at login:**

| Scope | Purpose | Admin consent? |
|-------|---------|---------------|
| `User.Read` | Basic profile | No |
| `Mail.Read` | Read Outlook emails | No |
| `Mail.Send` | Send/reply emails | No |
| `Calendars.ReadWrite` | Read + create calendar events | No |
| `Chat.Read` | Read Teams DMs + chats | No |
| `ChannelMessage.Read.User` | Read channel messages | No |
| `ChannelMessage.Send` | Post to channels | **Yes — IT must approve** |

> ⚠️ If `ChannelMessage.Send` admin consent is unavailable, Teams is scoped to read-only mentions/DMs.

**Graph token flow**: MSAL caches the Graph access token in sessionStorage. Frontend sends it as `X-Graph-Token` on calls to `/api/graph/*`. Backend forwards it as `Authorization: Bearer` to Graph — never stored in our DB.

**Config (user-secrets):**

```
AzureAd:TenantId   = <AGP tenant GUID>
AzureAd:ClientId   = <app registration client ID>
Jwt:Key            = <32+ char signing key>
Encryption:Key     = <32-byte AES key>
```

### 2. User Profile Model

```csharp
public class ApplicationUser : IdentityUser<string>
{
    public string DisplayName { get; set; }
    public UserRole Role { get; set; }                   // ProductOwner | SoftwareEngineer | QA
    public string? AnthropicApiKeyEncrypted { get; set; }
    public string? DevOpsOrganization { get; set; }
    public string? DevOpsProject { get; set; }
    public string? DevOpsPatEncrypted { get; set; }      // Scopes: Work Items RW, Code RW, PRs RW
    public string? GitHubOrganization { get; set; }
    public string? GitHubPatEncrypted { get; set; }      // Scopes: repo, pull_request
    public string? TeamsChannelsJson { get; set; }       // JSON array of { teamId, channelId, name }
}
```

**EncryptionService**: AES-256-GCM, key from user-secrets. Encrypt on write, decrypt on read. Raw keys/PATs never appear in API responses.

**Onboarding modal** (shown after first login until profile is complete):
1. Role — dropdown (ProductOwner / SoftwareEngineer / QA)
2. Anthropic API key — masked input (`sk-ant-...`)
3. Azure DevOps org + project + PAT
4. GitHub org/username + PAT
5. Teams channels to monitor (teamId + channelId, up to 3)

### 3. Anthropic Chat (per-user key, role-aware)

- Endpoint: `POST https://api.anthropic.com/v1/messages`
- Model: `claude-sonnet-4-6`
- Auth: `x-api-key: {decryptedAnthropicKey}`, `anthropic-version: 2023-06-01`
- Streaming: `stream: true` → SSE back to frontend (same pattern as homework_one)

**Role-based system prompts:**

```
ProductOwner: "You are the AGP Command Station AI for {name}, a Product Owner at AGP.
  You help write user stories with acceptance criteria, refine backlog items, and create
  Azure DevOps work items. Be concise and business-focused. Plain prose only."

SoftwareEngineer: "You are the AGP Command Station AI for {name}, a Software Engineer at AGP.
  You help understand requirements, break stories into tasks, estimate complexity, and
  navigate codebases. Be technical and concise. Plain prose only."

QA: "You are the AGP Command Station AI for {name}, a QA Engineer at AGP.
  You help write test cases, identify edge cases, draft bug reports, and verify acceptance
  criteria. Be systematic and concise. Plain prose only."
```

### 4. AGP Theming

- Replace homework_one's purple/orb aesthetic with AGP brand colors
- **Designer to provide hex values** — default placeholder: deep navy + gold
- All dimensions in `rem`, mobile-responsive breakpoints
- Command station feel: tighter grid, data-dense panels, monospace accents for IDs/hashes

---

## Phase B — Azure DevOps: Work Items

All calls use user's decrypted DevOps PAT → `Authorization: Basic {base64(:pat)}`.

### View assigned items

```
POST https://dev.azure.com/{org}/{project}/_apis/wit/wiql?api-version=7.1
{ "query": "SELECT [Id],[Title],[State],[WorkItemType] FROM WorkItems
            WHERE [Assigned To] = @Me AND [State] <> 'Closed'
            ORDER BY [Changed Date] DESC" }
```

`WorkItemCard`: type badge (Story/Bug/Task), state pill, DevOps link.

### Create work item — AI-assisted (PO only)

1. `WorkItemBuilder`: user describes feature in plain language
2. `POST /api/chat/workitem-draft` → Claude returns structured JSON:
   ```json
   { "type": "User Story", "title": "...", "description": "...",
     "acceptanceCriteria": ["..."], "tags": ["..."] }
   ```
3. Editable preview → "Create in DevOps" → `POST .../workitems/$User Story?api-version=7.1`

### Update state

```
PATCH .../workitems/{id}
[{ "op": "replace", "path": "/fields/System.State", "value": "Resolved" }]
```

### Add comment

```
POST .../workitems/{id}/comments
{ "text": "..." }
```

---

## Phase C — Microsoft 365 (Graph API)

All routes require `X-Graph-Token` header from frontend.

### Outlook Email

| Action | Graph call |
|--------|-----------|
| List unread | `GET /me/messages?$filter=isRead eq false&$top=20` |
| Read full email | `GET /me/messages/{id}` |
| Send / reply | `POST /me/sendMail` |

"Draft Reply with AI": sends email body to Claude → returns draft reply → user edits in `ComposeModal` → sends.

### Calendar

| Action | Graph call |
|--------|-----------|
| Week view | `GET /me/calendarView?startDateTime=...&endDateTime=...` |
| Create event | `POST /me/events` |

`EventCard` shows Teams `joinUrl` from `onlineMeeting` field as a "Join" button.
"Draft with AI": describe meeting → Claude fills title, duration, description, suggested attendees.

### Teams

| Action | Graph call | Consent |
|--------|-----------|---------|
| @mentions / chats | `GET /me/chats?$expand=lastMessagePreview` | No |
| Channel messages | `GET /teams/{id}/channels/{id}/messages` | No |
| Send to channel | `POST /teams/{id}/channels/{id}/messages` | **IT admin** |

User configures monitored channels (up to 3) in Profile Settings.

---

## Phase D — Repository Access

### Azure DevOps Repos (same PAT, add Code + PR scopes)

| Action | API |
|--------|-----|
| List repos | `GET .../git/repositories` |
| File tree | `GET .../repositories/{id}/items?recursionLevel=OneLevel` |
| File content | `GET .../repositories/{id}/items?path={path}` |
| List PRs (mine) | `GET .../pullrequests?searchCriteria.reviewerId={me}` |
| Create PR | `POST .../repositories/{id}/pullrequests` |
| Approve/reject | `PUT .../pullrequests/{id}/reviewers/{me}` with `{ "vote": 10 }` |
| Add comment thread | `POST .../pullrequests/{id}/threads` |

### GitHub Repos (PAT, `repo` + `pull_request` scopes)

| Action | API |
|--------|-----|
| List org repos | `GET /orgs/{org}/repos?sort=updated` |
| File tree | `GET /repos/{owner}/{repo}/git/trees/{sha}?recursive=1` |
| File content | `GET /repos/{owner}/{repo}/contents/{path}` (base64 decode) |
| List open PRs | `GET /repos/{owner}/{repo}/pulls?state=open` |
| Create PR | `POST /repos/{owner}/{repo}/pulls` |
| Submit review | `POST /repos/{owner}/{repo}/pulls/{n}/reviews` |
| Add line comment | `POST /repos/{owner}/{repo}/pulls/{n}/comments` |

### AI for PRs (both platforms)

- **"Summarize this PR"**: title + description + changed file list → Claude → plain-English summary (what changed, why, what to watch in review)
- **"Draft review comment"**: user describes concern → Claude drafts a constructive comment → user edits → posts

---

## Phase E — Codebase Q&A (Agentic Tool Use)

The chatbot can answer questions about code by calling tools server-side to fetch the actual files.

### Example

> **User**: "How does authentication work in this codebase?"
>
> Claude calls `search_code("authentication")` → finds `AuthController.cs`, `JwtTokenService.cs`
> Claude calls `get_file("AgpCommandStation", "Controllers/AuthController.cs")`
> Claude answers with specific explanation, citing file paths and line numbers

### Tools exposed to Claude

```typescript
search_code(query: string, repo?: string)
  → { file: string, line: number, snippet: string }[]

get_file(repo: string, path: string)
  → { content: string, language: string, url: string }
  // truncated at 500 lines — Claude can narrow with a more specific path

list_directory(repo: string, path: string)
  → { name: string, type: "file" | "folder" }[]
```

### Backend tool loop (`AnthropicChatService`)

1. Send user message + tool definitions to Anthropic API
2. If stream contains `tool_use` block → execute tool against DevOps/GitHub API → send `tool_result` in new turn
3. Repeat until Claude emits plain text with no pending tool calls
4. Stream final answer to frontend

The loop is entirely server-side. Frontend sees one continuous streaming response.

### Tool implementations (`CodeSearchService`)

- `search_code`: ADO Search API (`almsearch.dev.azure.com`) + GitHub Code Search API
- `get_file`: same APIs as Phase D file content endpoints
- `list_directory`: same as file tree endpoints, names + types only

### System prompt addition (all roles)

```
You have access to AGP codebases via tools. When asked about code, use search_code
to find relevant files, then get_file to read them before answering. Always cite
file path and line numbers. For "where is X defined" — search_code first.
```

### Frontend additions

- **`ToolCallIndicator`**: animated status lines between tool calls:
  `🔍 Searching code for "authentication"...` → `📄 Reading Controllers/AuthController.cs...`
  Delivered as `event: tool_call` SSE events (separate from token stream)

- **`PinnedFilesBar`**: "Pin to chat" button on any file in `RepoTree` → file prepended to every message as known context, bypassing tool loop. Shown as pills above the chat input.

---

## Reuse from homework_one

| homework_one | homework_two use |
|-------------|-----------------|
| `ChatController.cs` SSE pattern | Adapt for Anthropic API format + tool loop |
| `JwtTokenService.cs` | Unchanged |
| `AppDbContext.cs` | Add new ApplicationUser fields + migration |
| `ChatInput`, `MessageList`, `MessageBubble` | Copy unchanged |
| `useChat` hook | Add `tool_call` SSE event handling |
| `apiFetch` helper | Unchanged |

---

## Setup Checklist

Before running the app, each developer needs:

1. **Azure AD app registration** in AGP's Entra ID tenant
   - Platform: Single-page application
   - Redirect URI: `http://localhost:5173`
   - API permissions: `User.Read`, `Mail.Read`, `Mail.Send`, `Calendars.ReadWrite`, `Chat.Read`, `ChannelMessage.Read.User`
   - Optional (IT admin grant): `ChannelMessage.Send`

2. **User-secrets** on the API project:
   ```
   AzureAd:TenantId, AzureAd:ClientId, Jwt:Key, Encryption:Key
   ```

3. **Profile setup** (via onboarding modal after first login):
   - Anthropic API key (`sk-ant-...`)
   - Azure DevOps PAT: Work Items (RW), Code (RW), Pull Requests (Contribute)
   - GitHub PAT: `repo`, `pull_request` scopes
   - Teams channels to monitor (up to 3)

---

## Open Questions for Designer / Stakeholders

- **AGP brand colors**: hex values needed for `tokens.css`
- **AGP logo / wordmark**: for the top nav
- **Teams admin consent**: can IT approve `ChannelMessage.Send`?
- **Azure DevOps org name**: needed for all API URLs
- **GitHub org name**: needed for repo listing
- **Work item types for AI creation**: User Story only, or Bug + Task too?
- **Teams channel config UX**: manual teamId entry vs. channel picker UI after auth?
