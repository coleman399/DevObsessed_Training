// welcome-chat.jsx — Welcome screen with a Nova chatbot, three placements.
// Real AI replies via window.claude.complete.

const __WCHAT_STYLE = `
.wc-app{position:relative;width:100%;height:100%;color:#e8ecf2;
  font-family:'Geist',ui-sans-serif,system-ui,sans-serif;
  letter-spacing:-.005em;overflow:hidden;isolation:isolate;
  background:#04060a}
.wc-app *{box-sizing:border-box}
.wc-mono{font-family:'Geist Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums}

/* shared welcome bits */
.wc-eyebrow{display:inline-flex;align-items:center;gap:10px;font-size:11px;letter-spacing:.2em;
  text-transform:uppercase;color:rgba(232,236,242,.55);
  font-family:'Geist Mono',ui-monospace,monospace;
  padding:7px 14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
  border-radius:999px;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
.wc-eyebrow .dot{width:6px;height:6px;border-radius:50%;background:var(--accent);
  box-shadow:0 0 8px var(--accent);animation:wcPulse 2s ease-in-out infinite}
@keyframes wcPulse{0%,100%{opacity:.6}50%{opacity:1}}

.wc-title{font-weight:400;line-height:.95;letter-spacing:-.04em;margin:0;color:#f5f7fb;
  display:flex;flex-direction:column;align-items:flex-start;gap:0}
.wc-title .l1{opacity:0;transform:translateY(20px);filter:blur(10px);
  animation:wcReveal .9s cubic-bezier(.16,.84,.32,1) .15s forwards}
.wc-title .l2{opacity:0;transform:translateY(22px);filter:blur(10px);
  background:linear-gradient(180deg, #ffffff 0%, color-mix(in oklab, var(--accent), #ffffff 40%) 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent;
  font-style:italic;font-weight:300;
  animation:wcReveal 1s cubic-bezier(.16,.84,.32,1) .45s forwards}
@keyframes wcReveal{to{opacity:1;transform:translateY(0);filter:blur(0)}}

.wc-sub{font-size:14px;color:rgba(232,236,242,.55);line-height:1.5;margin:18px 0 0;
  opacity:0;animation:wcReveal .8s ease .85s forwards}

.wc-corner-time{position:absolute;top:24px;left:28px;font-size:11px;letter-spacing:.14em;
  text-transform:uppercase;color:rgba(232,236,242,.45);
  font-family:'Geist Mono',ui-monospace,monospace;
  display:flex;align-items:center;gap:8px;
  opacity:0;animation:wcReveal .8s ease 1.1s forwards;z-index:5}
.wc-corner-time .blip{width:5px;height:5px;border-radius:50%;background:var(--accent);
  box-shadow:0 0 6px var(--accent)}
.wc-corner-sign{position:absolute;top:24px;right:28px;z-index:5;
  opacity:0;animation:wcReveal .8s ease 1.1s forwards}
.wc-corner-sign button{appearance:none;border:0;background:transparent;cursor:pointer;
  font:inherit;font-size:11.5px;letter-spacing:.04em;color:rgba(232,236,242,.5);
  font-family:'Geist Mono',ui-monospace,monospace;padding:6px 10px;border-radius:6px;transition:.15s}
.wc-corner-sign button:hover{color:#fff;background:rgba(255,255,255,.06)}

/* Today panel — used in placements A and B */
.wc-today h4{font-size:11px;letter-spacing:.16em;text-transform:uppercase;
  color:rgba(232,236,242,.4);margin:0 0 14px;font-family:'Geist Mono',ui-monospace,monospace;
  font-weight:500}
.wc-today ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px;
  font-size:13px;color:rgba(232,236,242,.55);line-height:1.7}
.wc-today li{display:flex;justify-content:space-between;
  border-bottom:1px dashed rgba(255,255,255,.08);padding-bottom:10px}
.wc-today li span:last-child{color:rgba(232,236,242,.85)}

/* Recent conversations panel */
.wc-recents{margin-top:28px}
.wc-recents h4{font-size:11px;letter-spacing:.16em;text-transform:uppercase;
  color:rgba(232,236,242,.4);margin:0 0 12px;font-family:'Geist Mono',ui-monospace,monospace;
  font-weight:500;display:flex;justify-content:space-between;align-items:center}
.wc-recents h4 .count{color:rgba(232,236,242,.3);letter-spacing:.06em}
.wc-recents ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:2px}
.wc-recents li{display:block}
.wc-recents button{appearance:none;border:0;background:transparent;cursor:pointer;
  width:100%;text-align:left;font:inherit;
  padding:8px 10px;margin:0 -10px;border-radius:8px;
  display:flex;flex-direction:column;gap:2px;
  transition:background .15s, color .15s;
  color:rgba(232,236,242,.7);font-size:12.5px;line-height:1.35}
.wc-recents button:hover{background:rgba(255,255,255,.04);color:#fff}
.wc-recents button.active{background:rgba(255,255,255,.05);
  box-shadow:inset 2px 0 0 var(--accent);color:#fff;border-radius:4px 8px 8px 4px}
.wc-recents .conv-title{font-weight:500;letter-spacing:-.005em;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wc-recents .conv-meta{font-size:10.5px;color:rgba(232,236,242,.4);
  font-family:'Geist Mono',ui-monospace,monospace;letter-spacing:.04em;
  text-transform:uppercase}

/* Chat header — title + new conversation button */
.wc-chat-head{display:flex;align-items:center;justify-content:space-between;
  margin-bottom:12px;gap:12px;min-width:0}
.wc-chat-head .conv-title{display:flex;align-items:center;gap:8px;min-width:0;
  font-size:11px;letter-spacing:.16em;text-transform:uppercase;
  color:rgba(232,236,242,.45);font-family:'Geist Mono',ui-monospace,monospace}
.wc-chat-head .conv-title .dot{width:5px;height:5px;border-radius:50%;
  background:var(--accent);box-shadow:0 0 6px var(--accent);flex:0 0 auto}
.wc-chat-head .conv-title .label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.wc-new{appearance:none;border:0;cursor:pointer;font:inherit;
  padding:6px 10px 6px 8px;border-radius:8px;flex:0 0 auto;
  background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
  color:rgba(232,236,242,.7);font-size:11.5px;letter-spacing:.02em;
  display:inline-flex;align-items:center;gap:6px;
  transition:.15s;font-family:'Geist Mono',ui-monospace,monospace}
.wc-new:hover{background:rgba(255,255,255,.08);color:#fff;
  border-color:rgba(255,255,255,.16)}
.wc-new svg{flex:0 0 auto}

/* ─────────── CHAT ─────────── */
.wc-chat{display:flex;flex-direction:column;min-height:0;
  opacity:0;animation:wcReveal 1s ease 1.5s forwards}

.wc-thread{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:10px;
  padding:4px 4px 14px;min-height:0;
  scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.12) transparent}
.wc-thread::-webkit-scrollbar{width:6px}
.wc-thread::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:3px}
.wc-thread::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.2)}

.wc-msg{display:flex;max-width:78%;animation:wcMsgIn .35s cubic-bezier(.2,.7,.3,1)}
.wc-msg.bot{align-self:flex-start}
.wc-msg.user{align-self:flex-end;justify-content:flex-end}
.wc-bubble{padding:10px 14px;border-radius:14px;font-size:13.5px;line-height:1.5;
  letter-spacing:-.005em;
  white-space:pre-wrap;word-wrap:break-word;
  position:relative}
.wc-msg.bot .wc-bubble{
  background:rgba(255,255,255,.05);
  border:1px solid rgba(255,255,255,.08);
  color:rgba(244,246,250,.95);
  border-bottom-left-radius:4px;
  backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
.wc-msg.user .wc-bubble{
  background:color-mix(in oklab, var(--accent), #0c0f13 25%);
  color:#0c0f13;
  border-bottom-right-radius:4px;
  font-weight:500;
  box-shadow:0 4px 16px color-mix(in oklab, var(--accent), transparent 70%)}
@keyframes wcMsgIn{
  from{opacity:0;transform:translateY(6px)}
  to{opacity:1;transform:translateY(0)}
}

.wc-byline{display:flex;align-items:center;gap:8px;margin-bottom:6px;
  font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;
  color:rgba(232,236,242,.45);font-family:'Geist Mono',ui-monospace,monospace}
.wc-byline .bot-mark{width:14px;height:14px;border-radius:4px;
  background:radial-gradient(circle at 30% 30%, var(--accent), color-mix(in oklab, var(--accent), #000 50%));
  box-shadow:0 0 0 1px rgba(255,255,255,.1), 0 0 8px color-mix(in oklab, var(--accent), transparent 70%)}

.wc-typing{display:inline-flex;gap:4px;align-items:center;padding:14px 16px}
.wc-typing i{width:6px;height:6px;border-radius:50%;background:rgba(232,236,242,.55);
  animation:wcDot 1.2s ease-in-out infinite}
.wc-typing i:nth-child(2){animation-delay:.15s}
.wc-typing i:nth-child(3){animation-delay:.3s}
@keyframes wcDot{
  0%,80%,100%{transform:translateY(0);opacity:.4}
  40%{transform:translateY(-3px);opacity:1}
}

.wc-composer{display:flex;align-items:flex-end;gap:8px;
  background:rgba(18,22,28,.5);
  border:1px solid rgba(255,255,255,.1);
  border-radius:16px;padding:8px 8px 8px 16px;
  backdrop-filter:blur(24px) saturate(140%);-webkit-backdrop-filter:blur(24px) saturate(140%);
  transition:border-color .2s, box-shadow .2s, background .2s}
.wc-composer:focus-within{
  border-color:color-mix(in oklab, var(--accent), transparent 50%);
  background:rgba(18,22,28,.65);
  box-shadow:0 0 0 3px color-mix(in oklab, var(--accent), transparent 85%),
             0 0 32px color-mix(in oklab, var(--accent), transparent 80%)}
.wc-composer textarea{flex:1;appearance:none;background:transparent;border:0;outline:none;
  color:#f4f6fa;font:inherit;font-size:14px;line-height:1.5;
  padding:8px 0;resize:none;max-height:140px;
  font-family:'Geist',ui-sans-serif,system-ui}
.wc-composer textarea::placeholder{color:rgba(232,236,242,.32)}
.wc-send{appearance:none;border:0;cursor:pointer;
  width:36px;height:36px;border-radius:10px;
  background:linear-gradient(180deg, #ffffff, #d8dde6);
  color:#0c0f13;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 4px 14px color-mix(in oklab, var(--accent), transparent 75%);
  transition:transform .12s, filter .2s, box-shadow .2s;flex:0 0 auto}
.wc-send:hover{box-shadow:0 6px 18px color-mix(in oklab, var(--accent), transparent 60%)}
.wc-send:active{transform:scale(.95)}
.wc-send[disabled]{filter:saturate(.4) brightness(.7);cursor:not-allowed;box-shadow:none}

/* ════════ PLACEMENT A · Below ════════ */
.wc-app[data-placement="below"] .wc-stage{
  position:absolute;inset:0;padding:80px 60px 48px;
  display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:48px;align-items:start}
.wc-app[data-placement="below"] .wc-eyebrow{margin-bottom:22px}
.wc-app[data-placement="below"] .wc-title{font-size:clamp(56px, 7vw, 88px)}
.wc-app[data-placement="below"] .wc-left{display:flex;flex-direction:column;min-height:0;
  height:100%;min-width:0}
.wc-app[data-placement="below"] .wc-chat{flex:1;margin-top:28px;min-height:0}
.wc-app[data-placement="below"] .wc-thread{max-height:240px}
.wc-app[data-placement="below"] .wc-side{
  border-left:1px solid rgba(255,255,255,.08);padding-left:32px;
  opacity:0;animation:wcReveal .8s ease 1.1s forwards;align-self:start;margin-top:48px;
  height:calc(100% - 48px);overflow-y:auto;scrollbar-width:thin;
  scrollbar-color:rgba(255,255,255,.12) transparent}
.wc-app[data-placement="below"] .wc-side::-webkit-scrollbar{width:5px}
.wc-app[data-placement="below"] .wc-side::-webkit-scrollbar-thumb{
  background:rgba(255,255,255,.12);border-radius:3px}

/* ════════ PLACEMENT B · Beside (3-col) ════════ */
.wc-app[data-placement="beside"] .wc-stage{
  position:absolute;inset:0;padding:80px 56px 48px;
  display:grid;grid-template-columns:minmax(220px, 1fr) minmax(0, 1.4fr) 240px;
  gap:40px;align-items:center}
.wc-app[data-placement="beside"] .wc-title{font-size:clamp(40px, 5vw, 64px)}
.wc-app[data-placement="beside"] .wc-eyebrow{margin-bottom:18px}
.wc-app[data-placement="beside"] .wc-sub{font-size:13px;margin-top:14px;max-width:240px}
.wc-app[data-placement="beside"] .wc-chat{
  height:520px;
  background:rgba(18,22,28,.4);
  border:1px solid rgba(255,255,255,.08);
  border-radius:20px;
  padding:20px;
  backdrop-filter:blur(28px) saturate(140%);-webkit-backdrop-filter:blur(28px) saturate(140%);
  box-shadow:0 30px 80px rgba(0,0,0,.4)}
.wc-app[data-placement="beside"] .wc-thread{max-height:none}
.wc-app[data-placement="beside"] .wc-side{
  opacity:0;animation:wcReveal .8s ease 1.1s forwards;align-self:center;font-size:12px;
  max-height:600px;overflow-y:auto;scrollbar-width:thin}
.wc-app[data-placement="beside"] .wc-today ul{gap:8px;font-size:12px}

/* ════════ PLACEMENT C · Dock ════════ */
.wc-app[data-placement="dock"] .wc-stage{position:absolute;inset:0}
.wc-app[data-placement="dock"] .wc-hero{
  position:absolute;top:50%;left:50%;transform:translate(-50%, -68%);
  text-align:center;display:flex;flex-direction:column;align-items:center}
.wc-app[data-placement="dock"] .wc-eyebrow{margin-bottom:28px}
.wc-app[data-placement="dock"] .wc-title{align-items:center;font-size:clamp(64px, 9vw, 112px)}
.wc-app[data-placement="dock"] .wc-sub{text-align:center;max-width:480px}
.wc-app[data-placement="dock"] .wc-side{
  position:absolute;top:64px;right:40px;width:220px;
  padding:18px;background:rgba(18,22,28,.4);border:1px solid rgba(255,255,255,.08);
  border-radius:14px;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  opacity:0;animation:wcReveal .8s ease 1.1s forwards;font-size:12px;
  max-height:calc(100% - 200px);overflow-y:auto;scrollbar-width:thin}
.wc-app[data-placement="dock"] .wc-today h4{margin-bottom:10px}
.wc-app[data-placement="dock"] .wc-today ul{gap:7px;font-size:11.5px}
.wc-app[data-placement="dock"] .wc-today li{padding-bottom:7px}
.wc-app[data-placement="dock"] .wc-recents h4{font-size:10px}
.wc-app[data-placement="dock"] .wc-recents button{padding:6px 8px;margin:0 -8px;font-size:11.5px}

.wc-app[data-placement="dock"] .wc-chat{
  position:absolute;left:50%;bottom:32px;transform:translateX(-50%);
  width:min(720px, calc(100% - 64px));
  display:flex;flex-direction:column;align-items:stretch;gap:12px}
.wc-app[data-placement="dock"] .wc-thread{
  max-height:280px;background:transparent;padding:0 6px}
.wc-app[data-placement="dock"] .wc-thread:empty{display:none}
`;

if (typeof document !== 'undefined' && !document.getElementById('wchat-styles')) {
  const s = document.createElement('style');
  s.id = 'wchat-styles';
  s.textContent = __WCHAT_STYLE;
  document.head.appendChild(s);
}

// ─── Icons ──────────────────────────────────────────────────────────────────
const WcIcon = {
  send: () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 8h11M9 4l4 4-4 4"/></svg>,
  plus: () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M6 1.5v9M1.5 6h9"/></svg>,
};

function timeGreetingWc(d = new Date()){
  const h = d.getHours();
  if (h < 5)  return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

// ─── Mock conversation history (returning-user state) ───────────────────────
// In production this is the response from GET /conversations — list of
// {id, title, updatedAt, messages?}. The welcome screen needs id + title +
// relative-time only; messages load lazily when the user picks one.
function relativeTime(d) {
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60)        return 'just now';
  if (diff < 3600)      return Math.floor(diff/60) + 'm ago';
  if (diff < 86400)     return Math.floor(diff/3600) + 'h ago';
  if (diff < 86400 * 7) return Math.floor(diff/86400) + 'd ago';
  return d.toLocaleDateString([], {month:'short', day:'numeric'});
}
function seedRecents(firstName) {
  const t = (mins) => new Date(Date.now() - mins * 60 * 1000);
  const seed = (id, title, mins, msgs) => ({
    id, title, updatedAt: t(mins), messages: msgs,
    userTurnsCount: msgs.filter(m => m.role === 'user').length,
  });
  return [
    seed('c-1', 'Q3 planning notes', 42, [
      {role:'bot',  text:`Hey ${firstName}, what are we working on first?`},
      {role:'user', text:`Help me outline Q3 planning.`},
      {role:'bot',  text:`Sure — we can split it into goals, blockers, and a working calendar. Which one do you want to start with?`},
    ]),
    seed('c-2', 'Brief for the welcome flow', 60 * 6, [
      {role:'bot',  text:`Hey ${firstName}, what are we working on first?`},
      {role:'user', text:`I need a 1-pager brief for the new welcome flow.`},
      {role:'bot',  text:`Got it. Want me to draft against the existing onboarding template, or start from scratch?`},
    ]),
    seed('c-3', 'Rename for project Atlas', 60 * 26, [
      {role:'bot',  text:`Hey ${firstName}, what are we working on first?`},
      {role:'user', text:`Suggest five names for project Atlas that aren't planetary.`},
      {role:'bot',  text:`A few directions: Sundial, Foundry, Almanac, Lighthouse, Carbon. Want more in any one style?`},
    ]),
    seed('c-4', 'Email tone audit', 60 * 24 * 4, [
      {role:'bot',  text:`Hey ${firstName}, what are we working on first?`},
      {role:'user', text:`Audit the tone of last week's customer emails.`},
      {role:'bot',  text:`Paste them in or point me at the thread and I'll flag anything off-brand.`},
    ]),
  ];
}

function newConversationId() {
  return 'c-' + Math.random().toString(36).slice(2, 9);
}
function newConversationStub(firstName) {
  return {
    id: newConversationId(),
    title: 'New conversation',
    updatedAt: new Date(),
    messages: [{ role:'bot', text: `Hey ${firstName}, what are we working on first?` }],
  };
}
function deriveTitle(firstUserMessage) {
  const t = firstUserMessage.trim().replace(/\s+/g, ' ');
  if (t.length <= 38) return t;
  return t.slice(0, 36).trimEnd() + '…';
}

// ─── Chat surface ───────────────────────────────────────────────────────────
function ChatSurface({ name, conversation, onUpdate, onNew, placement }) {
  const firstName = (name || 'friend').split(' ')[0];
  const [input, setInput] = React.useState('');
  const [typing, setTyping] = React.useState(false);
  const threadRef = React.useRef(null);
  const taRef = React.useRef(null);
  const messages = conversation.messages;

  // Autoscroll on new content
  React.useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  // Autosize textarea
  React.useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(140, ta.scrollHeight) + 'px';
  }, [input]);

  // Reset input when switching conversations
  const convId = conversation.id;
  React.useEffect(() => { setInput(''); setTyping(false); }, [convId]);

  async function send() {
    const text = input.trim();
    if (!text || typing) return;
    const userMsg = { role: 'user', text };
    const nextMessages = [...messages, userMsg];

    // First user turn? Derive a conversation title from it.
    const wasUntitled = !conversation.userTurnsCount && conversation.title === 'New conversation';
    const nextTitle = wasUntitled ? deriveTitle(text) : conversation.title;

    onUpdate({
      ...conversation,
      title: nextTitle,
      messages: nextMessages,
      updatedAt: new Date(),
      userTurnsCount: (conversation.userTurnsCount || 0) + 1,
    });
    setInput('');
    setTyping(true);

    try {
      const transcript = nextMessages
        .map(m => `${m.role === 'bot' ? 'Nova' : firstName}: ${m.text}`)
        .join('\n');
      const prompt =
        `You are Nova, a calm and concise assistant inside the Lumen workspace. ` +
        `The user's name is ${firstName}. ` +
        `Reply in 1–2 short sentences. Warm but never effusive. Never use exclamation marks. ` +
        `Plain prose only — no markdown, no lists, no headers.\n\n` +
        `Conversation so far:\n${transcript}\n\nReply as Nova:`;

      const reply = await window.claude.complete(prompt);
      const cleaned = String(reply || '').trim().replace(/^Nova:\s*/i, '');
      onUpdate(c => ({
        ...c,
        messages: [...c.messages, { role:'bot', text: cleaned || "I'm here." }],
        updatedAt: new Date(),
      }));
    } catch (e) {
      onUpdate(c => ({
        ...c,
        messages: [...c.messages, { role:'bot', text: "I'm offline at the moment — try again in a sec." }],
        updatedAt: new Date(),
      }));
    } finally {
      setTyping(false);
    }
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="wc-chat">
      <div className="wc-chat-head">
        <div className="conv-title">
          <span className="dot"></span>
          <span className="label">{conversation.title}</span>
        </div>
        <button type="button" className="wc-new" onClick={onNew} title="Start a new conversation">
          <WcIcon.plus/><span>New</span>
        </button>
      </div>

      <div className="wc-thread" ref={threadRef} role="log" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={`wc-msg ${m.role}`}>
            <div>
              {m.role === 'bot' && i === 0 && (
                <div className="wc-byline">
                  <span className="bot-mark"></span>
                  <span>Nova</span>
                </div>
              )}
              <div className="wc-bubble">{m.text}</div>
            </div>
          </div>
        ))}
        {typing && (
          <div className="wc-msg bot">
            <div className="wc-bubble" style={{padding:0}}>
              <div className="wc-typing"><i></i><i></i><i></i></div>
            </div>
          </div>
        )}
      </div>

      <div className="wc-composer">
        <textarea
          ref={taRef}
          rows={1}
          placeholder="Ask Nova anything…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          aria-label="Message Nova"
        />
        <button className="wc-send" type="button"
                onClick={send}
                disabled={!input.trim() || typing}
                aria-label="Send">
          <WcIcon.send/>
        </button>
      </div>
    </div>
  );
}

// ─── Today panel + Recents ─────────────────────────────────────────────────
function TodayPanel({ firstName, conversations, activeId, onPick }) {
  return (
    <div className="wc-side">
      <div className="wc-today">
        <h4>Today, in your space</h4>
        <ul>
          <li><span>Drafts</span><span>3</span></li>
          <li><span>Pending invites</span><span>1</span></li>
          <li><span>Workspace</span><span className="wc-mono">{firstName.toLowerCase()}-hq</span></li>
          <li><span>Plan</span><span>Free · trial</span></li>
        </ul>
      </div>
      {conversations && conversations.length > 0 && (
        <div className="wc-recents">
          <h4><span>Recent conversations</span><span className="count wc-mono">{conversations.length}</span></h4>
          <ul>
            {conversations.slice(0, 5).map(c => (
              <li key={c.id}>
                <button type="button"
                        className={c.id === activeId ? 'active' : ''}
                        onClick={() => onPick(c.id)}>
                  <span className="conv-title">{c.title}</span>
                  <span className="conv-meta">{relativeTime(c.updatedAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Welcome+Chat root ──────────────────────────────────────────────────────
function WelcomeChat({ name = 'Dillon Smith', accent = '#22d3a8', placement = 'below', greetingCopy = 'Welcome,' }) {
  const firstName = (name || 'friend').split(' ')[0];
  const [now, setNow] = React.useState(new Date());

  // Conversations: server-style list, sorted by updatedAt desc. The active
  // conversation is whichever id is in `activeId`. A returning user lands on
  // a fresh "New conversation" prepended to their recents; if they click a
  // recent, the new stub stays at the top but `activeId` swaps to the recent.
  const [conversations, setConversations] = React.useState(() => {
    const fresh = newConversationStub(firstName);
    return [fresh, ...seedRecents(firstName)];
  });
  const [activeId, setActiveId] = React.useState(() => conversations[0].id);

  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  // If the user's firstName changes (via Tweaks panel), re-seed Nova's
  // greeting only in the active *empty* conversation, not historic ones.
  React.useEffect(() => {
    setConversations(cs => cs.map(c => {
      if (c.id !== activeId) return c;
      if ((c.userTurnsCount || 0) > 0) return c;
      return {
        ...c,
        messages: [{ role:'bot', text: `Hey ${firstName}, what are we working on first?` }],
      };
    }));
  }, [firstName]); // eslint-disable-line

  const active = conversations.find(c => c.id === activeId) || conversations[0];

  const updateActive = (updater) => {
    setConversations(cs => cs.map(c => {
      if (c.id !== activeId) return c;
      return typeof updater === 'function' ? updater(c) : updater;
    }));
  };

  const newConversation = () => {
    const stub = newConversationStub(firstName);
    setConversations(cs => [stub, ...cs]);
    setActiveId(stub.id);
  };

  const pickConversation = (id) => setActiveId(id);

  // Empty stubs (no user turns) don't belong in the recents list — a fresh
  // "New conversation" only exists locally until the first send, so it
  // shouldn't appear as history. Filter ALL stubs, not just the active one.
  const recents = conversations.filter(c => (c.userTurnsCount || 0) > 0);

  return (
    <div className="wc-app" data-placement={placement} style={{'--accent': accent}}>
      <window.OrbsBg accent={accent} screen="welcome" />

      <div className="wc-corner-time">
        <span className="blip"></span>
        <span>{now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} · {timeGreetingWc(now)}</span>
      </div>
      <div className="wc-corner-sign">
        <button type="button">Sign out ↗</button>
      </div>

      <div className="wc-stage">
        {placement === 'below' && (
          <>
            <div className="wc-left">
              <div className="wc-eyebrow"><span className="dot"></span><span>Session active</span></div>
              <h1 className="wc-title">
                <span className="l1">{greetingCopy}</span>
                <span className="l2">{firstName}.</span>
              </h1>
              <p className="wc-sub">
                We're glad you're here. Ask Nova anything — or pick up where you left off.
              </p>
              <ChatSurface
                name={name}
                conversation={active}
                onUpdate={updateActive}
                onNew={newConversation}
                placement={placement}
              />
            </div>
            <TodayPanel firstName={firstName}
                        conversations={recents}
                        activeId={activeId}
                        onPick={pickConversation} />
          </>
        )}

        {placement === 'beside' && (
          <>
            <div>
              <div className="wc-eyebrow"><span className="dot"></span><span>Session active</span></div>
              <h1 className="wc-title">
                <span className="l1">{greetingCopy}</span>
                <span className="l2">{firstName}.</span>
              </h1>
              <p className="wc-sub">Nova's standing by. Ask anything, or just say hi.</p>
            </div>
            <ChatSurface name={name}
                         conversation={active}
                         onUpdate={updateActive}
                         onNew={newConversation}
                         placement={placement}/>
            <TodayPanel firstName={firstName}
                        conversations={recents}
                        activeId={activeId}
                        onPick={pickConversation}/>
          </>
        )}

        {placement === 'dock' && (
          <>
            <div className="wc-hero">
              <div className="wc-eyebrow"><span className="dot"></span><span>Session active</span></div>
              <h1 className="wc-title">
                <span className="l1">{greetingCopy}</span>
                <span className="l2">{firstName}.</span>
              </h1>
              <p className="wc-sub">
                We're glad you're here. Ask Nova anything to get started.
              </p>
            </div>
            <TodayPanel firstName={firstName}
                        conversations={recents}
                        activeId={activeId}
                        onPick={pickConversation}/>
            <ChatSurface name={name}
                         conversation={active}
                         onUpdate={updateActive}
                         onNew={newConversation}
                         placement={placement}/>
          </>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { WelcomeChat });
