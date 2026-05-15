/* Shared UI primitives for the AGP Command Station prototypes.
 * Exports onto window so each option's JSX can pull them in.
 */
const { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } = React;

/* ─────────────────────────── Brand mark ─────────────────────────── */

function AGPLogo({ height = 28, monochrome = false, className = '', style = {} }) {
  /* Inline-recreated wordmark using the canonical AGP gold/green so we don't
     have to wait on a PNG load. The shape is approximated — for production,
     swap for the actual `assets/images/agp_logo.png` asset. */
  if (!monochrome) {
    return (
      <img
        src="assets/agp-logo.png"
        alt="AGP"
        height={height}
        className={className}
        style={{ height, width: 'auto', display: 'block', ...style }}
      />
    );
  }
  /* Monochrome variant: stacked AGP mark in current color */
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: 'var(--font-sans)',
        fontWeight: 800,
        fontSize: height * 0.6,
        letterSpacing: '0.04em',
        color: 'currentColor',
        ...style,
      }}
    >
      <span
        aria-hidden
        style={{
          width: height,
          height,
          borderRadius: 6,
          background: 'currentColor',
          color: 'var(--surface)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: height * 0.5,
          fontWeight: 800,
        }}
      >
        A
      </span>
      AGP
    </span>
  );
}

/* ─────────────────────────── Icons ─────────────────────────── */

function Icon({ name, size = 16, stroke = 1.6, className = '', style = {} }) {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth: stroke,
    strokeLinecap: 'round', strokeLinejoin: 'round',
    className, style: { flexShrink: 0, ...style },
  };
  switch (name) {
    case 'arrow-right':  return <svg {...props}><path d="M5 12h14M13 5l7 7-7 7" /></svg>;
    case 'arrow-left':   return <svg {...props}><path d="M19 12H5M11 5l-7 7 7 7" /></svg>;
    case 'arrow-up-right': return <svg {...props}><path d="M7 17 17 7M8 7h9v9" /></svg>;
    case 'chevron-down': return <svg {...props}><path d="m6 9 6 6 6-6" /></svg>;
    case 'chevron-right':return <svg {...props}><path d="m9 18 6-6-6-6" /></svg>;
    case 'chevron-left': return <svg {...props}><path d="m15 18-6-6 6-6" /></svg>;
    case 'check':        return <svg {...props}><path d="M5 12l5 5L20 7" /></svg>;
    case 'x':            return <svg {...props}><path d="M6 6l12 12M18 6 6 18" /></svg>;
    case 'plus':         return <svg {...props}><path d="M12 5v14M5 12h14" /></svg>;
    case 'search':       return <svg {...props}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>;
    case 'send':         return <svg {...props}><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" /></svg>;
    case 'sparkle':      return <svg {...props}><path d="M12 3 13.8 9.2 20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8L12 3Z" /></svg>;
    case 'mail':         return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>;
    case 'calendar':     return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>;
    case 'teams':        return <svg {...props}><circle cx="9" cy="11" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20c0-2.8 2.7-5 6-5s6 2.2 6 5M21 20c0-2-1.8-3.5-4-3.5" /></svg>;
    case 'git':          return <svg {...props}><circle cx="6" cy="6" r="2" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="15" r="2" /><path d="M6 8v8M8 6h6a4 4 0 0 1 4 4v3" /></svg>;
    case 'pr':           return <svg {...props}><circle cx="6" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><circle cx="6" cy="18" r="2" /><path d="M6 8v8M14 6h2a2 2 0 0 1 2 2v8" /><path d="m11 3 3 3-3 3" /></svg>;
    case 'folder':       return <svg {...props}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" /></svg>;
    case 'file':         return <svg {...props}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" /><path d="M14 3v6h6" /></svg>;
    case 'code':         return <svg {...props}><path d="m8 8-5 4 5 4M16 8l5 4-5 4M14 4l-4 16" /></svg>;
    case 'work':         return <svg {...props}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /></svg>;
    case 'bug':          return <svg {...props}><rect x="7" y="8" width="10" height="12" rx="5" /><path d="M12 8V4M9 5l-2-2M15 5l2-2M5 12H3M5 16H3M21 12h-2M21 16h-2M5 8H3M21 8h-2" /></svg>;
    case 'lightning':    return <svg {...props}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></svg>;
    case 'settings':     return <svg {...props}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M5 12H2M22 12h-3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" /></svg>;
    case 'menu':         return <svg {...props}><path d="M4 6h16M4 12h16M4 18h16" /></svg>;
    case 'pin':          return <svg {...props}><path d="M12 2v6l3 4v3H9v-3l3-4V2ZM12 15v7" /></svg>;
    case 'eye':          return <svg {...props}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>;
    case 'eye-off':      return <svg {...props}><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 22 12s-1 2-3 4M6 7C3.5 9 2 12 2 12s3.5 7 10 7c1.7 0 3.3-.4 4.7-1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>;
    case 'lock':         return <svg {...props}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;
    case 'user':         return <svg {...props}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></svg>;
    case 'sun':          return <svg {...props}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
    case 'moon':         return <svg {...props}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg>;
    case 'bell':         return <svg {...props}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M10 21a2 2 0 0 0 4 0" /></svg>;
    case 'logout':       return <svg {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>;
    case 'download':     return <svg {...props}><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>;
    case 'tag':          return <svg {...props}><path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Z" /><circle cx="8" cy="8" r="1.5" /></svg>;
    case 'dot':          return <svg {...props}><circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" /></svg>;
    case 'globe':        return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>;
    case 'play':         return <svg {...props}><path d="M6 4v16l14-8L6 4Z" fill="currentColor" stroke="none" /></svg>;
    case 'edit':         return <svg {...props}><path d="M4 20h4l11-11-4-4L4 16v4Z" /><path d="m15 5 4 4" /></svg>;
    case 'comment':      return <svg {...props}><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" /></svg>;
    case 'azure':
      return (
        <svg {...props} fill="currentColor" stroke="none">
          <path d="M11.3 4.5 5 18.4l-3 1.1h8.5L18 4.5h-6.7Zm.4 4 5.1 8.4L13 19.5l-5-1.1 3.7-9.9Z" />
        </svg>
      );
    case 'microsoft':
      /* Official 4-square Microsoft glyph; small enough to inline. */
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={{ flexShrink: 0, ...style }}>
          <rect x="2"  y="2"  width="9" height="9" fill="#F25022" />
          <rect x="13" y="2"  width="9" height="9" fill="#7FBA00" />
          <rect x="2"  y="13" width="9" height="9" fill="#00A4EF" />
          <rect x="13" y="13" width="9" height="9" fill="#FFB900" />
        </svg>
      );
    case 'github':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} style={{ flexShrink: 0, ...style }}>
          <path d="M12 1.3a10.7 10.7 0 0 0-3.4 20.8c.5.1.7-.2.7-.5v-2c-3 .6-3.6-1.3-3.6-1.3-.5-1.2-1.2-1.5-1.2-1.5-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 1.7 2.6 1.2 3.2.9.1-.7.4-1.2.7-1.5-2.4-.3-4.9-1.2-4.9-5.3 0-1.2.4-2.1 1.1-2.9-.1-.3-.5-1.4.1-2.8 0 0 .9-.3 2.9 1.1.9-.2 1.8-.4 2.8-.4s1.9.1 2.8.4c2-1.4 2.9-1.1 2.9-1.1.6 1.4.2 2.5.1 2.8.7.8 1.1 1.7 1.1 2.9 0 4.1-2.5 5-4.9 5.3.4.3.7 1 .7 2v3c0 .3.2.6.7.5A10.7 10.7 0 0 0 12 1.3Z"/>
        </svg>
      );
    default: return null;
  }
}

/* ─────────────────────────── App context ─────────────────────────── */

const AppCtx = createContext(null);

function AGPProvider({ children, initial = {} }) {
  const [theme, setTheme]       = useState(initial.theme || 'light');
  const [role, setRole]         = useState(initial.role || 'SoftwareEngineer');
  const [assistant, setAssist]  = useState(initial.assistant || 'AGP Assistant');
  /* Receive Tweaks broadcasts from the outer host page. */
  useEffect(() => {
    function onTweaks(e) {
      if (!e || !e.detail) return;
      const d = e.detail;
      if (d.theme)     setTheme(d.theme);
      if (d.role)      setRole(d.role);
      if (d.assistant) setAssist(d.assistant);
    }
    window.addEventListener('agp:tweaks', onTweaks);
    return () => window.removeEventListener('agp:tweaks', onTweaks);
  }, []);
  return (
    <AppCtx.Provider value={{ theme, setTheme, role, setRole, assistant, setAssist }}>
      {children}
    </AppCtx.Provider>
  );
}

function useAGP() { return useContext(AppCtx); }

/* ─────────────────────────── Building blocks ─────────────────────────── */

/* Tone-locked button used across all options. */
function Btn({ variant = 'primary', size = 'md', icon, iconRight, children, full, disabled, onClick, type = 'button', style = {}, ...rest }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontWeight: 500,
    fontSize: size === 'sm' ? 12.5 : size === 'lg' ? 15 : 13.5,
    padding: size === 'sm' ? '6px 12px' : size === 'lg' ? '12px 20px' : '9px 16px',
    borderRadius: size === 'sm' ? 'var(--r-sm)' : 'var(--r-md)',
    border: '1px solid transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 140ms var(--ease-out)',
    width: full ? '100%' : undefined,
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
    opacity: disabled ? 0.55 : 1,
  };
  const variants = {
    primary: {
      background: 'var(--primary)',
      color: 'var(--text-on-primary)',
      boxShadow: 'var(--shadow-sm)',
    },
    accent: {
      background: 'var(--accent)',
      color: 'var(--text-on-accent)',
      boxShadow: '0 1px 0 rgba(0,0,0,.04)',
    },
    secondary: {
      background: 'var(--surface)',
      color: 'var(--text-primary)',
      borderColor: 'var(--border)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
    },
    danger: {
      background: 'var(--agp-red)',
      color: '#fff',
    },
    link: {
      background: 'transparent',
      color: 'var(--link)',
      padding: '4px 6px',
      borderRadius: 4,
    },
  };
  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={(e) => { if (disabled) return; e.currentTarget.style.filter = 'brightness(1.04)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 13 : 15} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 13 : 15} />}
    </button>
  );
}

/* Sign-in with Microsoft button, real glyph + AGP-blue underlay on hover. */
function MicrosoftSignIn({ onClick, loading }) {
  return (
    <button
      onClick={loading ? undefined : onClick}
      disabled={loading}
      style={{
        width: '100%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '14px 20px',
        background: '#ffffff',
        color: '#0f1a2a',
        border: '1px solid #d2d8e0',
        borderRadius: 'var(--r-md)',
        fontWeight: 500,
        fontSize: 14.5,
        cursor: loading ? 'wait' : 'pointer',
        boxShadow: '0 1px 2px rgba(15,26,42,.05)',
        transition: 'all 160ms var(--ease-out)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(3,52,90,0.12)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d2d8e0'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,26,42,.05)'; }}
    >
      {loading
        ? <span style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #d2d8e0', borderTopColor: 'var(--primary)', animation: 'agpSpin 700ms linear infinite' }} />
        : <Icon name="microsoft" size={18} />}
      <span>{loading ? 'Signing you in…' : 'Sign in with Microsoft'}</span>
    </button>
  );
}

/* Generic accent pill, used for state/work-item types. */
function Pill({ tone = 'neutral', children, size = 'md', style = {} }) {
  const tones = {
    neutral: { bg: 'var(--surface-3)',          fg: 'var(--text-secondary)' },
    navy:    { bg: 'var(--primary-soft)',       fg: 'var(--primary)' },
    amber:   { bg: 'var(--accent-soft)',        fg: '#7a5a05' },
    green:   { bg: 'rgba(46,125,50,0.12)',      fg: 'var(--agp-green-status)' },
    red:     { bg: 'rgba(248,58,64,0.12)',      fg: 'var(--agp-red)' },
    purple:  { bg: 'rgba(123,31,162,0.12)',     fg: 'var(--agp-purple)' },
    orange:  { bg: 'rgba(230,81,0,0.12)',       fg: 'var(--agp-orange)' },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: size === 'sm' ? '2px 7px' : '3px 9px',
      background: t.bg, color: t.fg,
      fontSize: size === 'sm' ? 10.5 : 11.5,
      fontWeight: 600,
      borderRadius: 999,
      letterSpacing: '0.02em',
      lineHeight: 1.4,
      ...style,
    }}>
      {children}
    </span>
  );
}

/* Map work-item type → pill tone + short code. */
function WorkItemTypeBadge({ type }) {
  if (type === 'Bug')        return <Pill tone="red"    size="sm">● Bug</Pill>;
  if (type === 'User Story') return <Pill tone="navy"   size="sm">● Story</Pill>;
  if (type === 'Task')       return <Pill tone="amber"  size="sm">● Task</Pill>;
  return <Pill size="sm">{type}</Pill>;
}

function StateBadge({ state }) {
  const map = {
    Active:   { tone: 'navy',  label: 'Active' },
    New:      { tone: 'neutral', label: 'New' },
    Resolved: { tone: 'green', label: 'Resolved' },
    Closed:   { tone: 'neutral', label: 'Closed' },
    Draft:    { tone: 'amber', label: 'Draft' },
  };
  const cfg = map[state] || { tone: 'neutral', label: state };
  return <Pill tone={cfg.tone} size="sm">{cfg.label}</Pill>;
}

/* Tool-call status line, used inside the chat thread. */
function ToolCall({ label, detail, status, count }) {
  const icon = label === 'search_code' ? 'search'
            : label === 'get_file'    ? 'file'
            : label === 'list_directory' ? 'folder'
            : 'sparkle';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '6px 10px',
      background: 'var(--primary-soft)',
      borderLeft: '2px solid var(--primary)',
      borderRadius: 6,
      fontSize: 12.5,
      color: 'var(--text-secondary)',
      fontFamily: 'var(--font-mono)',
      animation: 'agpFadeIn 320ms var(--ease-out)',
    }}>
      <Icon name={icon} size={13} style={{ color: 'var(--primary)' }} />
      <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{label}</span>
      <span style={{ color: 'var(--text-tertiary)' }}>{detail}</span>
      <span style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }}>
        {status === 'done' && count != null ? `${count} result${count === 1 ? '' : 's'}` : status}
      </span>
    </div>
  );
}

/* Three-dot typing indicator used by the chat composer area. */
function Typing() {
  return (
    <div style={{ display: 'inline-flex', gap: 4, alignItems: 'center', padding: '10px 14px' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--text-tertiary)',
            animation: 'agpDot 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

/* Streaming character-by-character text effect. */
function useStreamingText(target, opts = {}) {
  const speed = opts.speed || 8;          // chars per tick
  const tick  = opts.tick || 16;          // ms
  const [out, setOut] = useState('');
  useEffect(() => {
    if (!target) { setOut(''); return; }
    setOut('');
    let i = 0;
    const id = setInterval(() => {
      i += speed;
      if (i >= target.length) {
        setOut(target);
        clearInterval(id);
      } else {
        setOut(target.slice(0, i));
      }
    }, tick);
    return () => clearInterval(id);
  }, [target, speed, tick]);
  return out;
}

/* Persistent "remember which mode the user picked" for variants */
function useLocalState(key, initial) {
  const [v, setV] = useState(() => {
    try { const raw = localStorage.getItem(key); return raw == null ? initial : JSON.parse(raw); }
    catch { return initial; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  }, [key, v]);
  return [v, setV];
}

/* Pick a canned reply based on what the user typed. */
function pickCannedReply(input) {
  const t = (input || '').toLowerCase();
  if (t.includes('pr') || t.includes('#1147') || t.includes('review')) return AGP_MOCK.cannedReplies.pr;
  if (t.includes('story') || t.includes('user story') || t.includes('draft'))  return AGP_MOCK.cannedReplies.story;
  if (t.includes('where') || t.includes('find') || t.includes('search') || t.includes('code')) return AGP_MOCK.cannedReplies.code;
  if (t.includes('test') || t.includes('qa') || t.includes('bug repro')) return AGP_MOCK.cannedReplies.test;
  return AGP_MOCK.cannedReplies.default;
}

/* Public exports */
Object.assign(window, {
  AGPLogo, Icon, AGPProvider, useAGP,
  Btn, MicrosoftSignIn, Pill, WorkItemTypeBadge, StateBadge,
  ToolCall, Typing, useStreamingText, useLocalState, pickCannedReply,
});
