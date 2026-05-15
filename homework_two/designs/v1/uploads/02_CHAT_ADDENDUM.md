# Addendum: Nova Chatbot on the Welcome Screen

> Reads as a continuation of `README.md`. Same design system, same Orbs background, same accent + typography tokens. Only the welcome screen changes.

## What changes

The welcome screen is no longer a pure greeting. After the title reveals, a **chat surface fades in beneath it** so the user can immediately ask the assistant (named **Nova**) anything. The right column hosts the existing "Today" panel **plus a "Recent conversations" list** so returning users can resume past threads.

The screen now has three regions:

```
┌─────────────────────────────────────────────────────────────┐
│  ● 11:41 AM · Good morning                       Sign out ↗ │  ← unchanged corner chrome
│                                                              │
│  ● SESSION ACTIVE                                            │
│                                                              │
│  Welcome,                              ┌──────────────────┐ │
│  Dillon.                               │ TODAY, IN YOUR   │ │
│                                        │ SPACE            │ │
│  We're glad you're here. Ask Nova      │                  │ │
│  anything — or pick up where you       │ Drafts        3  │ │  ← right column
│  left off.                             │ Pending inv.  1  │ │     UNCHANGED
│                                        │ Workspace  …-hq  │ │
│  ┌─ Nova ───────────────────────┐      │ Plan       Free  │ │
│  │ Hey Dillon, what are we      │      └──────────────────┘ │
│  │ working on first?            │                            │
│  └──────────────────────────────┘                            │
│                                                              │
│  ┌──────────────────────────────────────────────┐            │
│  │ Ask Nova anything…                       [→] │            │  ← composer
│  └──────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

This is **placement variant A — "Chat below greeting"**, the selected direction.

---

## Layout

The welcome screen uses a CSS grid:

```css
position: absolute; inset: 0;
padding: 80px 60px 48px;
display: grid;
grid-template-columns: minmax(0, 1fr) 280px;
gap: 48px;
align-items: start;
```

- **Left column** (flexible): vertical stack — eyebrow → title → sub → chat header → chat thread → composer. The chat fills remaining vertical space.
- **Right column** (280px fixed): the **Side panel** — "Today, in your space" on top, then "Recent conversations" below. Top-aligned with `margin-top: 48px` so it balances against the title.
- The right column has `border-left: 1px solid rgba(255,255,255,.08)` + `padding-left: 32px` so it reads as a distinct rail.
- 28px gap between the sub text and the chat surface.

The chat surface in this placement does **not** have its own card chrome — it sits directly on the dark background. The bubbles + composer provide all the visual weight.

---

## Multi-conversation support

This is the part that reconciles with the `Conversations` + `ChatMessages` schema in the backend plan. The welcome screen exposes three pieces tied to the conversations list:

1. **Chat header** — a thin row above the thread with the active conversation title on the left and a `+ New` button on the right.
2. **Active conversation thread** — the bubbles in the middle reflect whichever conversation `activeId` points at. Switching `activeId` swaps the messages instantly.
3. **Recent conversations list** — in the right rail under "Today". Click any entry to make it active.

### Chat header

```
● NEW CONVERSATION                        [+ New]
```

- Container: `display: flex`, space-between, `gap: 12px`, `margin-bottom: 12px`.
- **Title side**: small accent dot (5×5, `box-shadow: 0 0 6px var(--accent)`) + label. Label is `font-size: 11px`, mono, uppercase, `letter-spacing: .16em`, `rgba(232,236,242,.45)`. Truncates with ellipsis if long.
- **New button**: `padding: 6px 10px 6px 8px`, `border-radius: 8px`, mono `11.5px`. Icon (plus, 12×12, stroke 1.6) + label "New". `background: rgba(255,255,255,.04)`, `border: 1px solid rgba(255,255,255,.08)`, `color: rgba(232,236,242,.7)`. On hover: lighter background, brighter color, brighter border.
- Tooltip: "Start a new conversation".

### Recent conversations list

Lives inside the right column, **below** the "Today, in your space" block with a 28px top margin.

- **Header**: `RECENT CONVERSATIONS` + count. Same type style as the "Today" panel heading (mono `11px`, uppercase, `letter-spacing: .16em`, `rgba(232,236,242,.4)`, weight 500). Count is in mono `rgba(232,236,242,.3)`, right-aligned.
- **Limit on welcome screen**: render at most **5 items**, sorted by `updatedAt` desc. "See all" navigates to the full workspace conversation view (out of scope here — the prototype omits this link).
- **Each row**:
  - Button, full-width, transparent background, left-aligned.
  - `padding: 8px 10px`, `margin: 0 -10px` (so hover bleeds into the rail), `border-radius: 8px`.
  - Two stacked lines:
    - **Title** — `font-size: 12.5px`, weight 500, `rgba(232,236,242,.7)`, single line, ellipsized.
    - **Meta** — relative time like "42m ago" / "6h ago" / "1d ago". `font-size: 10.5px`, mono, uppercase, `letter-spacing: .04em`, `rgba(232,236,242,.4)`.
  - **Hover**: `background: rgba(255,255,255,.04)`, text becomes `#fff`.
  - **Active** (current `activeId`): `background: rgba(255,255,255,.05)`, text `#fff`, plus a 2px accent-colored inset shadow on the left (`box-shadow: inset 2px 0 0 var(--accent)`) and tighter left border-radius.

### Relative-time formatter

```js
function relativeTime(d) {
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60)        return 'just now';
  if (diff < 3600)      return Math.floor(diff/60) + 'm ago';
  if (diff < 86400)     return Math.floor(diff/3600) + 'h ago';
  if (diff < 86400 * 7) return Math.floor(diff/86400) + 'd ago';
  return d.toLocaleDateString([], {month:'short', day:'numeric'});
}
```

### Empty-stub rule

A freshly-created conversation (no user turns yet) is **never** shown in the recents list. The list is filtered by `userTurnsCount > 0` — both the active stub and any abandoned stubs are excluded. They only enter the list once the user sends their first message. This avoids a confusing "New conversation" entry appearing in history after a `+ New` click.

---

## The Chat Surface

### Anatomy

```
.wc-chat
  .wc-thread          ← scrollable message list
    .wc-msg.bot
      .wc-byline      ← "● Nova" — only on the first bot message
      .wc-bubble
    .wc-msg.user
      .wc-bubble
    .wc-msg.bot (typing)
      .wc-typing      ← ••• animated dots
  .wc-composer        ← textarea + send button
```

### Sizes & spacing

- `.wc-chat` — flex column, fills remaining height in the left column. Fades in 1.5s after mount.
- `.wc-thread` — `flex: 1`, `overflow-y: auto`, `max-height: 240px` (so the composer always stays in view as the thread grows). Custom thin scrollbar (`6px`, `rgba(255,255,255,.12)`).
- Gap between messages: `10px`.
- `padding: 4px 4px 14px` on the thread.

### Message bubbles

Both roles share `padding: 10px 14px`, `border-radius: 14px`, `font-size: 13.5px`, `line-height: 1.5`, `max-width: 78%`.

**Bot bubbles (left-aligned, classic chat):**
```css
background: rgba(255, 255, 255, 0.05);
border:     1px solid rgba(255, 255, 255, 0.08);
color:      rgba(244, 246, 250, 0.95);
border-bottom-left-radius: 4px;
backdrop-filter: blur(20px);
```
The 4px corner cut on the bottom-left gives the conversational "tail" feel without an actual arrow.

**User bubbles (right-aligned, accent-tinted):**
```css
background: color-mix(in oklab, var(--accent), #0c0f13 25%);
color:      #0c0f13;
border-bottom-right-radius: 4px;
font-weight: 500;
box-shadow:  0 4px 16px color-mix(in oklab, var(--accent), transparent 70%);
```
Accent color slightly darkened so dark text is readable; soft accent glow underneath.

**Entrance animation** — every new message:
```css
@keyframes wcMsgIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
animation: wcMsgIn .35s cubic-bezier(.2, .7, .3, 1);
```

### Bot byline (first message only)

```
● Nova
```
- `.bot-mark`: 14×14 rounded-4px square, accent radial gradient with the same shape as the brand mark from auth screen, glowing softly.
- Text: `font-size: 10.5px`, `letter-spacing: .12em`, uppercase, mono, `rgba(232,236,242,.45)`.
- Sits above the first bot bubble only. Subsequent bot bubbles render without it.

### Typing indicator (when waiting for a reply)

Rendered as a bot bubble with no padding, containing three dots:
```css
.wc-typing { padding: 14px 16px; gap: 4px; }
.wc-typing i {
  width: 6px; height: 6px; border-radius: 50%;
  background: rgba(232, 236, 242, 0.55);
  animation: wcDot 1.2s ease-in-out infinite;
}
.wc-typing i:nth-child(2) { animation-delay: 0.15s; }
.wc-typing i:nth-child(3) { animation-delay: 0.3s; }
@keyframes wcDot {
  0%, 80%, 100% { transform: translateY(0);   opacity: .4; }
  40%           { transform: translateY(-3px); opacity:  1; }
}
```

### Composer

```css
.wc-composer {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  background: rgba(18, 22, 28, 0.5);
  border:     1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 8px 8px 8px 16px;
  backdrop-filter: blur(24px) saturate(140%);
}
.wc-composer:focus-within {
  border-color: color-mix(in oklab, var(--accent), transparent 50%);
  background:   rgba(18, 22, 28, 0.65);
  box-shadow:
    0 0 0 3px color-mix(in oklab, var(--accent), transparent 85%),
    0 0 32px  color-mix(in oklab, var(--accent), transparent 80%);
}
```

- **Textarea:** transparent, no border, `font-size: 14px`, `line-height: 1.5`, `padding: 8px 0`, `resize: none`, `max-height: 140px`. Auto-grows from 1 row up to 140px (then scrolls). Placeholder: "Ask Nova anything…" in `rgba(232,236,242,.32)`.
- **Send button:** `36×36`, `border-radius: 10px`, `linear-gradient(180deg, #fff, #d8dde6)` background, dark `#0c0f13` icon, soft accent glow underneath. `transform: scale(.95)` on `:active`. Disabled when input is empty or while waiting for a reply — `filter: saturate(.4) brightness(.7)`, no shadow, cursor not-allowed.

### Send icon
A simple right-arrow: stroke `1.8`, viewBox `0 0 16 16`, path `M2 8h11M9 4l4 4-4 4`.

---

## Behavior

### Initial state
- First-time chat seed message:
  ```
  Hey [FirstName], what are we working on first?
  ```
- The `[FirstName]` is the first space-separated token of the user's name (`name.split(' ')[0]`), with the same fallback as the welcome title: `"friend"` if no name.

### Sending a message
- **Enter** sends. **Shift + Enter** inserts a newline.
- On send: append the user message → clear the input → set `typing: true` → call the model → append the reply → set `typing: false`.
- If the call throws, surface a soft error bubble:
  > "I'm offline at the moment — try again in a sec."
- Autoscroll the thread to the bottom on every change to `messages` or `typing`.

### Auto-grow textarea
On every input change:
```js
ta.style.height = 'auto';
ta.style.height = Math.min(140, ta.scrollHeight) + 'px';
```

### Disabling send
`disabled = !input.trim() || typing`. Visually dimmed (`filter: saturate(.4) brightness(.7)`), cursor `not-allowed`, no glow.

---

## Model

The prototype uses the host's built-in helper. **In your repo, swap this for a real API call** — Anthropic SDK, OpenAI, your backend — and stream the response if your client supports it.

### Prompting

System prompt template (interpolate `firstName` server-side):

```
You are Nova, a calm and concise assistant inside the Lumen workspace.
The user's name is {firstName}.
Reply in 1–2 short sentences. Warm but never effusive. Never use exclamation marks.
Plain prose only — no markdown, no lists, no headers.
```

### Conversation contract

The prototype sends the entire transcript as a single formatted prompt for simplicity:

```
Conversation so far:
Nova: Hey Dillon, what are we working on first?
Dillon: What's on my plate today?
Nova: You've got three drafts open and one pending invite to review.

Reply as Nova:
```

In production, use the proper messages array format your API expects (`role: "user" | "assistant"`, alternating). Keep the system prompt above the message list.

### Response handling

- Trim whitespace.
- Strip any leading `Nova:` prefix the model might echo back (`reply.replace(/^Nova:\s*/i, '')`).
- If the reply is empty, fall back to `"I'm here."`

### Recommended limits

- Output cap: **1024 tokens** (replies should be terse anyway).
- Model: Claude Haiku is fine; the persona is light-conversation.
- Rate limit: per-user, ~60 messages/min.

### What Nova should NOT do

- Never use exclamation marks.
- No markdown, headers, or bullet lists in replies.
- Never address the user as anything but their first name.
- Don't sign off ("- Nova", "Best,"). Just reply.

---

## Animation timing (welcome → chat reveal)

| Element              | Delay   | Duration | Animation                          |
|----------------------|---------|----------|------------------------------------|
| Title line 1         | 0.15s   | 0.9s     | translateY + blur                  |
| Title line 2 (name)  | 0.45s   | 1.0s     | translateY + blur (italic gradient)|
| Sub text             | 0.85s   | 0.8s     | translateY + blur                  |
| Time + Sign-out      | 1.1s    | 0.8s     | translateY + blur                  |
| "Today" right column | 1.1s    | 0.8s     | translateY + blur                  |
| Chat surface (Nova)  | **1.5s**| 1.0s     | translateY + blur                  |

The chat is the **last thing to appear** — the user feels welcomed *first*, then Nova arrives as if walking into the room.

---

## State

The welcome screen is a thin client over the `Conversations` + `ChatMessages` tables on the backend. It needs:

```ts
interface ChatMessage {
  role: 'bot' | 'user';
  text: string;
  // server-side fields (id, createdAt, etc) are added when persisted
}

interface Conversation {
  id: string;
  title: string;            // "New conversation" until the first user turn
  messages: ChatMessage[];
  updatedAt: Date;          // for sorting + relative-time display
  userTurnsCount?: number;  // local hint for the empty-stub filter
}

interface WelcomeState {
  conversations: Conversation[];   // sorted desc by updatedAt
  activeId: string;
  input: string;                   // composer textarea
  typing: boolean;                 // dots indicator + disabled send
}
```

### Data flow

1. **On welcome screen mount:**
   - `GET /conversations` → hydrate the recents list. Set `userTurnsCount` based on each conversation's messages (or have the server return it).
   - Locally **prepend a fresh `Conversation` stub** with `title: 'New conversation'`, `userTurnsCount: 0`, and one seeded bot message: `"Hey ${firstName}, what are we working on first?"`. Don't POST it yet — it's a stub.
   - Set `activeId` to that stub.

2. **On user's first message in a stub conversation:**
   - `POST /conversations` to materialize it on the server — reply gives you a real id; reconcile your local id.
   - `POST /conversations/:id/messages` for the user message. Increment `userTurnsCount` locally.
   - Stream / await the assistant reply, then `POST /conversations/:id/messages` for the bot message.
   - Locally: bump `updatedAt`, and rederive `title` from the first user message (see below).

3. **On `+ New` click:**
   - Locally prepend a new stub (don't POST yet). Swap `activeId` to it. Same lazy-materialize pattern.
   - The previously-active conversation, if it had user turns, stays in `conversations` and is now visible in the recents list.
   - The previously-active conversation, if it was an empty stub, is **left in `conversations`** but excluded from recents by the `userTurnsCount > 0` filter. (Optional: garbage-collect abandoned stubs on unmount.)

4. **On recent entry click:**
   - If the conversation's messages aren't loaded yet (you stored only `{id, title, updatedAt}` from the list endpoint), `GET /conversations/:id` to lazy-load.
   - Swap `activeId`.

### Title derivation

When the user sends their **first** turn in a conversation whose title is still `"New conversation"`:

```js
function deriveTitle(firstUserMessage) {
  const t = firstUserMessage.trim().replace(/\s+/g, ' ');
  if (t.length <= 38) return t;
  return t.slice(0, 36).trimEnd() + '…';
}
```

Optionally upgrade this server-side once a conversation has 3–4 turns with a one-sentence summarization pass. The welcome screen picks up the new title on its next list fetch.

### Backend endpoints assumed

| Method | Path | Returns |
|---|---|---|
| `GET`   | `/conversations`          | `[{id, title, updatedAt, messageCount}]` — last ~20 |
| `GET`   | `/conversations/:id`      | `{id, title, updatedAt, messages: [...]}` |
| `POST`  | `/conversations`          | `{id, title: "New conversation", …}` |
| `PATCH` | `/conversations/:id`      | `{title}` — to persist derived/edited titles |
| `POST`  | `/conversations/:id/messages` | `{id, role, text, createdAt}` |
| `DELETE` | `/conversations/:id`     | `204` — not exposed on welcome, but in the broader app |

The welcome screen only uses the first two on mount and POSTs lazily. Streaming the assistant reply via SSE is recommended but optional — the prototype simulates with a single await.

State is **client-side only** for the welcome moment — once the user navigates to the full workspace chat view, hand off `conversations` + `activeId` to the workspace-level store so the session continues seamlessly.

---

## Accessibility

- The composer's textarea should have an associated label ("Ask Nova anything") or `aria-label`.
- The send button has `aria-label="Send"`.
- The thread should announce new bot messages — wrap it in `role="log"` `aria-live="polite"` so screen readers pick them up.
- Maintain focus order: textarea ↔ send. Don't trap focus inside the thread.
- Hitting Esc on the textarea could optionally clear it, but is not implemented in the prototype.

---

## Files in this bundle (chat-specific)

- `Welcome + Chat.html` — design canvas with all three placement variants. **Variant A ("below") is the chosen direction.**
- `welcome-chat.jsx` — `<WelcomeChat>` and `<ChatSurface>` components. The reference implementation. Ignore variants B (`placement="beside"`) and C (`placement="dock"`) — they're there for the design exploration only.

The chat surface reuses the same Orbs background (`backgrounds.jsx`) and the same accent/font/spacing tokens documented in the main `README.md`. No new tokens needed.
