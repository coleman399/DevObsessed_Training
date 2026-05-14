// auth-app.jsx — full interactive auth flow (signin/signup toggle) + welcome.
// Each artboard renders <AuthApp variant="aurora" tweaks={t} />.
// Validation: inline email, password strength meter, show/hide, caps-lock,
// loading states, error states, focus animations.

const __AUTH_STYLE = `
.app{position:relative;width:100%;height:100%;color:#e8ecf2;
  font-family:var(--app-font, 'Geist',ui-sans-serif,system-ui,sans-serif);
  letter-spacing:-.005em;overflow:hidden;isolation:isolate}
.app *{box-sizing:border-box}
.app .mono{font-family:var(--app-mono,'Geist Mono',ui-monospace,monospace);
  font-variant-numeric:tabular-nums}

.stage{position:relative;width:100%;height:100%;display:flex;
  align-items:center;justify-content:center;z-index:1}

/* ───── AUTH CARD ───── */
.auth-card{
  position:relative;width:min(440px, calc(100% - 64px));
  background:rgba(18,22,28,.55);
  backdrop-filter:blur(28px) saturate(140%);
  -webkit-backdrop-filter:blur(28px) saturate(140%);
  border:1px solid rgba(255,255,255,.08);
  border-radius:20px;
  box-shadow:
    0 1px 0 rgba(255,255,255,.06) inset,
    0 0 0 1px rgba(255,255,255,.02),
    0 30px 80px rgba(0,0,0,.5),
  ;
  padding:var(--pad, 32px);
  transition:opacity .5s ease, transform .5s cubic-bezier(.2,.7,.3,1), filter .5s;
}
.auth-card.leaving{opacity:0;transform:translateY(-12px) scale(.98);filter:blur(8px);pointer-events:none}

.brand{display:flex;align-items:center;gap:10px;margin-bottom:28px}
.brand-mark{width:28px;height:28px;border-radius:8px;
  background:radial-gradient(circle at 30% 30%, var(--accent), color-mix(in oklab, var(--accent), #000 50%));
  box-shadow:0 0 0 1px rgba(255,255,255,.1), 0 0 24px color-mix(in oklab, var(--accent), transparent 70%);
  position:relative}
.brand-mark::after{content:'';position:absolute;inset:6px;border-radius:50%;
  background:radial-gradient(circle, rgba(255,255,255,.95), transparent 65%)}
.brand-name{font-size:13px;font-weight:500;letter-spacing:.02em;color:rgba(232,236,242,.85)}
.brand-tag{margin-left:auto;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;
  color:rgba(232,236,242,.4);font-family:var(--app-mono,'Geist Mono',ui-monospace,monospace)}

.heading{font-size:28px;font-weight:500;line-height:1.15;letter-spacing:-.02em;
  margin:0 0 8px;color:#f4f6fa}
.subhead{font-size:14px;color:rgba(232,236,242,.55);margin:0 0 24px;line-height:1.5}

.toggle{display:inline-flex;background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:3px;margin-bottom:22px;
  position:relative}
.toggle button{appearance:none;border:0;background:transparent;color:rgba(232,236,242,.6);
  font:inherit;font-size:12.5px;font-weight:500;padding:7px 14px;border-radius:7px;cursor:pointer;
  position:relative;z-index:1;transition:color .25s}
.toggle button.active{color:#0c0f13}
.toggle .pill{position:absolute;top:3px;bottom:3px;border-radius:7px;
  background:linear-gradient(180deg, #ffffff, #d8dde6);
  box-shadow:0 1px 2px rgba(0,0,0,.4), 0 0 0 .5px rgba(0,0,0,.1);
  transition:left .32s cubic-bezier(.5,.05,.2,1.05), width .32s cubic-bezier(.5,.05,.2,1.05)}

.field{position:relative;margin-bottom:14px}
.field-label{display:block;font-size:11.5px;font-weight:500;letter-spacing:.04em;
  color:rgba(232,236,242,.55);margin-bottom:7px;text-transform:uppercase;
  font-family:var(--app-mono,'Geist Mono',ui-monospace,monospace)}
.field-wrap{position:relative;display:flex;align-items:center;
  background:rgba(255,255,255,.03);
  border:1px solid rgba(255,255,255,.08);
  border-radius:12px;
  transition:border-color .2s, background .2s, box-shadow .2s}
.field-wrap:focus-within{
  border-color:color-mix(in oklab, var(--accent), transparent 40%);
  background:rgba(255,255,255,.05);
  box-shadow:0 0 0 3px color-mix(in oklab, var(--accent), transparent 85%),
             0 0 22px color-mix(in oklab, var(--accent), transparent 80%)}
.field-wrap.error{border-color:#ef4d63;
  box-shadow:0 0 0 3px rgba(239,77,99,.18)}
.field-wrap.valid{border-color:color-mix(in oklab, var(--accent), transparent 50%)}
.field-wrap input{flex:1;appearance:none;background:transparent;border:0;outline:none;
  color:#f4f6fa;font:inherit;font-size:14.5px;padding:13px 14px;letter-spacing:-.005em;
  font-family:var(--app-font, 'Geist', ui-sans-serif, system-ui)}
.field-wrap input::placeholder{color:rgba(232,236,242,.28)}
.field-wrap input:-webkit-autofill{
  -webkit-text-fill-color:#f4f6fa;
  -webkit-box-shadow:0 0 0 1000px transparent inset;
  transition:background-color 9999s}
.field-icon{display:flex;align-items:center;justify-content:center;width:38px;flex:0 0 auto;
  color:rgba(232,236,242,.45);transition:color .2s}
.field-wrap:focus-within .field-icon{color:rgba(232,236,242,.75)}
.field-wrap.valid .field-icon.tick{color:var(--accent)}
.field-wrap.error .field-icon.warn{color:#ef4d63}

.eye{appearance:none;border:0;background:transparent;color:rgba(232,236,242,.45);
  cursor:pointer;width:38px;height:38px;display:flex;align-items:center;justify-content:center;
  border-radius:8px;transition:color .15s, background .15s;margin-right:4px}
.eye:hover{color:rgba(232,236,242,.85);background:rgba(255,255,255,.05)}

.field-meta{display:flex;justify-content:space-between;align-items:center;
  margin-top:6px;font-size:11.5px;min-height:16px;
  font-family:var(--app-mono,'Geist Mono',ui-monospace,monospace)}
.field-hint{color:rgba(232,236,242,.4)}
.field-err{color:#ff7a8c;display:flex;align-items:center;gap:5px;
  animation:shakeIn .25s cubic-bezier(.36,.07,.19,.97)}
@keyframes shakeIn{
  0%{transform:translateX(-3px);opacity:0}
  30%{transform:translateX(3px)}
  60%{transform:translateX(-2px)}
  100%{transform:translateX(0);opacity:1}
}

.strength{display:flex;gap:4px;flex:1;margin-right:10px}
.strength i{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.08);
  transition:background .25s, box-shadow .25s}
.strength i.on-1{background:#ef4d63}
.strength i.on-2{background:#f59e3c}
.strength i.on-3{background:#eab308}
.strength i.on-4{background:var(--accent);box-shadow:0 0 8px color-mix(in oklab, var(--accent), transparent 50%)}
.strength-label{font-size:11px;color:rgba(232,236,242,.5);min-width:64px;text-align:right}

.caps{display:flex;align-items:center;gap:6px;font-size:11px;
  color:#f5b94a;margin-top:6px;font-family:var(--app-mono,'Geist Mono',ui-monospace,monospace);
  animation:fadeUp .2s ease}
@keyframes fadeUp{from{opacity:0;transform:translateY(2px)}to{opacity:1;transform:translateY(0)}}

.row{display:flex;align-items:center;justify-content:space-between;margin:6px 0 18px}
.check{display:inline-flex;align-items:center;gap:8px;cursor:pointer;
  font-size:12.5px;color:rgba(232,236,242,.65)}
.check input{appearance:none;width:14px;height:14px;border-radius:4px;
  background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.18);
  position:relative;cursor:pointer;transition:.15s}
.check input:checked{background:var(--accent);border-color:var(--accent)}
.check input:checked::after{content:'';position:absolute;left:3px;top:0px;
  width:5px;height:9px;border:solid #0c0f13;border-width:0 2px 2px 0;transform:rotate(45deg)}
.forgot{font-size:12.5px;color:rgba(232,236,242,.65);text-decoration:none;
  border-bottom:1px solid transparent;transition:.15s}
.forgot:hover{color:#fff;border-color:rgba(255,255,255,.3)}

.submit{appearance:none;border:0;width:100%;cursor:pointer;font:inherit;
  font-size:14px;font-weight:500;letter-spacing:.005em;
  color:#0c0f13;
  background:linear-gradient(180deg, #ffffff 0%, #d8dde6 100%);
  border-radius:12px;padding:13px;position:relative;overflow:hidden;
  box-shadow:0 1px 0 rgba(255,255,255,.5) inset,
             0 8px 24px color-mix(in oklab, var(--accent), transparent 75%);
  transition:transform .12s ease, box-shadow .25s, filter .2s;
  display:flex;align-items:center;justify-content:center;gap:8px}
.submit::before{content:'';position:absolute;inset:0;
  background:radial-gradient(120% 120% at 50% 0%, color-mix(in oklab, var(--accent), transparent 75%), transparent 60%);
  opacity:.5;pointer-events:none}
.submit:hover{box-shadow:0 1px 0 rgba(255,255,255,.5) inset,
  0 12px 30px color-mix(in oklab, var(--accent), transparent 60%)}
.submit:active{transform:scale(.99)}
.submit[disabled]{filter:saturate(.6) brightness(.85);cursor:not-allowed}
.submit .arr{transition:transform .25s}
.submit:hover .arr{transform:translateX(3px)}

.spinner{display:inline-block;width:14px;height:14px;border-radius:50%;
  border:2px solid rgba(12,15,19,.25);border-top-color:#0c0f13;
  animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

.divider{display:flex;align-items:center;gap:12px;margin:18px 0 14px;
  font-size:11px;letter-spacing:.16em;text-transform:uppercase;
  color:rgba(232,236,242,.35);font-family:var(--app-mono,'Geist Mono',ui-monospace,monospace)}
.divider::before,.divider::after{content:'';flex:1;height:1px;
  background:linear-gradient(90deg, transparent, rgba(255,255,255,.12), transparent)}

.swap{text-align:center;font-size:13px;color:rgba(232,236,242,.5);margin-top:18px}
.swap a{color:#fff;text-decoration:none;border-bottom:1px solid rgba(255,255,255,.25);
  cursor:pointer;transition:.15s;margin-left:4px}
.swap a:hover{border-color:#fff}

.legal{margin-top:16px;font-size:11px;color:rgba(232,236,242,.32);text-align:center;line-height:1.6}

/* form area transition */
.form-area{transition:opacity .25s ease, transform .25s ease}
.form-area.swapping{opacity:0;transform:translateY(8px)}

/* ─── SPLIT LAYOUT ─── */
.auth-card.layout-split{width:min(820px, calc(100% - 64px));padding:0;display:flex;
  overflow:hidden}
.auth-card.layout-split .left{flex:0 0 360px;padding:36px;
  background:linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.01));
  border-right:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;justify-content:space-between}
.auth-card.layout-split .right{flex:1;padding:36px;min-width:0}
.auth-card.layout-split .left .quote{font-size:22px;line-height:1.35;letter-spacing:-.01em;
  font-weight:400;color:rgba(244,246,250,.9);margin:0}
.auth-card.layout-split .left .quote em{font-style:normal;
  background:linear-gradient(110deg, var(--accent), #fff 80%);
  -webkit-background-clip:text;background-clip:text;color:transparent}
.auth-card.layout-split .left .meta{font-size:11px;letter-spacing:.14em;text-transform:uppercase;
  color:rgba(232,236,242,.4);font-family:var(--app-mono,'Geist Mono',ui-monospace,monospace)}

/* ─── MINIMAL LAYOUT ─── */
.auth-card.layout-minimal{background:transparent;border:0;box-shadow:none;backdrop-filter:none;
  -webkit-backdrop-filter:none;padding:0;width:min(380px, calc(100% - 64px))}
.auth-card.layout-minimal .field-wrap{background:transparent;border:0;border-bottom:1px solid rgba(255,255,255,.14);
  border-radius:0;padding:0}
.auth-card.layout-minimal .field-wrap input{padding:13px 0}
.auth-card.layout-minimal .field-wrap:focus-within{box-shadow:none;background:transparent;
  border-color:var(--accent)}
.auth-card.layout-minimal .field-icon{display:none}
.auth-card.layout-minimal .eye{margin-right:0}
.auth-card.layout-minimal .field-label{margin-left:0}

/* ═════════ WELCOME ═════════ */
.welcome{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  pointer-events:none;opacity:0;transition:opacity .6s ease .1s}
.welcome.show{opacity:1;pointer-events:auto}
.welcome-inner{text-align:center;padding:48px;max-width:900px;width:100%}

.w-eyebrow{display:inline-flex;align-items:center;gap:10px;font-size:11px;letter-spacing:.2em;
  text-transform:uppercase;color:rgba(232,236,242,.55);
  font-family:var(--app-mono,'Geist Mono',ui-monospace,monospace);
  margin-bottom:28px;
  padding:7px 14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
  border-radius:999px;backdrop-filter:blur(20px)}
.w-eyebrow .dot{width:6px;height:6px;border-radius:50%;background:var(--accent);
  box-shadow:0 0 8px var(--accent);animation:pulse 2s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}

.w-title{font-size:clamp(56px, 9vw, 128px);font-weight:400;line-height:.95;
  letter-spacing:-.04em;margin:0;color:#f5f7fb;
  display:flex;flex-direction:column;align-items:center;gap:0}
.w-title .l1{opacity:0;transform:translateY(24px) translateZ(0);filter:blur(12px);
  animation:reveal 1.1s cubic-bezier(.16,.84,.32,1) .2s forwards}
.w-title .l2{opacity:0;transform:translateY(28px);filter:blur(12px);
  background:linear-gradient(180deg, #ffffff 0%, color-mix(in oklab, var(--accent), #ffffff 40%) 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent;
  font-style:italic;font-weight:300;
  animation:reveal 1.2s cubic-bezier(.16,.84,.32,1) .6s forwards}
@keyframes reveal{to{opacity:1;transform:translateY(0);filter:blur(0)}}

.w-sub{margin-top:22px;font-size:15px;color:rgba(232,236,242,.55);line-height:1.5;
  opacity:0;animation:reveal 1s ease 1.1s forwards}
.w-sub .mono{color:rgba(232,236,242,.75)}

.w-actions{display:flex;gap:10px;justify-content:center;margin-top:36px;
  opacity:0;animation:reveal 1s ease 1.4s forwards}
.w-btn{appearance:none;border:0;cursor:pointer;font:inherit;font-size:12.5px;font-weight:500;
  padding:11px 18px;border-radius:10px;
  background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);
  color:#f5f7fb;backdrop-filter:blur(20px);transition:.2s;
  display:inline-flex;align-items:center;gap:8px}
.w-btn:hover{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.2)}
.w-btn.primary{background:linear-gradient(180deg, #fff, #d8dde6);color:#0c0f13;border-color:transparent;
  box-shadow:0 8px 24px color-mix(in oklab, var(--accent), transparent 70%)}

.w-time{position:absolute;top:24px;left:28px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;
  color:rgba(232,236,242,.45);font-family:var(--app-mono,'Geist Mono',ui-monospace,monospace);
  opacity:0;animation:reveal 1s ease 1.6s forwards;
  display:flex;align-items:center;gap:8px}
.w-time .blip{width:5px;height:5px;border-radius:50%;background:var(--accent);
  box-shadow:0 0 6px var(--accent)}
.w-sign{position:absolute;top:24px;right:28px;
  opacity:0;animation:reveal 1s ease 1.6s forwards}
.w-sign button{appearance:none;border:0;background:transparent;cursor:pointer;
  font:inherit;font-size:11.5px;letter-spacing:.04em;
  color:rgba(232,236,242,.5);
  font-family:var(--app-mono,'Geist Mono',ui-monospace,monospace);
  padding:6px 10px;border-radius:6px;transition:.15s}
.w-sign button:hover{color:#fff;background:rgba(255,255,255,.06)}

/* Welcome variants */
.welcome.variant-minimal .w-eyebrow,
.welcome.variant-minimal .w-actions{display:none}
.welcome.variant-minimal .w-title{font-size:clamp(72px, 11vw, 160px)}

.welcome.variant-split .welcome-inner{text-align:left;display:grid;
  grid-template-columns:1fr 1fr;gap:60px;align-items:center;max-width:1080px}
.welcome.variant-split .w-title{align-items:flex-start}
.welcome.variant-split .w-actions{justify-content:flex-start}
.welcome.variant-split .w-right{
  border-left:1px solid rgba(255,255,255,.08);padding-left:48px;
  font-size:13px;color:rgba(232,236,242,.55);line-height:1.7}
.welcome.variant-split .w-right h4{font-size:11px;letter-spacing:.16em;text-transform:uppercase;
  color:rgba(232,236,242,.4);margin:0 0 14px;font-family:var(--app-mono,'Geist Mono',ui-monospace,monospace);
  font-weight:500}
.welcome.variant-split .w-right ul{list-style:none;padding:0;margin:0;
  display:flex;flex-direction:column;gap:10px}
.welcome.variant-split .w-right li{display:flex;justify-content:space-between;
  border-bottom:1px dashed rgba(255,255,255,.08);padding-bottom:10px}
.welcome.variant-split .w-right li span:last-child{color:rgba(232,236,242,.85)}
`;

if (typeof document !== 'undefined' && !document.getElementById('auth-styles')) {
  const s = document.createElement('style');
  s.id = 'auth-styles';
  s.textContent = __AUTH_STYLE;
  document.head.appendChild(s);
}

// ─── Icons (inline SVG) ─────────────────────────────────────────────────────
const Icon = {
  mail: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="2" y="3.5" width="12" height="9" rx="1.5"/><path d="M2.5 4.5 8 9l5.5-4.5"/></svg>,
  lock: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5 7V5a3 3 0 0 1 6 0v2"/></svg>,
  user: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="5.5" r="2.5"/><path d="M3 13.5a5 5 0 0 1 10 0"/></svg>,
  eye:  () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M1.5 8s2.5-5 6.5-5 6.5 5 6.5 5-2.5 5-6.5 5S1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/></svg>,
  eyeOff: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 2l12 12M6.5 6.5A2 2 0 0 0 9.5 9.5M1.5 8s2.5-5 6.5-5c1.5 0 2.8.5 3.9 1.2M14.5 8s-1 2-3 3.5"/></svg>,
  tick: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 8.5l3 3 7-7"/></svg>,
  warn: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="8" r="6.5"/><path d="M8 5v4M8 11v.5"/></svg>,
  arrow: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 7h10M8 3l4 4-4 4"/></svg>,
  caps: () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M8 3l5 5h-3v3H6V8H3l5-5zM4 13.5h8"/></svg>,
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function emailValidator(v){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}
function passwordStrength(v){
  if (!v) return 0;
  let s = 0;
  if (v.length >= 6) s++;
  if (v.length >= 10) s++;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
  if (/\d/.test(v) && /[^A-Za-z0-9]/.test(v)) s++;
  return Math.min(4, s);
}
const STRENGTH_LABEL = ['', 'weak', 'fair', 'good', 'strong'];

function timeGreeting(d = new Date()){
  const h = d.getHours();
  if (h < 5)  return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

function deriveName(email){
  if (!email) return 'friend';
  const local = email.split('@')[0] || '';
  const cleaned = local.replace(/[._-]+/g, ' ').trim();
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(' ') || 'friend';
}

// ─── AuthApp ────────────────────────────────────────────────────────────────
function AuthApp({ variant = 'aurora', tweaks = {}, brandName = 'Lumen' }) {
  const {
    accent = '#22d3a8',
    authLayout = 'card',      // card | split | minimal
    welcomeLayout = 'centered', // centered | minimal | split
    bgTreatment = variant,    // aurora | mesh | orbs
    density = 'regular',
    greetingCopy = 'Welcome,',
    fontPair = 'geist',
  } = tweaks;

  const [mode, setMode] = React.useState('signup'); // 'signin' | 'signup'
  const [swapping, setSwapping] = React.useState(false);
  const [screen, setScreen] = React.useState('auth'); // 'auth' | 'welcome'
  const [leaving, setLeaving] = React.useState(false);

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [emailTouched, setEmailTouched] = React.useState(false);
  const [pwTouched, setPwTouched] = React.useState(false);
  const [showPw, setShowPw] = React.useState(false);
  const [caps, setCaps] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [now, setNow] = React.useState(new Date());

  const togglePillRef = React.useRef(null);
  const signupBtnRef = React.useRef(null);
  const signinBtnRef = React.useRef(null);

  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30 * 1000);
    return () => clearInterval(t);
  }, []);

  // Position toggle pill
  React.useLayoutEffect(() => {
    const ref = mode === 'signup' ? signupBtnRef.current : signinBtnRef.current;
    const pill = togglePillRef.current;
    if (ref && pill) {
      pill.style.left = ref.offsetLeft + 'px';
      pill.style.width = ref.offsetWidth + 'px';
    }
  }, [mode]);

  const eValid = email && emailValidator(email);
  const eShowError = emailTouched && email && !eValid;
  const pStrength = passwordStrength(password);
  const pwError = pwTouched && password && password.length < 6;

  const canSubmit = (
    eValid && password.length >= 6 &&
    (mode === 'signin' || name.trim().length > 0) &&
    !loading
  );

  const finalName = (mode === 'signup' && name.trim()) ? name.trim().split(' ')[0] : deriveName(email);

  function switchMode(next){
    if (next === mode || swapping) return;
    setSwapping(true);
    setError(null);
    setTimeout(() => {
      setMode(next);
      setSwapping(false);
    }, 220);
  }

  function handlePwKey(e){
    if (e.getModifierState) setCaps(e.getModifierState('CapsLock'));
  }

  function submit(e){
    e.preventDefault();
    setEmailTouched(true);
    setPwTouched(true);
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    // Simulate auth: "wrong" in password triggers error
    setTimeout(() => {
      if (mode === 'signin' && /wrong/i.test(password)) {
        setLoading(false);
        setError("That doesn't match our records.");
        return;
      }
      setLoading(false);
      setLeaving(true);
      setTimeout(() => setScreen('welcome'), 350);
    }, 1100);
  }

  function signOut(){
    setLeaving(false);
    setScreen('auth');
    setPassword('');
    setError(null);
    setPwTouched(false);
  }

  const density_pad = {compact:'24px', regular:'32px', comfy:'40px'}[density] || '32px';

  const BgComp = (
    bgTreatment === 'mesh' ? window.MeshBg :
    bgTreatment === 'orbs' ? window.OrbsBg :
    window.AuroraBg
  );

  const fontVar = {
    geist:   {sans:"'Geist', ui-sans-serif, system-ui, sans-serif", mono:"'Geist Mono', ui-monospace, monospace"},
    jakarta: {sans:"'Plus Jakarta Sans', ui-sans-serif, system-ui", mono:"'JetBrains Mono', ui-monospace, monospace"},
    manrope: {sans:"'Manrope', ui-sans-serif, system-ui", mono:"'IBM Plex Mono', ui-monospace, monospace"},
  }[fontPair] || {sans:"'Geist'", mono:"'Geist Mono'"};

  return (
    <div className="app"
         style={{
           '--accent': accent,
           '--pad': density_pad,
           '--app-font': fontVar.sans,
           '--app-mono': fontVar.mono,
         }}>
      <BgComp accent={accent} screen={screen} />

      {/* AUTH STAGE */}
      {screen === 'auth' && (
        <div className="stage">
          <form className={`auth-card layout-${authLayout} ${leaving ? 'leaving' : ''}`} onSubmit={submit} noValidate>
            {authLayout === 'split' ? (
              <>
                <div className="left">
                  <div className="brand">
                    <div className="brand-mark"></div>
                    <div className="brand-name">{brandName}</div>
                  </div>
                  <p className="quote">A quieter place to <em>think, plan, and ship.</em></p>
                  <div className="meta">v2.4 · build 8821</div>
                </div>
                <div className="right">
                  <FormBody {...{mode, switchMode, signupBtnRef, signinBtnRef, togglePillRef,
                    swapping, name, setName, email, setEmail, password, setPassword,
                    emailTouched, setEmailTouched, pwTouched, setPwTouched, showPw, setShowPw,
                    caps, handlePwKey, remember, setRemember, loading, error,
                    eValid, eShowError, pStrength, pwError, canSubmit,
                    authLayout}} />
                </div>
              </>
            ) : (
              <>
                <div className="brand">
                  <div className="brand-mark"></div>
                  <div className="brand-name">{brandName}</div>
                  <div className="brand-tag">v2.4</div>
                </div>
                <FormBody {...{mode, switchMode, signupBtnRef, signinBtnRef, togglePillRef,
                  swapping, name, setName, email, setEmail, password, setPassword,
                  emailTouched, setEmailTouched, pwTouched, setPwTouched, showPw, setShowPw,
                  caps, handlePwKey, remember, setRemember, loading, error,
                  eValid, eShowError, pStrength, pwError, canSubmit,
                  authLayout}} />
              </>
            )}
          </form>
        </div>
      )}

      {/* WELCOME STAGE */}
      {screen === 'welcome' && (
        <>
          <div className="w-time">
            <span className="blip"></span>
            <span>{now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} · {timeGreeting(now)}</span>
          </div>
          <div className="w-sign">
            <button type="button" onClick={signOut}>Sign out ↗</button>
          </div>
          <div className={`welcome show variant-${welcomeLayout}`}>
            <div className="welcome-inner">
              <div>
                {welcomeLayout !== 'minimal' && (
                  <div className="w-eyebrow">
                    <span className="dot"></span>
                    <span>Session active</span>
                  </div>
                )}
                <h1 className="w-title">
                  <span className="l1">{greetingCopy}</span>
                  <span className="l2">{finalName}.</span>
                </h1>
                {welcomeLayout !== 'minimal' && (
                  <p className="w-sub">
                    We're glad you're here. Your workspace is <span className="mono">ready</span>{' '}
                    — pick up where you left off, or start something new.
                  </p>
                )}
              </div>
              {welcomeLayout === 'split' && (
                <div className="w-right">
                  <h4>Today, in your space</h4>
                  <ul>
                    <li><span>Drafts</span><span>3</span></li>
                    <li><span>Pending invites</span><span>1</span></li>
                    <li><span>Workspace</span><span className="mono">{finalName.toLowerCase()}-hq</span></li>
                    <li><span>Plan</span><span>Free · trial</span></li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function FormBody(props){
  const {
    mode, switchMode, signupBtnRef, signinBtnRef, togglePillRef, swapping,
    name, setName, email, setEmail, password, setPassword,
    emailTouched, setEmailTouched, pwTouched, setPwTouched, showPw, setShowPw,
    caps, handlePwKey, remember, setRemember, loading, error,
    eValid, eShowError, pStrength, pwError, canSubmit, authLayout
  } = props;

  return (
    <>
      <h1 className="heading">
        {mode === 'signup' ? 'Create your account' : 'Welcome back'}
      </h1>
      <p className="subhead">
        {mode === 'signup'
          ? 'A few details and your workspace is yours.'
          : 'Sign in to pick up where you left off.'}
      </p>

      <div className="toggle" role="tablist">
        <span className="pill" ref={togglePillRef}></span>
        <button type="button" ref={signupBtnRef}
          className={mode === 'signup' ? 'active' : ''}
          onClick={() => switchMode('signup')}>Sign up</button>
        <button type="button" ref={signinBtnRef}
          className={mode === 'signin' ? 'active' : ''}
          onClick={() => switchMode('signin')}>Sign in</button>
      </div>

      <div className={`form-area ${swapping ? 'swapping' : ''}`}>
        {mode === 'signup' && (
          <div className="field">
            <label className="field-label">Name</label>
            <div className="field-wrap">
              {authLayout !== 'minimal' && <span className="field-icon"><Icon.user/></span>}
              <input
                type="text"
                placeholder="Your full name"
                value={name}
                autoComplete="name"
                onChange={e => setName(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="field">
          <label className="field-label">Email</label>
          <div className={`field-wrap ${eShowError ? 'error' : (eValid ? 'valid' : '')}`}>
            {authLayout !== 'minimal' && <span className="field-icon"><Icon.mail/></span>}
            <input
              type="email"
              placeholder="you@domain.com"
              value={email}
              autoComplete="email"
              onChange={e => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
            />
            {eValid && authLayout !== 'minimal' && <span className="field-icon tick"><Icon.tick/></span>}
            {eShowError && authLayout !== 'minimal' && <span className="field-icon warn"><Icon.warn/></span>}
          </div>
          <div className="field-meta">
            {eShowError
              ? <span className="field-err"><Icon.warn/> Check your email format</span>
              : <span className="field-hint">{eValid ? 'Looks good' : 'We\'ll never share it.'}</span>}
          </div>
        </div>

        <div className="field">
          <label className="field-label">Password</label>
          <div className={`field-wrap ${pwError ? 'error' : ''}`}>
            {authLayout !== 'minimal' && <span className="field-icon"><Icon.lock/></span>}
            <input
              type={showPw ? 'text' : 'password'}
              placeholder={mode === 'signup' ? 'Create a password' : 'Your password'}
              value={password}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handlePwKey}
              onKeyUp={handlePwKey}
              onBlur={() => setPwTouched(true)}
            />
            <button type="button" className="eye"
              tabIndex={-1}
              onClick={() => setShowPw(s => !s)}
              aria-label={showPw ? 'Hide password' : 'Show password'}>
              {showPw ? <Icon.eyeOff/> : <Icon.eye/>}
            </button>
          </div>
          {mode === 'signup' && password.length > 0 && (
            <div className="field-meta">
              <div className="strength">
                {[1,2,3,4].map(i => (
                  <i key={i} className={pStrength >= i ? `on-${pStrength}` : ''}></i>
                ))}
              </div>
              <span className="strength-label mono">{STRENGTH_LABEL[pStrength] || ''}</span>
            </div>
          )}
          {mode === 'signin' && pwError && (
            <div className="field-meta">
              <span className="field-err"><Icon.warn/> Must be at least 6 characters</span>
            </div>
          )}
          {caps && (
            <div className="caps"><Icon.caps/> Caps lock is on</div>
          )}
        </div>

        {mode === 'signin' && (
          <div className="row">
            <label className="check">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}/>
              <span>Remember me</span>
            </label>
            <a className="forgot" href="#" onClick={e => e.preventDefault()}>Forgot password?</a>
          </div>
        )}

        {error && (
          <div className="field-meta" style={{marginBottom:14}}>
            <span className="field-err"><Icon.warn/> {error}</span>
          </div>
        )}

        <button type="submit" className="submit" disabled={!canSubmit}>
          {loading ? (
            <><span className="spinner"></span><span>{mode === 'signup' ? 'Creating account…' : 'Signing in…'}</span></>
          ) : (
            <><span>{mode === 'signup' ? 'Create account' : 'Sign in'}</span><span className="arr"><Icon.arrow/></span></>
          )}
        </button>

        {mode === 'signup' && (
          <div className="legal">
            By continuing you agree to our <a href="#" style={{color:'rgba(232,236,242,.6)'}} onClick={e=>e.preventDefault()}>Terms</a> and <a href="#" style={{color:'rgba(232,236,242,.6)'}} onClick={e=>e.preventDefault()}>Privacy</a>.
          </div>
        )}

        <div className="swap">
          {mode === 'signup'
            ? <>Already have an account?<a onClick={() => switchMode('signin')}>Sign in</a></>
            : <>New here?<a onClick={() => switchMode('signup')}>Create an account</a></>}
        </div>
      </div>
    </>
  );
}

Object.assign(window, { AuthApp });
