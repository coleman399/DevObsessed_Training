# Handoff: Dark Auth + Welcome Flow

## Overview

A dark-mode account creation / sign-in screen that toggles between **Sign up** and **Sign in** on a single page, followed by a **"Welcome, [Name]" greeting screen** with an animated glowing-orbs background.

This is **variant C ("Orbs")** of three concepts explored during design. The HTML prototype in this bundle shows the final selected direction.

> **➕ Chat addendum:** The welcome screen also hosts a Nova chatbot. See **`02_CHAT_ADDENDUM.md`** for the chat surface spec (variant A — "Chat below greeting"). Implement the chat **after** the base welcome screen — same screen, additive.

---

## About the Design Files

The files in this bundle are **design references created in HTML** — interactive prototypes showing intended look and behavior, **not production code to copy directly**.

Your task is to **recreate these designs in the target codebase's existing environment** (React, Vue, SwiftUI, etc.), using its established patterns, component library, and styling conventions. If no codebase / environment exists yet, choose the framework that best fits the project and implement there.

The HTML was built with inline `<style>` blocks and React-via-Babel for prototyping speed. Don't ship that stack — port the visual + behavioral intent into the real app's stack.

## Fidelity

**High-fidelity.** All colors, typography, spacing, animations, and validation behavior in this spec are final. Recreate pixel-perfectly using the codebase's existing libraries and patterns.

---

## Screens

The flow has **two screens** rendered in the same view (no route change — they swap with a fade/blur transition):

### 1. Auth screen (`screen === 'auth'`)

**Purpose:** Let the user sign up or sign in.

**Layout — "Split" card:**
- Centered glassy card, `width: 820px max`, `100% - 64px` on smaller screens.
- Two-column flex inside the card:
  - **Left column** — `flex: 0 0 360px`, `padding: 36px`. Brand mark + name top, tagline middle, version bottom. Background: `linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.01))`, right border `1px solid rgba(255,255,255,.06)`.
  - **Right column** — `flex: 1`, `padding: 36px`. Hosts heading + sub + signup/signin toggle + form fields + submit.
- Card chrome: `background: rgba(18,22,28,.55)`, `backdrop-filter: blur(28px) saturate(140%)`, `border: 1px solid rgba(255,255,255,.08)`, `border-radius: 20px`, `box-shadow: 0 1px 0 rgba(255,255,255,.06) inset, 0 30px 80px rgba(0,0,0,.5)`.
- Card has a "leaving" state: `opacity: 0`, `transform: translateY(-12px) scale(.98)`, `filter: blur(8px)` for the submit→welcome transition (500ms ease).

**Left column copy:**
- Brand mark (28×28 rounded square, accent-color radial gradient with white glint at top-left, soft accent glow)
- Brand name: "Lumen" (or whatever the product is named) — `13px, weight 500`, `rgba(232,236,242,.85)`
- Tagline: *"A quieter place to think, plan, and ship."* — `22px, weight 400, line-height 1.35, letter-spacing -.01em`, `rgba(244,246,250,.9)`. The phrase "think, plan, and ship." is gradient-clipped text: `linear-gradient(110deg, var(--accent), #fff 80%)`.
- Version meta at bottom: `"v2.4 · build 8821"` — `11px uppercase, letter-spacing .14em`, mono font, `rgba(232,236,242,.4)`.

**Right column components:**

- **Heading** — "Create your account" (signup) or "Welcome back" (signin). `28px, weight 500, line-height 1.15, letter-spacing -.02em`, `color: #f4f6fa`.
- **Subhead** — "A few details and your workspace is yours." (signup) / "Sign in to pick up where you left off." (signin). `14px`, `rgba(232,236,242,.55)`, `line-height 1.5`.
- **Mode toggle** — Pill switch with two segments: "Sign up" / "Sign in".
  - Track: `display: inline-flex`, `background: rgba(255,255,255,.04)`, border `1px solid rgba(255,255,255,.06)`, `border-radius: 10px`, `padding: 3px`.
  - Buttons: `font-size: 12.5px, weight 500`, `padding: 7px 14px`, `border-radius: 7px`. Inactive color `rgba(232,236,242,.6)`, active `#0c0f13`.
  - Pill thumb: absolute, `background: linear-gradient(180deg, #ffffff, #d8dde6)`, `box-shadow: 0 1px 2px rgba(0,0,0,.4), 0 0 0 .5px rgba(0,0,0,.1)`. Animates `left` + `width` over `320ms cubic-bezier(.5,.05,.2,1.05)`.
- **Fields** (in order):
  - **Name** (signup only) — leading user icon
  - **Email** — leading mail icon, trailing tick (when valid) or warn icon (on error)
  - **Password** — leading lock icon, trailing eye / eye-off toggle
- **Field styles:**
  - Label above input: `font-size: 11.5px, weight 500, letter-spacing .04em, uppercase`, mono font, `rgba(232,236,242,.55)`, `margin-bottom: 7px`.
  - Input wrap: `background: rgba(255,255,255,.03)`, `border: 1px solid rgba(255,255,255,.08)`, `border-radius: 12px`. Flex row.
  - Input: `padding: 13px 14px`, `font-size: 14.5px`, `color: #f4f6fa`, transparent background, no outline.
  - Icon: `38px` wide, centered, `rgba(232,236,242,.45)`.
  - **Focus state:** wrap border becomes `color-mix(in oklab, var(--accent), transparent 40%)`, background `rgba(255,255,255,.05)`, glow `box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent), transparent 85%), 0 0 22px color-mix(in oklab, var(--accent), transparent 80%)`.
  - **Valid state:** border `color-mix(in oklab, var(--accent), transparent 50%)`, trailing tick icon in accent.
  - **Error state:** border `#ef4d63`, glow `0 0 0 3px rgba(239,77,99,.18)`, error icon in `#ef4d63`.
- **Field meta row** (under each field, `font-size: 11.5px`, mono, `min-height: 16px`):
  - Hint text "We'll never share it." (`rgba(232,236,242,.4)`) or "Looks good" when valid.
  - Error text `#ff7a8c` with a 250ms `shakeIn` keyframe (translateX -3, +3, -2, 0).
- **Password strength meter** (signup only, when password has any chars):
  - 4 horizontal bars (flex:1, 3px tall, 2px radius, `rgba(255,255,255,.08)` empty).
  - Filled colors by strength: 1→`#ef4d63`, 2→`#f59e3c`, 3→`#eab308`, 4→accent (with glow `0 0 8px`).
  - Label right-aligned: `weak` / `fair` / `good` / `strong` in mono `11px`.
- **Caps lock warning** — appears below password when caps is on. Icon + text in `#f5b94a`, `11px`, mono, with a 200ms fadeUp.
- **Remember me + Forgot** (signin only) — checkbox left, link right. Checkbox is a 14×14 rounded square that fills with accent when checked, white check mark inside.
- **Submit button:**
  - Full width, `padding: 13px`, `border-radius: 12px`.
  - Background: `linear-gradient(180deg, #ffffff 0%, #d8dde6 100%)`, with a radial overlay of accent at top.
  - Text color `#0c0f13`, `14px, weight 500`. Right-pointing arrow icon that shifts +3px on hover.
  - Loading state: spinner (14×14 ring, `border-top-color: #0c0f13`, 0.7s linear spin) + "Creating account…" / "Signing in…" text.
  - Disabled (form invalid): `filter: saturate(.6) brightness(.85)`.
- **Legal copy** (signup only) — below submit, `11px`, `rgba(232,236,242,.32)`, centered: "By continuing you agree to our Terms and Privacy."
- **Swap link** — `text-align: center, font-size: 13px`, `rgba(232,236,242,.5)`. "Already have an account? Sign in" / "New here? Create an account". Link has a `1px` underline border-bottom in `rgba(255,255,255,.25)` that becomes `#fff` on hover.

### 2. Welcome screen (`screen === 'welcome'`)

**Purpose:** Greet the user by name. **Pure greeting moment — no CTAs.**

**Layout — "Split" welcome:**
- Centered grid, `max-width: 1080px`, 2 columns `1fr 1fr`, gap `60px`, vertical-center.
- **Left:** eyebrow chip, big title, subtext.
- **Right:** "Today, in your space" list, separated by a left border `1px solid rgba(255,255,255,.08)` with `padding-left: 48px`.

**Top-left corner:** `w-time` block
- Position: absolute, `top: 24px`, `left: 28px`.
- Format: `[pulsing dot] 11:39 AM · Good morning` (time is real, greeting changes by hour: <5 "Good night", <12 "Good morning", <17 "Good afternoon", <21 "Good evening", else "Good night").
- Style: `11px uppercase, letter-spacing .14em`, mono, `rgba(232,236,242,.45)`. Dot is `5×5` accent with `0 0 6px` glow.

**Top-right corner:** sign-out link
- `position: absolute, top: 24px, right: 28px`.
- Button: `"Sign out ↗"`, `11.5px`, mono, `rgba(232,236,242,.5)`, padding `6px 10px`, border-radius `6px`. Hover fills with `rgba(255,255,255,.06)` and color `#fff`. Clicking returns to the auth screen and clears the password field.

**Eyebrow chip** (above title)
- "● Session active" — `11px uppercase, letter-spacing .2em`, mono, `rgba(232,236,242,.55)`.
- Pill: `padding: 7px 14px`, `background: rgba(255,255,255,.04)`, border `1px solid rgba(255,255,255,.08)`, `border-radius: 999px`, `backdrop-filter: blur(20px)`.
- Dot: `6×6`, accent color, glow `0 0 8px`, 2s ease-in-out `pulse` animation (opacity .6 ↔ 1).

**Title** — the centerpiece
- Container: flex column, items-start (split variant) or items-center (centered variant).
- Two lines:
  - **Line 1:** "Welcome,"
    - `font-size: clamp(56px, 9vw, 128px)`, `weight: 400`, `line-height: .95`, `letter-spacing: -.04em`.
    - Color `#f5f7fb`.
    - **Entry animation:** `opacity 0 → 1`, `translateY(24px) → 0`, `filter: blur(12px) → 0`. Duration `1.1s cubic-bezier(.16,.84,.32,1)`, delay `0.2s`.
  - **Line 2:** "[FirstName]." (with the period!)
    - Same font size, `weight: 300`, `font-style: italic`.
    - Color: gradient-clipped — `linear-gradient(180deg, #ffffff 0%, color-mix(in oklab, var(--accent), #ffffff 40%) 100%)`.
    - **Entry animation:** same as line 1 but `1.2s` duration, `0.6s` delay (so it lands shortly after "Welcome,").

**Sub text** (split + centered variants)
- `margin-top: 22px`, `font-size: 15px`, `rgba(232,236,242,.55)`, `line-height: 1.5`.
- Copy: *"We're glad you're here. Your workspace is `ready` — pick up where you left off, or start something new."* (the word "ready" is in the mono font, color `rgba(232,236,242,.75)`).
- Entry: `1s ease`, delay `1.1s`.

**Right column — "Today, in your space" list**
- Heading: "TODAY, IN YOUR SPACE" — `11px uppercase, letter-spacing .16em, weight 500`, mono, `rgba(232,236,242,.4)`.
- Body color `rgba(232,236,242,.55)`, `13px`, `line-height 1.7`.
- Items, each row flex space-between, with `border-bottom: 1px dashed rgba(255,255,255,.08)` and `padding-bottom: 10px`. The right value is `rgba(232,236,242,.85)`.
  - Drafts · 3
  - Pending invites · 1
  - Workspace · `[firstName-lowercase]-hq` (mono)
  - Plan · Free · trial

(Note: the list is intentionally minimal — it's atmosphere, not a real dashboard. The actual data should come from the user's real workspace state when implementing.)

---

## Background ("Orbs")

The single most distinctive piece. Rendered as a `position: absolute; inset: 0; overflow: hidden` element behind everything.

**Base layer (`.bg-root`):**
```css
background: radial-gradient(120% 90% at 50% 0%, #10151c 0%, #06080b 60%, #04060a 100%);
```

**Vignette layer** — covers `inset: 0`, three stacked radial gradients:
```css
background:
  radial-gradient(60% 80% at 50% 50%, transparent 0%, rgba(0,0,0,.55) 100%),
  radial-gradient(120% 60% at 50% 110%, var(--c1) 0%, transparent 55%),
  radial-gradient(100% 60% at 50% -10%, var(--c2) 0%, transparent 50%);
```
The first darkens edges. The second blooms accent-derived color up from the bottom. The third blooms a hue-shifted color down from the top.

**Grid overlay:**
```css
background-image:
  linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px),
  linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px);
background-size: 64px 64px;
opacity: .08;
mask-image: radial-gradient(60% 50% at 50% 50%, #000, transparent);
```
A faint perspective-feel grid that fades to transparent at the edges.

**Orbs** — 6 always-on + 4 welcome-only:
- Each: `position: absolute, border-radius: 50%, opacity: 0`.
- Background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,.95), var(--c3) 35%, transparent 70%)`.
- Glow: `box-shadow: 0 0 60px var(--c3), 0 0 120px var(--c3)`.
- Animation: `orbRise` — translateY from `8%` to `-110%`, X drift `--dx`, opacity `0 → .9 → 0`. Linear, infinite.

Always-on orbs (left%, size px, duration s, delay s, dx%):
```
12%, 140, 18s, 0s,  4%
28%,  80, 22s, 3s, -3%
46%, 200, 28s, 1s,  2%
62%, 110, 20s, 5s, -2%
78%, 160, 26s, 2s,  5%
88%,  90, 24s, 4s, -4%
```

Welcome-only orbs (faster + smaller, appear only when `data-state="welcome"`):
```
20%, 60, 10s, 0s,  8%
40%, 50, 11s, 1s, -6%
70%, 70, 13s, 2s,  4%
55%, 40,  9s, 0.5s, -3%
```

**Palette derivation:** the orb colors come from a `palette(accentHex)` function that parses the accent to HSL and produces three complementary stops by rotating hue (+60°, -50°, +140°) at fixed saturation/lightness. See `backgrounds.jsx`. With the mint default (`#22d3a8`), you get a teal/blue-green/violet trio.

---

## Interactions & Behavior

### Mode toggle (Sign up ↔ Sign in)
- Pill slides between segments (320ms cubic-bezier).
- Form fields fade + translate down 8px during swap (220ms). Mode actually changes mid-fade so the heading/subhead/field set updates seamlessly.
- Error state clears on mode change.

### Email validation
- Regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.
- Only shows error after blur (i.e., `emailTouched` is true) AND has content AND isn't valid.
- Shows tick + "Looks good" when valid.

### Password strength
- 0: empty. 1: length ≥ 6. +1 for length ≥ 10. +1 for both upper + lower. +1 for digit + special char.
- Capped at 4.
- Meter and label only show on signup.

### Show / hide password
- Eye / eye-off icon at trailing edge of password field. `tabIndex: -1` so it doesn't steal focus.

### Caps lock detection
- On password input's `keydown` and `keyup`, check `e.getModifierState('CapsLock')` and toggle the warning row.

### Submit
- Disabled unless: valid email + password ≥ 6 chars + (on signup) name present + not loading.
- On click: 1100ms simulated delay. If signing in and password contains "wrong", surface error "That doesn't match our records." Otherwise: trigger "leaving" state on the card (fade + translate + blur, 350ms), then swap `screen` to `'welcome'`.
- During load: spinner + "Creating account…" / "Signing in…".

### Welcome reveal
- Card finishes its leave transition (350ms), then screen swaps.
- Background's `data-state` flips to `"welcome"`, fading in the 4 extra orbs.
- Title lines fade + un-blur + slide up in sequence (Welcome, at 0.2s; Name at 0.6s).
- Sub text at 1.1s, time/sign-out at 1.6s.

### Sign out (welcome screen)
- Returns to auth screen, clears password and any error/touched flags. Email + name are preserved.

---

## State

```ts
type Screen = 'auth' | 'welcome';
type Mode = 'signin' | 'signup';
type Strength = 0 | 1 | 2 | 3 | 4;

interface AuthState {
  screen: Screen;
  mode: Mode;
  swapping: boolean;        // 220ms transition between signup/signin
  leaving: boolean;         // 350ms transition into welcome screen

  name: string;             // signup only
  email: string;
  password: string;

  emailTouched: boolean;    // for late-validation
  pwTouched: boolean;
  showPw: boolean;
  caps: boolean;
  remember: boolean;        // signin only

  loading: boolean;
  error: string | null;
}
```

Derived (recompute every render):
- `emailValid` — regex above
- `pStrength` — algorithm above
- `eShowError = emailTouched && email && !emailValid`
- `pwError = pwTouched && password && password.length < 6`
- `canSubmit` — see above
- `finalName` — `(mode === 'signup' && name.trim()) ? name.trim().split(' ')[0] : deriveName(email)`
  - `deriveName(email)`: take local-part, replace `[._-]+` with space, title-case each word, fallback "friend".

---

## Design tokens

```
--accent:           #22d3a8   /* mint/teal */
--bg-base:          near-black radial (#10151c → #04060a)
--text-primary:     #f4f6fa
--text-secondary:   rgba(232,236,242,.55)
--text-tertiary:    rgba(232,236,242,.4)
--text-quaternary:  rgba(232,236,242,.32)

--surface-glass:    rgba(18,22,28,.55) + backdrop-filter blur(28px) saturate(140%)
--surface-input:    rgba(255,255,255,.03)
--surface-input-focus: rgba(255,255,255,.05)
--surface-hover:    rgba(255,255,255,.06)

--border-subtle:    rgba(255,255,255,.06)
--border-default:   rgba(255,255,255,.08)
--border-input:     rgba(255,255,255,.08)
--border-strong:    rgba(255,255,255,.14)

--error:            #ef4d63
--error-text:       #ff7a8c
--warn:             #f5b94a
--strength-1:       #ef4d63
--strength-2:       #f59e3c
--strength-3:       #eab308
--strength-4:       var(--accent)

--radius-sm:        6px
--radius-md:        10px
--radius-lg:        12px
--radius-xl:        20px

--font-sans:        'Geist', ui-sans-serif, system-ui
--font-mono:        'Geist Mono', ui-monospace, monospace

--space:            14px / 18px / 24px / 36px (form field gap / row spacing / card sections / column padding)

--ease-pill:        cubic-bezier(.5, .05, .2, 1.05)
--ease-reveal:      cubic-bezier(.16, .84, .32, 1)
--ease-out-soft:    cubic-bezier(.2, .7, .3, 1)
```

---

## Animations summary

| Element | Property | Duration | Easing | Trigger |
|---|---|---|---|---|
| Toggle pill | left, width | 320ms | `cubic-bezier(.5,.05,.2,1.05)` | mode change |
| Form swap | opacity, translateY | 220ms | ease | mode change |
| Field focus glow | border, box-shadow, background | 200ms | ease | focus |
| Error shake | translateX | 250ms | `cubic-bezier(.36,.07,.19,.97)` | error first appears |
| Caps fadeUp | opacity, translateY | 200ms | ease | caps on |
| Submit spinner | rotate | 700ms | linear infinite | loading |
| Card leaving | opacity, translateY, blur | 500ms | `cubic-bezier(.2,.7,.3,1)` | submit success |
| Welcome title L1 | opacity, translateY, blur | 1100ms (delay 200) | `cubic-bezier(.16,.84,.32,1)` | screen=welcome |
| Welcome title L2 | opacity, translateY, blur | 1200ms (delay 600) | `cubic-bezier(.16,.84,.32,1)` | screen=welcome |
| Welcome sub | opacity, translateY, blur | 1000ms (delay 1100) | ease | screen=welcome |
| Welcome time/signout | opacity | 1000ms (delay 1600) | ease | screen=welcome |
| Eyebrow dot pulse | opacity | 2000ms | ease-in-out infinite | screen=welcome |
| Orb rise | translateY, translateX, opacity | per-orb (9–28s) | linear infinite | always |

---

## Assets

No external image assets. All visuals are CSS gradients, SVG icons (inline), and Google-Fonts-served typography.

**Icons used** (16×16 stroke `1.4`, currentColor):
- mail (envelope outline)
- lock (padlock outline)
- user (head + shoulders)
- eye / eye-off
- tick (checkmark, stroke `1.8`)
- warn (circle with !)
- arrow-right (for submit + sign-out)
- caps (up-arrow above line)

Use the codebase's existing icon library (Lucide, Heroicons, Phosphor, etc.) for these — don't ship the inline SVGs as-is.

**Fonts:**
- Geist 300/400/500/600 — Google Fonts.
- Geist Mono 400/500 — Google Fonts.

---

## Implementation notes

- The two screens swap in-place; do not route to a separate page. The shared `.app` container is what gives the entrance animation continuity.
- The background is **always rendered**, regardless of screen. Only its `data-state` attribute changes.
- All accent-derived effects use `color-mix(in oklab, var(--accent), …)` — keep using `color-mix` so changing the accent variable cascades through the whole UI.
- The card's `backdrop-filter: blur(28px) saturate(140%)` is essential for the glassy look — make sure the implementation supports it on the target platforms. Provide `-webkit-backdrop-filter` for Safari.
- All text colors are `rgba(232,236,242, x)` — not pure white — to keep the dark surface from feeling harsh.
- For accessibility: keep focus rings visible (the accent glow is the focus indicator), provide proper `aria-label` on the eye toggle, mark the password caps warning with `role="status"` or `aria-live="polite"`, and ensure the toggle is keyboard-navigable (it's a `role="tablist"` in the prototype).
- The prototype's auth is faked. Implement real auth (Supabase / Clerk / Auth.js / your own backend) — keep the same field set, validation rules, and error → recovery surface.

---

## Files in this bundle

- `Welcome Flow.html` — entry point. Loads React + Babel, mounts the design-canvas with three variants. **Variant C ("Orbs") is the selected direction.**
- `auth-app.jsx` — `<AuthApp>` component: full auth + welcome flow with state, validation, and transitions.
- `backgrounds.jsx` — `<AuroraBg>`, `<MeshBg>`, `<OrbsBg>` — three background treatments. **Use `<OrbsBg>` only.**
- `design-canvas.jsx`, `tweaks-panel.jsx` — design-tool scaffolding for the in-prototype variant picker / Tweaks panel. **Not needed in production** — ignore.

To see the design in motion: open `Welcome Flow.html` in a browser, focus into card **C · Orbs**, then sign up (any email, any 6+ char password, any name) to see the auth → welcome transition.
