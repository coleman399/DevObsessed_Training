# AGP Command Station — homework_two

## Context

Each team member (PO, SE, QA) logs in with their Microsoft account, brings their own Anthropic API key, and gets a role-aware AI assistant wired into Azure DevOps, Outlook (email + calendar), Microsoft Teams, and both Azure DevOps and GitHub repos — a full command station for the team's day.

Built with the same stack as homework_one: ASP.NET Core 8, React + Vite + TypeScript, plain CSS, SQL Server LocalDB.

---

## The Command Station Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  AGP COMMAND STATION          [⌘K Search…]   🔔  [SE · Dillon ▼]       │
├──────────────────────────┬──────────────────────────────────────────────┤
│   AI CHAT                │  [Work Items][Repos & PRs][Email][Cal][Teams] │
│                          │                                               │
│  Role-aware Claude       │  ┌─────────────────────────────────────────┐  │
│  assistant               │  │  Active tab content:                    │  │
│                          │  │  · Work Items — assigned + builder      │  │
│  Tool call indicators    │  │  · Repos & PRs — ADO + GitHub           │  │
│  between responses       │  │  · Email — unread + compose             │  │
│                          │  │  · Calendar — week grid + join links    │  │
│  Pinned files bar        │  │  · Teams — mentions + channels + send   │  │
│  above input             │  └─────────────────────────────────────────┘  │
└──────────────────────────┴──────────────────────────────────────────────┘
```

Top nav: AGP logo · global search bar (⌘K) · notification bell (🔔) · role pill + user menu.
Right panel: tabbed, one active tab at a time. Tabs switchable via nav or keyboard shortcuts 1–5.

---

## Architecture Overview

```
homework_two/
├── plans/
│   └── agp-command-station.md
├── src/AgpCommandStation.Api/
│   ├── Controllers/
│   │   ├── AuthController.cs          # Microsoft OIDC token → app JWT
│   │   ├── ProfileController.cs       # Role, API keys, GitHub PAT
│   │   ├── ChatController.cs          # Anthropic SSE streaming + tool use loop
│   │   ├── DevOpsController.cs        # Work items + ADO repos + PRs (OAuth token)
│   │   ├── ReposController.cs         # GitHub repos + PRs (PAT)
│   │   ├── GraphController.cs         # Outlook + Calendar + Teams proxy
│   │   ├── SearchController.cs        # Global search fan-out
│   │   └── NotificationsController.cs # Aggregated notifications
│   ├── Services/
│   │   ├── AnthropicChatService.cs    # Anthropic API, per-user key, tool use loop
│   │   ├── ClaudePersonaService.cs    # Reads ~/.claude/ files, assembles system prompt
│   │   ├── CodeSearchService.cs       # search_code / get_file / list_directory tools
│   │   ├── DevOpsService.cs           # Azure DevOps REST (OAuth token — no PAT)
│   │   ├── GitHubService.cs           # GitHub REST (PAT)
│   │   ├── GraphService.cs            # Microsoft Graph (Graph token passthrough)
│   │   └── EncryptionService.cs       # AES-256-GCM for Anthropic key + GitHub PAT
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
│   │   │   │   └── OnboardingModal.tsx
│   │   │   ├── chat/
│   │   │   │   ├── ChatInput.tsx
│   │   │   │   ├── MessageList.tsx
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   ├── ToolCallIndicator.tsx
│   │   │   │   └── PinnedFilesBar.tsx
│   │   │   ├── workitems/
│   │   │   │   ├── WorkItemList.tsx
│   │   │   │   ├── WorkItemCard.tsx
│   │   │   │   └── WorkItemBuilder.tsx   # All roles; type defaults by role
│   │   │   ├── repos/
│   │   │   │   ├── RepoPanel.tsx
│   │   │   │   ├── RepoTree.tsx
│   │   │   │   ├── PullRequestList.tsx
│   │   │   │   ├── PullRequestCard.tsx
│   │   │   │   ├── CreatePrModal.tsx
│   │   │   │   └── NewPrModal.tsx        # Create new PR form
│   │   │   ├── outlook/
│   │   │   │   ├── MailPanel.tsx
│   │   │   │   └── ComposeModal.tsx
│   │   │   ├── calendar/
│   │   │   │   ├── CalendarPanel.tsx
│   │   │   │   ├── EventCard.tsx
│   │   │   │   └── NewEventModal.tsx     # Create calendar event form
│   │   │   ├── teams/
│   │   │   │   ├── TeamsPanel.tsx
│   │   │   │   └── SendToChannelModal.tsx
│   │   │   ├── command/
│   │   │   │   └── CommandStation.tsx
│   │   │   ├── profile/
│   │   │   │   └── ProfileSettings.tsx
│   │   │   ├── search/
│   │   │   │   └── CommandPalette.tsx
│   │   │   ├── notifications/
│   │   │   │   └── NotificationBell.tsx
│   │   │   └── shortcuts/
│   │   │       └── KeyboardShortcutsModal.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useChat.ts
│   │   │   ├── useWorkItems.ts
│   │   │   ├── useRepos.ts
│   │   │   ├── useMail.ts
│   │   │   ├── useCalendar.ts
│   │   │   ├── useTeams.ts
│   │   │   ├── useSearch.ts
│   │   │   ├── useNotifications.ts
│   │   │   └── useKeyboardShortcuts.ts
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   └── types.ts
│   │   └── styles/
│   │       ├── tokens.css
│   │       └── *.css
│   └── e2e/
└── designs/
```

---

## Phase ordering

Phases must be built in this order:

- **Phase A** must come first — everything depends on auth and the user profile
- **Phases B, C, D** are independent of each other and can be built in any order or in parallel after A
- **Phase E** (tool use) must come after B, C, and D — Claude's tools call those APIs
- **Phases F, G, H** depend on the overall app structure but are self-contained additions; build after the core panels are working

---

## Phase A — Foundation

### 1. Auth: Microsoft Entra ID (MSAL)

**Frontend** (`@azure/msal-browser`):
- Single "Sign in with Microsoft" button
- MSAL popup flow → ID token (name, email, object ID)
- ID token sent to `POST /api/auth/microsoft` → receive app JWT

**Backend** (`Microsoft.Identity.Web`):
- Validate Microsoft ID token → upsert user by `oid` → issue HS256 app JWT (60 min)
- First login creates user record; onboarding modal collects the rest

**MSAL scopes at login:**

| Scope | Purpose | Admin consent? |
|-------|---------|----------------|
| `User.Read` | Basic profile | No |
| `Mail.Read` | Read Outlook emails | No |
| `Mail.Send` | Send / reply emails | No |
| `Calendars.ReadWrite` | Read + create calendar events | No |
| `Chat.Read` | Read Teams DMs + chats | No |
| `ChannelMessage.Read.User` | Read channel messages | No |
| `ChannelMessage.Send` | Post to channels | **Yes — IT must approve** |
| `499b84ac-1321-427f-aa17-267ca6975798/user_impersonation` | Azure DevOps | No |

> ⚠️ `ChannelMessage.Send` requires an Azure AD admin to grant consent for the org. If unavailable, Teams is read-only (mentions + DMs only). The app detects missing scope post-login and shows a warning banner in the Teams panel.

> `499b84ac-1321-427f-aa17-267ca6975798` is the Azure DevOps application ID in Azure AD. This scope means Microsoft login covers Azure DevOps — **no PAT required for ADO**. MSAL refreshes the token automatically.

**Token flow**: MSAL caches separate access tokens per audience in sessionStorage. Frontend sends:
- `X-Graph-Token` on calls to `/api/graph/*`
- `X-DevOps-Token` on calls to `/api/devops/*`

Backend forwards each as `Authorization: Bearer` to the respective API. Neither token is stored in our DB.

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
    public string? DevOpsOrganization { get; set; }      // e.g. "AGP-IT"
    public string? DevOpsProject { get; set; }           // e.g. "Platform"
    public string? GitHubOrganization { get; set; }
    public string? GitHubPatEncrypted { get; set; }      // Scopes: repo, pull_request
    public string? TeamsChannelsJson { get; set; }       // JSON: [{ teamId, channelId, name }]
    public string? BotPersonaMarkdownOverride { get; set; } // Cloud fallback only — see ClaudePersonaService
}
```

Note: No `DevOpsPatEncrypted` — ADO access comes through the Microsoft OAuth token.

**EncryptionService**: AES-256-GCM, key from user-secrets. Encrypts `AnthropicApiKeyEncrypted` and `GitHubPatEncrypted` on write, decrypts on read. Raw values never appear in API responses.

**Onboarding modal** (shown after first login until profile is complete):

1. Role — card picker (Product Owner / Software Engineer / QA)
2. Anthropic API key — masked input (`sk-ant-...`) + "Test connection" button
3. Azure DevOps org + project — text inputs (no PAT; auth is from Microsoft login) + "Test connection"
4. GitHub org/username + PAT — text inputs + "Test connection"
5. Teams channels — channel picker (loads user's Teams from Graph after auth, select up to 3)

Each "Test connection" makes a lightweight read call to verify the credential before saving. Shows green checkmark on success, inline error on failure.

**Profile Settings screen** (`PATCH /api/profile`):

Single scrollable page with five independent sections. Each section saves independently — changing your GitHub PAT does not require re-entering your Anthropic key.

| Section | Fields | Save action |
|---------|--------|-------------|
| Role | Role card picker (PO / SE / QA) | `PATCH /api/profile` `{ role }` — takes effect on next chat message |
| Anthropic | API key (masked) + "Test connection" | `PATCH /api/profile` `{ anthropicApiKey }` — encrypted on backend |
| Azure DevOps | Org name + Project name + "Test connection" | `PATCH /api/profile` `{ devOpsOrganization, devOpsProject }` |
| GitHub | Org/username + PAT (masked) + "Test connection" | `PATCH /api/profile` `{ gitHubOrganization, gitHubPat }` — encrypted |
| Teams channels | Channel picker (up to 3) | `PATCH /api/profile` `{ teamsChannels }` |

Each section's "Save" button is disabled until the user changes a field. After save: brief "Saved" checkmark inline. On error: inline `ErrorCard`. "Test connection" must pass before the credential section can be saved (button disabled if status is not `ok`).

### 3. Anthropic Chat (per-user key, role-aware)

- Endpoint: `POST https://api.anthropic.com/v1/messages`
- Model: returned from `GET /api/profile` as `{ model: "claude-sonnet-4-6" }` — never hardcoded in frontend
- Auth: `x-api-key: {decryptedAnthropicKey}`, `anthropic-version: 2023-06-01`
- Streaming: `stream: true` → SSE back to frontend

**`ClaudePersonaService` — persona assembly:**

Since the app runs on localhost, the backend reads the user's persona from the filesystem:

1. Read `%USERPROFILE%\.claude\CLAUDE.md`
2. Parse backtick file references in order (`` `SOUL.md` ``, `` `IDENTITY.md` ``, etc.)
3. Read each referenced file from `%USERPROFILE%\.claude\` in listed order
4. Concatenate → assembled persona markdown
5. Cache per session; invalidate on profile refresh

> If `~/.claude/CLAUDE.md` doesn't exist: fall back to `BotPersonaMarkdownOverride` from the user's profile, then to a generic AGP persona if neither exists.
>
> ⚠️ **Cloud deployment**: filesystem read breaks when the backend isn't on the user's machine. In that case, onboarding prompts for a zip upload of `~/.claude/`. `ClaudePersonaService` extracts and assembles identically. The assembled text (not the zip) is stored in `BotPersonaMarkdownOverride`.

**System prompt construction:**

```
{assembled persona — SOUL.md + USER.md + IDENTITY.md + etc. in order}

---
You are working inside AGP Command Station. Today is {date}.
The user's role at AGP is {role}.

You have access to their Azure DevOps work items, Outlook email and calendar,
Microsoft Teams messages, and AGP codebases via tools.

{role-specific guidance}
```

Role-specific guidance:

```text
ProductOwner: Help write user stories with acceptance criteria, refine backlog
  items, and create well-structured Azure DevOps work items. Be concise and
  business-focused.

SoftwareEngineer: Help understand requirements, break stories into technical
  tasks, estimate complexity, and navigate codebases. Be technical and concise.

QA: Help write test cases, identify edge cases, draft bug reports, and verify
  acceptance criteria. Be systematic and concise.
```

### 4. Error states and loading patterns

Every panel and AI-assisted operation follows this consistent pattern:

**Panel data loading**: skeleton → content | error card + retry button | empty state message

**AI-assisted operations** (Work Item draft, PR summary, email draft, event draft):
- Loading: skeleton placeholder with "Asking {botName}..." label
- Success: populated editable form
- Error: inline error message + "Try again" button that re-runs the same request

**Credential errors**: any 401/403 from ADO, GitHub, or Graph shows a dismissible banner:
> "Your {service} connection expired. [Update in Profile Settings]"

**API errors (5xx / network)**: inline error card with retry. Does not bounce user to auth.

### 5. AGP Theming

- AGP brand colors from designer's `tokens.css`
- All dimensions in `rem`, mobile-responsive breakpoints
- Command station feel: tighter grid, data-dense panels, monospace accents for IDs/hashes
- Model name displayed in chat header comes from backend (`GET /api/profile`), never hardcoded in JSX

---

## Phase B — Azure DevOps: Work Items

All ADO calls use the `X-DevOps-Token` header (Microsoft OAuth token, no PAT).

Base URL: `https://dev.azure.com/{org}/{project}/_apis`

### View assigned items

```
POST .../wit/wiql?api-version=7.1
{ "query": "SELECT [Id],[Title],[State],[WorkItemType] FROM WorkItems
            WHERE [Assigned To] = @Me AND [State] <> 'Closed'
            ORDER BY [Changed Date] DESC" }
```

`WorkItemCard`: type badge (Story/Bug/Task), state pill, DevOps link.

### Create work item — AI-assisted (all roles)

Type selector defaults by role: SE → Task, QA → Bug, PO → User Story. All types available to all roles.

1. `WorkItemBuilder`: user describes the item, selects type
2. `POST /api/chat/workitem-draft` → Claude returns structured JSON:

```json
{ "type": "Bug", "title": "...", "description": "...", "reproSteps": "...", "tags": ["..."] }
{ "type": "Task", "title": "...", "description": "...", "remainingWork": 4, "tags": ["..."] }
{ "type": "User Story", "title": "...", "description": "...", "acceptanceCriteria": ["..."], "tags": ["..."] }
```

3. Editable preview (fields vary by type) → "Create in DevOps" → `POST .../workitems/${type}?api-version=7.1`

Loading / error / retry pattern applies (see Phase A §4).

### Update state

UX: `WorkItemCard` has a state pill that opens an inline dropdown on click. Valid transitions depend on type:

- Bug: `New → Active → Resolved → Closed`
- User Story: `New → Active → Resolved → Closed`
- Task: `To Do → In Progress → Done`

Dropdown shows only valid next states (not the current one). Selecting a state patches immediately — no confirm step. On success the pill updates in place. On error a `CredErrorBanner`-style inline error appears below the card.

```
PATCH .../workitems/{id}?api-version=7.1
[{ "op": "replace", "path": "/fields/System.State", "value": "{newState}" }]
```

### Add comment

UX: `WorkItemCard` has an expandable comment section at the bottom. Click "Add comment" reveals a textarea + "Post" button. Submitting collapses the section and appends the comment to a comment thread shown inline. On error: inline error + retry.

```
POST .../workitems/{id}/comments?api-version=7.1
{ "text": "..." }
```

---

## Phase C — Microsoft 365 (Graph API)

All routes require `X-Graph-Token` header. Base URL: `https://graph.microsoft.com/v1.0`.

### Outlook Email

| Action | Graph call |
|--------|-----------|
| List unread | `GET /me/messages?$filter=isRead eq false&$top=20` |
| Read full email | `GET /me/messages/{id}` |
| Send / reply | `POST /me/sendMail` |

"Draft Reply with AI": email body → Claude → draft reply JSON → `ComposeModal` → user edits → send.
"New Email": blank `ComposeModal` with optional "Draft with AI" from plain-language description.

### Calendar

| Action | Graph call |
|--------|-----------|
| Week view | `GET /me/calendarView?startDateTime=...&endDateTime=...` |
| Create event | `POST /me/events` |

`EventCard` shows Teams `joinUrl` from `onlineMeeting` field as a "Join" button.

**`NewEventModal`** — full flow:
1. Optional AI prompt textarea at top: "Describe the meeting in plain language"
2. "Draft with AI" → `POST /api/chat/event-draft` with the description → Claude returns `{ title, startTime, endTime, attendees[], description }` as JSON
3. While drafting: skeleton. On error: `ErrorCard` with retry. On success: all fields pre-filled and editable
4. Fields (always visible, editable with or without AI): Title, Date, Start time, End time, Attendees (comma-separated emails), Description textarea, "Add Teams meeting link" checkbox (default on)
5. "Create event" (disabled until title set) → `POST /api/graph/calendar/events`
6. On success: close modal, refresh calendar week view, show toast "Event created"

### Teams

| Action | Graph call | Consent |
|--------|-----------|---------|
| @mentions / chats | `GET /me/chats?$expand=lastMessagePreview` | No |
| Channel messages | `GET /teams/{id}/channels/{id}/messages?$top=10` | No |
| Send to channel | `POST /teams/{id}/channels/{id}/messages` | IT admin |

If `ChannelMessage.Send` scope is absent, "Post to channel" button is disabled and a scope warning banner is shown in both the Teams panel and the modal.

**`SendToChannelModal`** — full flow:
1. Channel dropdown: lists the user's configured channels (up to 3, from `TeamsChannelsJson` in profile)
2. Message textarea — free-form, or polished with AI
3. "Polish with AI" button → `POST /api/chat/message-polish` with `{ message }` → Claude returns improved text → replaces textarea content, editable
4. While polishing: skeleton. On error: `ErrorCard` with retry (user can still post original)
5. Scope warning banner shown at top of modal if `ChannelMessage.Send` not granted; "Post" button disabled
6. "Post to channel" → `POST /api/graph/teams/channels/{teamId}/{channelId}/messages`
7. Preview strip at bottom: "Posting as Dillon Coleman to {Team} · #{channel}"
8. On success: close modal, show toast "Posted to #{channel}"

User configures monitored channels (up to 3) via channel picker in Profile Settings.

---

## Phase D — Repository Access

### File tree browser (`RepoTree`)

`RepoTree` renders a collapsible folder/file tree. It is shared between ADO and GitHub — the data shape is normalized server-side to `{ name, type, path, children? }[]`.

- Top level shows repo root contents on mount
- Clicking a folder expands it (lazy load one level at a time via the file tree API)
- Clicking a file fetches its content (`get_file` API) and opens a read-only code viewer panel inline
- "Pin to chat" icon on each file row → adds file to `PinnedFilesBar` above the chat input
- Loading state: skeleton rows. Error state: inline `ErrorCard` with retry

### Azure DevOps Repos (OAuth token — same as Phase B, no separate PAT)

| Action | API |
|--------|-----|
| List repos | `GET .../git/repositories?api-version=7.1` |
| File tree (one level) | `GET .../repositories/{id}/items?path={path}&recursionLevel=OneLevel` |
| File content | `GET .../repositories/{id}/items?path={path}` |
| List PRs (mine) | `GET .../pullrequests?searchCriteria.reviewerId={me}` |
| Create PR | `POST .../repositories/{id}/pullrequests` |
| Approve / reject | `PUT .../pullrequests/{id}/reviewers/{me}` with `{ "vote": 10 }` |
| Add comment thread | `POST .../pullrequests/{id}/threads` |

**`NewPrModal`** — full flow:
1. Three dropdowns: Repository (from user's ADO + GitHub repos), Source branch (from `GET .../branches`), Into (locked to repo default branch)
2. "Draft with AI" button → `POST /api/chat/pr-draft` with `{ repo, sourceBranch, targetBranch }` → Claude reads recent commits (`GET .../commits?top=10`) and branch name → returns `{ title, body }` as plain JSON (not streamed)
3. While drafting: skeleton (two grey bars). On error: `ErrorCard` with "Try again". On success: title input + markdown body textarea, pre-filled and editable
4. "Open pull request" button (disabled until title + branch set) → `POST /api/devops/repos/{repoId}/pullrequests` or `POST /api/repos/github/{owner}/{repo}/pulls`
5. On success: close modal, refresh PR list, show toast "PR opened"

### GitHub Repos (PAT — `repo` + `pull_request` scopes)

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

- **"Summarize this PR"**: title + description + changed files → Claude → plain-English summary (what changed, why, what to watch). Loading / error / retry pattern applies.
- **"Draft review comment"**: user describes concern → Claude drafts constructive comment → user edits → posts.

---

## Phase E — Codebase Q&A + M365 Q&A (Agentic Tool Use)

The chatbot answers questions about code, emails, and Teams by calling tools server-side. Claude decides what to fetch, retrieves it, and answers from the actual content.

### Example

> **User**: "How does authentication work in this codebase?"
>
> Claude calls `search_code("authentication")` → finds `AuthController.cs`, `JwtTokenService.cs`
> Claude calls `get_file("AgpCommandStation", "Controllers/AuthController.cs")`
> Claude answers citing file paths and line numbers from the real code

### Tools exposed to Claude

**Code tools:**

```typescript
search_code(query: string, repo?: string)
  → { file: string, line: number, snippet: string }[]

get_file(repo: string, path: string)
  → { content: string, language: string, url: string }
  // files >500 lines are truncated with a note

list_directory(repo: string, path: string)
  → { name: string, type: "file" | "folder" }[]
```

**Outlook tools:**

```typescript
search_emails(query: string, top?: number)
  → { id: string, subject: string, from: string, date: string, bodyPreview: string }[]

get_email_thread(messageId: string)
  → { subject: string, messages: { from: string, date: string, body: string }[] }
```

**Teams tools:**

```typescript
search_teams_messages(query: string, channelId?: string)
  → { channel: string, sender: string, date: string, content: string }[]

get_channel_messages(teamId: string, channelId: string, top?: number)
  → { sender: string, date: string, content: string }[]
```

**Example M365 interactions:**
- *"What was the auth decision in #dev-team yesterday?"* → `search_teams_messages("auth decision")`
- *"Summarize the client requirements email thread"* → `search_emails("client requirements")` → `get_email_thread(id)`

### Backend tool loop (`AnthropicChatService`)

1. Send message + tool definitions to Anthropic API
2. If stream emits `tool_use` block → pause → execute tool against ADO/GitHub/Graph → send `tool_result` in new turn
3. Repeat until Claude emits plain text with no pending tool calls
4. Stream final answer to frontend

The loop is entirely server-side. Frontend sees one continuous streaming response.

### System prompt addition (all roles)

```
You have access to AGP codebases, email, and Teams via tools. When asked about
code, use search_code then get_file. When asked about messages or emails, use
search_teams_messages or search_emails. Always cite sources (file path + line,
or sender + date).
```

### Frontend additions

- **`ToolCallIndicator`**: animated status lines between tool calls, delivered as `event: tool_call` SSE events:
  `🔍 Searching code for "authentication"...` → `📄 Reading Controllers/AuthController.cs...`

- **`PinnedFilesBar`**: "Pin to chat" on any file in `RepoTree` → file prepended to every message as context, bypassing tool loop. Shown as dismissible pills above chat input.

---

## Phase F — Global Search (⌘K)

Single search bar in top nav. Searches all sources simultaneously, results grouped by type.

### What gets searched

| Source | What | API |
|--------|------|-----|
| Azure DevOps | Work items | ADO Work Item Search |
| Azure DevOps | Code | ADO Code Search |
| Azure DevOps | Pull requests | ADO PR Search |
| GitHub | Code | GitHub Code Search |
| GitHub | Pull requests | GitHub Issue Search (`is:pr`) |
| Outlook | Emails | Graph unified search |
| Teams | Channel messages | Graph unified search |
| Calendar | Events | Graph calendar search |

### UX

- Click search bar or press `Ctrl+K` → command palette modal (full-width overlay, auto-focused)
- Results fire on keystroke, debounced 300ms
- Grouped sections: **Work Items · PRs · Code · Email · Teams · Calendar**
- Each result: source icon, title, metadata (repo / channel / sender), timestamp
- Click → close palette, navigate to item in its panel
- `Esc` closes without navigating
- Arrow keys + Enter to navigate keyboard-only

### Backend

`GET /api/search?q={query}` — parallel fan-out, 5 results per source max:

```
ADO:    POST https://almsearch.dev.azure.com/{org}/_apis/search/workitemsearchresults
        POST https://almsearch.dev.azure.com/{org}/_apis/search/codesearchresults
GitHub: GET  https://api.github.com/search/code?q={q}+org:{org}
        GET  https://api.github.com/search/issues?q={q}+org:{org}+is:pr
Graph:  POST https://graph.microsoft.com/v1.0/search/query
        { "requests": [{ "entityTypes": ["message","chatMessage","event"],
                          "query": { "queryString": "{q}" } }] }
```

Returns `SearchResult[]`: `{ type, title, subtitle, panelTarget, url }`.

---

## Phase G — Notification Bell

Bell icon in top nav with unread count badge. Opens dropdown with notifications from all sources.

### Triggers

| Trigger | Source |
|---------|--------|
| @mention in Teams | Graph `Chat.Read` |
| PR review requested | ADO / GitHub |
| Work item assigned to you | ADO |
| Work item state change | ADO |
| New unread email | Graph `Mail.Read` |
| Upcoming meeting (≤15 min) | Graph `Calendars.Read` |

### UX

- Amber badge on bell showing unread count
- Click → scrollable dropdown (~400px max-height)
- Each notification: source icon, summary, timestamp, click navigates to item + marks read
- "Mark all as read" at top of panel
- Empty state: "You're all caught up"
- Notifications are session-only (not persisted to DB)

### Backend

`GET /api/notifications` — parallel aggregation from all sources, returns `Notification[]`:
`{ id, type, title, body, panelTarget, timestamp, isRead }`

Polled every 60 seconds from the frontend.

> ⚠️ 60-second polling is a deliberate v1 tradeoff. Real-time notifications would require Azure SignalR or ADO/GitHub webhooks — future enhancement.

---

## Phase H — Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Open global search (Command Palette) |
| `Ctrl+J` | Toggle AI chat panel open/closed |
| `Ctrl+N` | New work item (opens Work Item Builder) |
| `Ctrl+/` | Show keyboard shortcut reference |
| `1` – `5` | Switch tabs (Work Items / Repos / Email / Calendar / Teams) when no input focused |
| `Enter` | Open selected result in Command Palette |
| `↑` / `↓` | Navigate results in Command Palette |
| `Esc` | Close active modal, palette, or drawer |

- Global `keydown` listener in `CommandStation.tsx`, suppressed when focus is inside an input or textarea
- `KeyboardShortcutsModal` shows on `Ctrl+/` — two-column reference card
- Tab number shortcuts dispatch to the same `setActiveTab()` used by the tab nav clicks

---

## Reuse from homework_one

| homework_one | homework_two |
|-------------|-------------|
| `ChatController.cs` SSE pattern | Adapt for Anthropic format + tool use loop |
| `JwtTokenService.cs` | Unchanged |
| `AppDbContext.cs` | Add new ApplicationUser fields + migration |
| `ChatInput`, `MessageList`, `MessageBubble` | Copy unchanged |
| `useChat` hook | Add `tool_call` SSE event handling |
| `apiFetch` helper | Unchanged |

---

## Setup Checklist

### Azure AD app registration (one-time, done by IT or Dillon)

1. Go to portal.azure.com → Azure Active Directory → App registrations → New registration
2. Platform: Single-page application · Redirect URI: `http://localhost:5173`
3. API permissions — add all of the following:

| Permission | Type |
|-----------|------|
| `User.Read` | Delegated |
| `Mail.Read` | Delegated |
| `Mail.Send` | Delegated |
| `Calendars.ReadWrite` | Delegated |
| `Chat.Read` | Delegated |
| `ChannelMessage.Read.User` | Delegated |
| `ChannelMessage.Send` | Delegated — **requires admin consent** |
| Azure DevOps `user_impersonation` | Delegated (add Azure DevOps as an API) |

4. Note the **Tenant ID** and **Client ID** from the app overview page

### Developer machine setup (each developer)

```
cd homework_two/src/AgpCommandStation.Api

dotnet user-secrets set "AzureAd:TenantId"  "<tenant-guid>"
dotnet user-secrets set "AzureAd:ClientId"  "<client-id>"
dotnet user-secrets set "Jwt:Key"            "<32+ random chars>"
dotnet user-secrets set "Encryption:Key"     "<32-byte key>"

dotnet ef database update
```

```
cd homework_two/client
npm install
npx playwright install chromium
```

### Per-user profile setup (via onboarding modal after first login)

- Anthropic API key (`sk-ant-...`)
- Azure DevOps org name + project name (no PAT — auth from Microsoft login)
- GitHub org/username + PAT (`repo`, `pull_request` scopes)
- Teams channels to monitor (up to 3, via channel picker)

---

## Open Questions for Designer / Stakeholders

- **AGP brand colors**: hex values needed for `tokens.css`
- **AGP logo / wordmark**: for the top nav
- **Teams admin consent**: can IT approve `ChannelMessage.Send`?
- **Azure DevOps org + project name**: needed for all ADO API URLs
- **GitHub org name**: needed for repo listing
