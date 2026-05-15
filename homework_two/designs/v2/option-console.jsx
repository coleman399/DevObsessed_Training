/* ─────────────────────────────────────────────────────────────────────────
 * Option C · "Console"
 * Modern SaaS feel — narrow icon rail nav + main canvas + persistent
 * collapsible AI dock at the bottom (like Copilot Chat in VS Code).
 * Mobile: rail collapses to a bottom tab bar, dock fills screen on expand.
 *   1. Microsoft sign-in (full-bleed split, blueprint grid)
 *   2. Onboarding as a card-based 5-step inline flow
 *   3. Station: rail | canvas | bottom AI dock
 * ───────────────────────────────────────────────────────────────────────── */

const OPTC = (function () {
  const { useState, useEffect, useRef } = React;

  /* ───────── Sign-in ───────── */

  function SignIn({ onSignIn }) {
    const [loading, setLoading] = useState(false);
    return (
      <div style={{
        position: 'absolute', inset: 0,
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        background: 'var(--bg)',
      }}>
        {/* Left: navy hero */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(160deg, var(--agp-navy-700) 0%, var(--agp-navy-900) 100%)',
          color: '#fff',
          padding: '60px 56px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          {/* Blueprint grid overlay */}
          <div aria-hidden style={{
            position: 'absolute', inset: 0,
            backgroundImage:
              'linear-gradient(rgba(235,182,59,.06) 1px, transparent 1px),' +
              'linear-gradient(90deg, rgba(235,182,59,.06) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }} />
          <div aria-hidden style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(60% 50% at 30% 30%, rgba(235,182,59,.18) 0%, transparent 60%)',
            mixBlendMode: 'screen',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <AGPLogo height={36} style={{ filter: 'drop-shadow(0 2px 12px rgba(0,0,0,.4))' }} />
          </div>
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 460 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>
              ● command_station / v2.0
            </div>
            <h1 style={{ margin: '14px 0 0', fontSize: 42, fontWeight: 500, lineHeight: 1.05, letterSpacing: '-.02em' }}>
              The whole stack,
              <br />
              <span style={{
                background: 'linear-gradient(110deg, var(--accent), #fff 80%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontStyle: 'italic',
                fontWeight: 400,
              }}>one console.</span>
            </h1>
            <p style={{ marginTop: 18, fontSize: 14.5, lineHeight: 1.6, color: 'rgba(255,255,255,.7)' }}>
              Azure DevOps, GitHub, Outlook, Calendar, and Teams — all reachable from a single
              keyboard-driven workspace. Your Claude assistant is right there with you.
            </p>
            <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(2, auto)', gap: '10px 28px', fontSize: 12.5, color: 'rgba(255,255,255,.65)' }}>
              {[
                ['⌘K', 'Jump to anything'],
                ['⌘J', 'Toggle assistant'],
                ['⇧⌘P', 'Run a command'],
                ['/',   'Quick search'],
              ].map(([k, label]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '2px 8px', background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 4, minWidth: 30, textAlign: 'center' }}>{k}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: 'relative', zIndex: 1, fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)' }}>
            agp.com · internal use only
          </div>
        </div>

        {/* Right: sign-in */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <div style={{ width: '100%', maxWidth: 380 }}>
            <h2 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-.01em', color: 'var(--text-primary)' }}>Sign in</h2>
            <p style={{ marginTop: 8, fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Use your AGP Microsoft account. We'll set up your assistant on the next screen.
            </p>
            <div style={{ marginTop: 24 }}>
              <MicrosoftSignIn loading={loading} onClick={() => {
                setLoading(true);
                setTimeout(() => { setLoading(false); onSignIn(); }, 1100);
              }} />
            </div>
            <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 10, fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.16em' }}>
              <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span>or use a passkey</span>
              <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            <div style={{ marginTop: 16, padding: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', background: 'var(--primary-soft)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="lock" size={16} />
              </span>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>Trouble signing in?</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>Reach out to <a href="#" style={{ color: 'var(--link)' }}>IT support</a></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ───────── Onboarding (cards) ───────── */

  function Onboarding({ onComplete }) {
    const [step, setStep] = useState(0);
    const [data, setData] = useState({
      role: 'SoftwareEngineer',
      assistant: 'AGP Assistant',
      anthropicKey: '',
      adoOrg: 'agp-co', adoProject: 'ELO Platform', adoPat: '',
      ghOrg: 'agp-co', ghPat: '',
      teamsChannels: [{ team: 'ELO Platform', channel: 'general' }],
    });
    const u = (p) => setData((d) => ({ ...d, ...p }));
    const steps = ['Role', 'Anthropic', 'Azure DevOps', 'GitHub', 'Teams'];

    return (
      <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{ padding: '0 28px', height: 56, display: 'flex', alignItems: 'center', gap: 16, background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <AGPLogo height={24} />
          <div style={{ height: 22, width: 1, background: 'var(--border)' }} />
          <div style={{ fontSize: 13, fontWeight: 500 }}>Welcome to your Command Console, Dillon.</div>
          <div style={{ marginLeft: 'auto', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.14em' }}>
            {step + 1} / {steps.length}
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'grid', placeItems: 'center', padding: 28 }}>
          <div style={{ width: '100%', maxWidth: 640 }}>
            {/* breadcrumb-style stepper */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 22 }}>
              {steps.map((s, i) => (
                <React.Fragment key={s}>
                  <span style={{
                    fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.14em',
                    color: i === step ? 'var(--primary)' : i < step ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                    fontWeight: i === step ? 700 : 500,
                  }}>
                    {i < step && <Icon name="check" size={11} style={{ marginRight: 4, verticalAlign: 'middle', color: 'var(--agp-green-status)' }} />}
                    {s}
                  </span>
                  {i < steps.length - 1 && <span style={{ color: 'var(--text-tertiary)' }}><Icon name="chevron-right" size={11} /></span>}
                </React.Fragment>
              ))}
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: 32, boxShadow: 'var(--shadow-md)' }}>
              {step === 0 && <RoleStep data={data} u={u} />}
              {step === 1 && <KeyStep  data={data} u={u} />}
              {step === 2 && <ADOStep  data={data} u={u} />}
              {step === 3 && <GHStep   data={data} u={u} />}
              {step === 4 && <TeamsStep data={data} u={u} />}
            </div>

            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Btn variant="ghost" icon="arrow-left" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Back</Btn>
              <div style={{ display: 'flex', gap: 6 }}>
                {steps.map((s, i) => <span key={i} style={{ width: 24, height: 4, borderRadius: 2, background: i <= step ? 'var(--primary)' : 'var(--surface-3)' }} />)}
              </div>
              <Btn variant="primary" iconRight="arrow-right" onClick={() => step + 1 >= steps.length ? onComplete(data) : setStep(step + 1)}>
                {step + 1 === steps.length ? 'Enter console' : 'Next'}
              </Btn>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function StepHeader({ kicker, title, sub }) {
    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700 }}>{kicker}</div>
        <h2 style={{ margin: '8px 0 4px', fontSize: 22, fontWeight: 600, letterSpacing: '-.01em' }}>{title}</h2>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{sub}</p>
      </div>
    );
  }
  function FieldLabel({ children }) { return <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 6 }}>{children}</div>; }
  function Input({ value, onChange, placeholder, type = 'text', mono, icon }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
        {icon && <span style={{ paddingLeft: 12, color: 'var(--text-tertiary)' }}><Icon name={icon} size={14} /></span>}
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '10px 12px', fontSize: 13.5, fontFamily: mono ? 'var(--font-mono)' : 'inherit', color: 'var(--text-primary)' }} />
      </div>
    );
  }
  function RoleStep({ data, u }) {
    const roles = [
      { k: 'ProductOwner',     l: 'Product Owner',     d: 'Refine backlog · draft stories', i: 'work' },
      { k: 'SoftwareEngineer', l: 'Software Engineer', d: 'Build · review · debug',          i: 'code' },
      { k: 'QA',               l: 'QA Engineer',       d: 'Test cases · bug reports',        i: 'bug' },
    ];
    return (
      <>
        <StepHeader kicker="step 01" title="Pick your role" sub="This only sets the assistant's system prompt — everyone can build work items, ship PRs, etc." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {roles.map((r) => (
            <button key={r.k} onClick={() => u({ role: r.k })} style={{
              padding: 18, borderRadius: 'var(--r-md)',
              background: data.role === r.k ? 'var(--primary-soft)' : 'var(--surface-2)',
              border: `1px solid ${data.role === r.k ? 'var(--primary)' : 'var(--border)'}`,
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10,
              cursor: 'pointer', textAlign: 'left',
            }}>
              <span style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', background: data.role === r.k ? 'var(--primary)' : 'var(--surface)', color: data.role === r.k ? '#fff' : 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                <Icon name={r.i} size={16} />
              </span>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{r.l}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 2 }}>{r.d}</div>
              </div>
            </button>
          ))}
        </div>
      </>
    );
  }
  function KeyStep({ data, u }) {
    return (
      <>
        <StepHeader kicker="step 02" title="Bring your Anthropic key" sub="Encrypted with AES-256-GCM before storing. Never appears in API responses." />
        <FieldLabel>Assistant name</FieldLabel>
        <Input value={data.assistant} onChange={(v) => u({ assistant: v })} placeholder="AGP Assistant" />
        <div style={{ height: 4 }} />
        <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 5 }}>Used in every reply, e.g. <span style={{ fontFamily: 'var(--font-mono)' }}>“● {data.assistant} · ready”</span>.</div>
        <div style={{ height: 18 }} />
        <FieldLabel>Anthropic API key</FieldLabel>
        <Input value={data.anthropicKey} onChange={(v) => u({ anthropicKey: v })} placeholder="sk-ant-api03-…" mono type="password" icon="lock" />
        <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 6 }}>Get a key at console.anthropic.com. Model: <span style={{ fontFamily: 'var(--font-mono)' }}>claude-sonnet-4-6</span>.</div>
      </>
    );
  }
  function ADOStep({ data, u }) {
    return (
      <>
        <StepHeader kicker="step 03" title="Connect Azure DevOps" sub="For work items, repos, and pull requests. Scopes: Work Items (RW), Code (RW), Pull Requests (Contribute)." />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div><FieldLabel>Organization</FieldLabel><Input value={data.adoOrg} onChange={(v) => u({ adoOrg: v })} mono icon="azure" /></div>
          <div><FieldLabel>Project</FieldLabel><Input value={data.adoProject} onChange={(v) => u({ adoProject: v })} mono /></div>
        </div>
        <div style={{ height: 14 }} />
        <FieldLabel>Personal access token</FieldLabel>
        <Input value={data.adoPat} onChange={(v) => u({ adoPat: v })} placeholder="dewj4ks…" mono type="password" icon="lock" />
      </>
    );
  }
  function GHStep({ data, u }) {
    return (
      <>
        <StepHeader kicker="step 04" title="Connect GitHub" sub="PAT scopes needed: repo + pull_request." />
        <FieldLabel>Org or username</FieldLabel>
        <Input value={data.ghOrg} onChange={(v) => u({ ghOrg: v })} mono icon="github" />
        <div style={{ height: 14 }} />
        <FieldLabel>Personal access token</FieldLabel>
        <Input value={data.ghPat} onChange={(v) => u({ ghPat: v })} placeholder="ghp_…" mono type="password" icon="lock" />
      </>
    );
  }
  function TeamsStep({ data, u }) {
    return (
      <>
        <StepHeader kicker="step 05" title="Pick Teams channels" sub="Up to 3 channels we'll watch for @mentions and replies." />
        <div style={{ display: 'grid', gap: 8 }}>
          {data.teamsChannels.map((c, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 32px', gap: 8, alignItems: 'end' }}>
              <div><FieldLabel>Team</FieldLabel><Input value={c.team} onChange={(v) => { const t = [...data.teamsChannels]; t[i] = { ...t[i], team: v }; u({ teamsChannels: t }); }} mono /></div>
              <div><FieldLabel>Channel</FieldLabel><Input value={c.channel} onChange={(v) => { const t = [...data.teamsChannels]; t[i] = { ...t[i], channel: v }; u({ teamsChannels: t }); }} mono /></div>
              <button onClick={() => u({ teamsChannels: data.teamsChannels.filter((_, j) => j !== i) })} style={{ width: 32, height: 38, color: 'var(--text-tertiary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--r-sm)' }}>
                <Icon name="x" size={14} />
              </button>
            </div>
          ))}
          {data.teamsChannels.length < 3 && (
            <button onClick={() => u({ teamsChannels: [...data.teamsChannels, { team: '', channel: '' }] })}
              style={{ padding: 12, borderRadius: 'var(--r-md)', border: '1px dashed var(--border-strong)', color: 'var(--text-secondary)', fontSize: 12.5, fontWeight: 500, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Icon name="plus" size={14} /> Add channel
            </button>
          )}
        </div>
      </>
    );
  }

  /* ───────── Station ───────── */

  function Station({ profile, onSignOut }) {
    const { theme, setTheme, role, assistant } = useAGP();
    const [view, setView] = useState('overview');     // overview | work | repos | mail | calendar | teams
    const [dockExpanded, setDockExpanded] = useState(false);
    const [active, setActive] = useState({ wi: null, pr: null, email: null, builder: false });

    return (
      <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', display: 'grid', gridTemplateColumns: 'auto 1fr', minHeight: 0 }}>
        <Rail view={view} setView={setView} theme={theme} setTheme={setTheme} profile={profile} onSignOut={onSignOut} />

        <div style={{ display: 'grid', gridTemplateRows: '1fr auto', minHeight: 0 }}>
          <main style={{ minHeight: 0, overflowY: 'auto' }}>
            <Header view={view} profile={profile} role={role} />
            <div style={{ padding: '0 28px 32px' }}>
              {view === 'overview' && <Overview onBuilder={() => setActive({ ...active, builder: true })} onOpenWI={(wi) => setActive({ ...active, wi })} onOpenPR={(pr) => setActive({ ...active, pr })} />}
              {view === 'work'     && <WorkView onOpen={(wi) => setActive({ ...active, wi })} onBuilder={() => setActive({ ...active, builder: true })} />}
              {view === 'repos'    && <ReposView onOpenPR={(pr) => setActive({ ...active, pr })} />}
              {view === 'mail'     && <MailView onOpen={(e) => setActive({ ...active, email: e })} />}
              {view === 'calendar' && <CalendarView />}
              {view === 'teams'    && <TeamsView />}
            </div>
          </main>
          <Dock assistant={assistant} expanded={dockExpanded} onToggle={() => setDockExpanded(!dockExpanded)} />
        </div>

        {active.builder && <Builder onClose={() => setActive({ ...active, builder: false })} />}
        {active.wi      && <WIDetail item={active.wi} onClose={() => setActive({ ...active, wi: null })} />}
        {active.pr      && <PRDetail pr={active.pr}   onClose={() => setActive({ ...active, pr: null })} />}
        {active.email   && <Compose email={active.email} onClose={() => setActive({ ...active, email: null })} />}
      </div>
    );
  }

  function Rail({ view, setView, theme, setTheme, profile, onSignOut }) {
    const items = [
      { k: 'overview', label: 'Overview',  icon: 'lightning' },
      { k: 'work',     label: 'Work items',icon: 'work',     count: AGP_MOCK.workItems.filter((w) => w.state !== 'Closed').length },
      { k: 'repos',    label: 'Repos & PRs', icon: 'pr',     count: AGP_MOCK.pullRequests.length },
      { k: 'mail',     label: 'Mail',      icon: 'mail',     count: AGP_MOCK.emails.filter((e) => e.unread).length },
      { k: 'calendar', label: 'Calendar',  icon: 'calendar' },
      { k: 'teams',    label: 'Teams',     icon: 'teams',    count: AGP_MOCK.teamsMentions.length },
    ];
    const [menu, setMenu] = useState(false);
    return (
      <aside style={{
        width: 72,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '14px 0',
        gap: 4,
      }}>
        {/* AGP mark */}
        <div style={{
          width: 44, height: 44, borderRadius: 'var(--r-md)',
          background: 'var(--primary)', color: '#fff',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 6,
          fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 800, letterSpacing: '.02em',
          border: '2px solid var(--accent)',
        }}>
          AGP
        </div>
        <div style={{ width: 32, height: 1, background: 'var(--border)', margin: '6px 0 8px' }} />

        {items.map((it) => {
          const active = view === it.k;
          return (
            <button key={it.k} onClick={() => setView(it.k)} title={it.label}
              style={{
                width: 48, height: 48, borderRadius: 'var(--r-md)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: active ? 'var(--primary)' : 'transparent',
                color: active ? '#fff' : 'var(--text-secondary)',
                position: 'relative',
                transition: 'all 140ms var(--ease-out)',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--surface-hover)'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon name={it.icon} size={18} />
              {it.count > 0 && (
                <span style={{
                  position: 'absolute', top: 8, right: 8,
                  fontSize: 9, fontFamily: 'var(--font-mono)',
                  background: active ? 'var(--accent)' : 'var(--accent)',
                  color: '#1a1306', fontWeight: 700,
                  padding: '0 4px', height: 14, borderRadius: 4,
                  lineHeight: '14px', minWidth: 14, textAlign: 'center',
                }}>{it.count}</span>
              )}
              {active && (
                <span style={{ position: 'absolute', left: -8, top: 14, bottom: 14, width: 3, borderRadius: 2, background: 'var(--accent)' }} />
              )}
            </button>
          );
        })}

        <div style={{ flex: 1 }} />

        <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} title="Toggle theme"
          style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
          <Icon name={theme === 'light' ? 'moon' : 'sun'} size={15} />
        </button>

        <div style={{ position: 'relative' }}>
          <button onClick={() => setMenu(!menu)} title={profile.name}
            style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent)', color: '#1a1306', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, marginTop: 4 }}>
            {profile.initials}
          </button>
          {menu && (
            <div style={{ position: 'absolute', left: 'calc(100% + 8px)', bottom: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-pop)', minWidth: 220, padding: 6, zIndex: 30 }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{profile.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{profile.email}</div>
              </div>
              <MenuItem icon="settings" label="Profile settings" />
              <MenuItem icon="lightning" label="Keyboard shortcuts" />
              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              <MenuItem icon="logout" label="Sign out" onClick={onSignOut} />
            </div>
          )}
        </div>
      </aside>
    );
  }
  function MenuItem({ icon, label, onClick }) {
    return (
      <button onClick={onClick} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--r-sm)', fontSize: 13, color: 'var(--text-primary)', textAlign: 'left' }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
        <Icon name={icon} size={14} style={{ color: 'var(--text-tertiary)' }} /> {label}
      </button>
    );
  }

  function Header({ view, profile, role }) {
    const titles = {
      overview: 'Overview',
      work:     'Work items',
      repos:    'Repositories & Pull Requests',
      mail:     'Mail',
      calendar: 'Calendar',
      teams:    'Teams',
    };
    return (
      <div style={{ padding: '24px 28px 18px', display: 'flex', alignItems: 'flex-end', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.16em' }}>
            ● {profile.firstName.toLowerCase()}@agp / {role === 'ProductOwner' ? 'po' : role === 'QA' ? 'qa' : 'se'}
          </div>
          <h1 style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 600, letterSpacing: '-.01em' }}>{titles[view]}</h1>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', width: 320, fontSize: 12.5 }}>
            <Icon name="search" size={13} style={{ color: 'var(--text-tertiary)' }} />
            <span style={{ color: 'var(--text-tertiary)' }}>Search anything…</span>
            <span style={{ marginLeft: 'auto', fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', padding: '1px 5px', border: '1px solid var(--border)', borderRadius: 3 }}>⌘K</span>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Overview ─── */

  function Overview({ onBuilder, onOpenWI, onOpenPR }) {
    const M = AGP_MOCK;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, animation: 'agpFadeIn 280ms var(--ease-out)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Hero card */}
          <div style={{
            padding: 24,
            background: 'linear-gradient(125deg, var(--primary) 0%, var(--agp-navy-800) 100%)',
            color: '#fff',
            borderRadius: 'var(--r-lg)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div aria-hidden style={{ position: 'absolute', right: -80, top: -80, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, var(--accent) 0%, transparent 60%)', opacity: 0.14 }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,.6)', textTransform: 'uppercase', letterSpacing: '.16em' }}>
                Wednesday · May 14
              </div>
              <h2 style={{ margin: '8px 0 0', fontSize: 26, fontWeight: 500, lineHeight: 1.2 }}>
                Good morning, Dillon.
                <br />
                <span style={{ color: 'rgba(255,255,255,.6)', fontSize: 17, fontWeight: 400 }}>You have 3 active items and 4 PRs waiting.</span>
              </h2>
              <div style={{ marginTop: 18, display: 'flex', gap: 8 }}>
                <Btn variant="accent" icon="sparkle" onClick={onBuilder}>Draft a work item</Btn>
                <Btn variant="secondary" icon="play" style={{ background: 'rgba(255,255,255,.12)', color: '#fff', border: '1px solid rgba(255,255,255,.18)' }}>Start focus block</Btn>
              </div>
            </div>
          </div>

          {/* Active items */}
          <Section title="Active work" sub="In your sprint">
            {M.workItems.filter((w) => w.state === 'Active').slice(0, 4).map((w) => (
              <button key={w.id} onClick={() => onOpenWI(w)} style={{
                width: '100%', textAlign: 'left',
                display: 'grid', gridTemplateColumns: '80px 80px 1fr auto', gap: 14,
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                transition: 'background 120ms',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-tertiary)' }}>#{w.id}</span>
                <WorkItemTypeBadge type={w.type} />
                <span style={{ fontSize: 13.5, fontWeight: 500 }}>{w.title}</span>
                <Icon name="chevron-right" size={14} style={{ color: 'var(--text-tertiary)' }} />
              </button>
            ))}
          </Section>

          {/* PRs */}
          <Section title="Review requested" sub={`${M.pullRequests.length} PRs across ADO + GitHub`}>
            {M.pullRequests.slice(0, 3).map((pr) => (
              <button key={pr.id} onClick={() => onOpenPR(pr)} style={{
                width: '100%', textAlign: 'left',
                padding: '12px 16px', borderBottom: '1px solid var(--border)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Icon name={pr.source === 'ado' ? 'azure' : 'github'} size={13} style={{ color: 'var(--text-tertiary)' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)' }}>!{pr.id}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{pr.title}</span>
                  <StateBadge state={pr.status} />
                </div>
                <div style={{ marginTop: 4, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{pr.author} · {pr.changes} · {pr.updated}</div>
              </button>
            ))}
          </Section>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Stat label="Drafts"     value="3" tone="navy" />
            <Stat label="Pending PRs" value="4" tone="amber" />
            <Stat label="Unread mail" value={String(M.emails.filter((e) => e.unread).length)} tone="navy" />
            <Stat label="@ Mentions"  value={String(M.teamsMentions.length)} tone="amber" />
          </div>

          <Section title="Up next" sub="Today + tomorrow">
            {M.events.slice(0, 4).map((ev, i) => {
              const c = ev.color === 'amber' ? { bg: 'var(--accent-soft)', accent: 'var(--accent)', fg: '#7a5a05' }
                      : ev.color === 'navy'  ? { bg: 'var(--primary-soft)', accent: 'var(--primary)', fg: 'var(--primary)' }
                      : { bg: 'var(--surface-3)', accent: 'var(--text-tertiary)', fg: 'var(--text-secondary)' };
              return (
                <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 44, textAlign: 'center', padding: 6, background: c.bg, borderRadius: 'var(--r-sm)' }}>
                    <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: c.fg, fontWeight: 700, textTransform: 'uppercase' }}>{ev.day}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: c.fg }}>{ev.date}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{ev.title}</div>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginTop: 2 }}>{ev.time}</div>
                  </div>
                  {ev.teams && <Btn size="sm" variant="ghost" icon="teams">Join</Btn>}
                </div>
              );
            })}
          </Section>

          <Section title="Build" sub="Latest CI runs">
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--agp-green-status)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>main #4882</span>
              <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>passed · 4m ago</span>
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>feature/pin-files #4881</span>
              <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>building · 1m</span>
            </div>
          </Section>
        </div>
      </div>
    );
  }

  function Section({ title, sub, children }) {
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
          {sub && <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.08em' }}>{sub}</div>}
        </div>
        {children}
      </div>
    );
  }
  function Stat({ label, value, tone }) {
    const c = tone === 'amber' ? { bg: 'var(--accent-soft)', fg: '#7a5a05', dot: 'var(--accent)' } : { bg: 'var(--primary-soft)', fg: 'var(--primary)', dot: 'var(--primary)' };
    return (
      <div style={{ padding: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
        <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.1em', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot }} /> {label}
        </div>
        <div style={{ fontSize: 26, fontWeight: 600, marginTop: 4, color: 'var(--text-primary)', letterSpacing: '-.01em' }}>{value}</div>
      </div>
    );
  }

  /* ─── Other views (simpler than overview, sharing patterns) ─── */

  function WorkView({ onOpen, onBuilder }) {
    const [filter, setFilter] = useState('all');
    const M = AGP_MOCK;
    const items = M.workItems.filter((w) => filter === 'all' ? true : w.type.toLowerCase() === filter);
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[['all','All'], ['bug','Bugs'], ['user story','Stories'], ['task','Tasks']].map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)} style={{
                padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                background: filter === k ? 'var(--primary)' : 'transparent',
                color: filter === k ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${filter === k ? 'var(--primary)' : 'var(--border)'}`,
              }}>{l}</button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Btn variant="accent" icon="sparkle" onClick={onBuilder}>Draft with AI</Btn>
            <Btn variant="primary" icon="plus">New</Btn>
          </div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
          {items.map((w, i) => (
            <button key={w.id} onClick={() => onOpen(w)} style={{
              width: '100%', textAlign: 'left',
              display: 'grid', gridTemplateColumns: '90px 90px 1fr auto auto', gap: 16,
              padding: '14px 18px', alignItems: 'center',
              borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-tertiary)', fontWeight: 600 }}>#{w.id}</span>
              <WorkItemTypeBadge type={w.type} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{w.title}</div>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginTop: 3 }}>{w.area} · {w.points}pt</div>
              </div>
              <StateBadge state={w.state} />
              <Icon name="chevron-right" size={14} style={{ color: 'var(--text-tertiary)' }} />
            </button>
          ))}
        </div>
      </>
    );
  }

  function ReposView({ onOpenPR }) {
    const M = AGP_MOCK;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 14 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600 }}>Repositories</div>
          {M.repos.map((r, i) => (
            <button key={r.id} style={{
              width: '100%', textAlign: 'left',
              padding: '12px 16px', borderBottom: i < M.repos.length - 1 ? '1px solid var(--border)' : 'none',
              display: 'flex', alignItems: 'center', gap: 10,
              background: i === 0 ? 'var(--primary-soft)' : 'transparent',
            }}>
              <Icon name={r.source === 'ado' ? 'azure' : 'github'} size={13} style={{ color: 'var(--text-tertiary)' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{r.lang} · {r.updated}</div>
              </div>
              {r.prs > 0 && <Pill tone="navy" size="sm">{r.prs}</Pill>}
            </button>
          ))}
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>AGP.ELO.WebPortal · Pull Requests</span>
            <Btn variant="primary" size="sm" icon="plus" style={{ marginLeft: 'auto' }}>New PR</Btn>
          </div>
          {M.pullRequests.map((pr) => (
            <button key={pr.id} onClick={() => onOpenPR(pr)} style={{
              width: '100%', textAlign: 'left', padding: '14px 18px', borderBottom: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', gap: 6,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-tertiary)' }}>!{pr.id}</span>
                <StateBadge state={pr.status} />
                <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{pr.title}</span>
              </div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', display: 'flex', gap: 12 }}>
                <span>{pr.author}</span>
                <span>{pr.changes}</span>
                <span>{pr.comments} comments</span>
                <span style={{ marginLeft: 'auto' }}>{pr.updated}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  function MailView({ onOpen }) {
    const M = AGP_MOCK;
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Inbox · {M.emails.filter((e) => e.unread).length} unread</span>
          <Btn variant="primary" size="sm" icon="edit" style={{ marginLeft: 'auto' }}>Compose</Btn>
        </div>
        {M.emails.map((e, i) => (
          <button key={e.id} onClick={() => onOpen(e)} style={{
            width: '100%', textAlign: 'left',
            padding: '14px 18px',
            borderBottom: i < M.emails.length - 1 ? '1px solid var(--border)' : 'none',
            background: e.unread ? 'rgba(235,182,59,0.04)' : 'transparent',
            display: 'grid', gridTemplateColumns: '8px 200px 1fr auto', gap: 16, alignItems: 'center',
          }}
          onMouseEnter={(el) => el.currentTarget.style.background = 'var(--surface-hover)'}
          onMouseLeave={(el) => el.currentTarget.style.background = e.unread ? 'rgba(235,182,59,0.04)' : 'transparent'}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: e.unread ? 'var(--accent)' : 'transparent' }} />
            <span style={{ fontSize: 13, fontWeight: e.unread ? 600 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.from}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: e.unread ? 600 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.subject}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.preview}</div>
            </div>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{e.time}</span>
          </button>
        ))}
      </div>
    );
  }

  function CalendarView() {
    const M = AGP_MOCK;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const dates = [12, 13, 14, 15, 16];
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
        {days.map((d, i) => (
          <div key={d} style={{ borderRight: i < days.length - 1 ? '1px solid var(--border)' : 'none', padding: 14, minHeight: 320 }}>
            <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.14em' }}>{d}</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: i === 1 ? 'var(--accent)' : 'var(--text-primary)', marginBottom: 12 }}>{dates[i]}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {M.events.filter((ev) => ev.day === d).map((ev, j) => {
                const c = ev.color === 'amber' ? { bg: 'var(--accent-soft)', accent: 'var(--accent)', fg: '#7a5a05' }
                        : ev.color === 'navy'  ? { bg: 'var(--primary-soft)', accent: 'var(--primary)', fg: 'var(--primary)' }
                        : { bg: 'var(--surface-3)', accent: 'var(--text-tertiary)', fg: 'var(--text-secondary)' };
                return (
                  <div key={j} style={{ padding: '8px 10px', background: c.bg, borderLeft: `3px solid ${c.accent}`, borderRadius: 4 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: c.fg, lineHeight: 1.4 }}>{ev.title}</div>
                    <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: c.fg, opacity: 0.7, marginTop: 2 }}>{ev.time}</div>
                    {ev.teams && (
                      <button style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontFamily: 'var(--font-mono)', color: c.fg, padding: '2px 6px', background: 'rgba(255,255,255,.5)', borderRadius: 4 }}>
                        <Icon name="teams" size={10} /> Join
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function TeamsView() {
    const M = AGP_MOCK;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600 }}>@ Mentions</div>
          {M.teamsMentions.map((m, i) => (
            <div key={m.id} style={{ padding: '14px 18px', borderBottom: i < M.teamsMentions.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{m.from}</span>
                <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{m.channel}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{m.time}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{m.text}</div>
            </div>
          ))}
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600 }}>Channels</div>
          {M.teamsChannels.map((ch, i) => (
            <div key={ch.id} style={{ padding: '14px 18px', borderBottom: i < M.teamsChannels.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)', background: 'var(--primary-soft)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}>#</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{ch.team} <span style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>/ {ch.name}</span></div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.lastMessage}</div>
              </div>
              {ch.unread > 0 && <Pill tone="amber" size="sm">{ch.unread}</Pill>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ─── AI Dock (persistent bottom) ─── */

  function Dock({ assistant, expanded, onToggle }) {
    const [thread, setThread] = useState(AGP_MOCK.seedThread);
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const [streamTarget, setStreamTarget] = useState(null);
    const streamingOut = useStreamingText(streamTarget, { speed: 4, tick: 22 });
    const threadRef = useRef(null);

    useEffect(() => { const el = threadRef.current; if (el) el.scrollTop = el.scrollHeight; }, [thread, typing, streamingOut, expanded]);

    function send() {
      const text = input.trim();
      if (!text || typing) return;
      setThread((t) => [...t, { role: 'user', text }]);
      setInput('');
      setTyping(true);
      const reply = pickCannedReply(text);
      const tool = /pr|review|where|find|search|code/i.test(text);
      setTimeout(() => {
        if (tool) setThread((t) => [...t, { role: 'tool', label: 'search_code', detail: `"${text.slice(0,38)}"`, status: 'done', files: 3 }]);
      }, 400);
      setTimeout(() => { setTyping(false); setStreamTarget(reply); }, 1100);
      setTimeout(() => { setThread((t) => [...t, { role: 'assistant', text: reply }]); setStreamTarget(null); }, 1100 + Math.min(reply.length * 6, 2400));
    }

    return (
      <div style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        height: expanded ? 360 : 'auto',
        display: 'flex', flexDirection: 'column',
        transition: 'height 240ms var(--ease-out)',
        boxShadow: '0 -1px 0 var(--border)',
      }}>
        {/* Tab strip */}
        <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: expanded ? '1px solid var(--border)' : 'none' }}>
          <button onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 'var(--r-md)', background: expanded ? 'var(--primary-soft)' : 'transparent', color: expanded ? 'var(--primary)' : 'var(--text-primary)' }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--primary)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="sparkle" size={12} />
            </span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{assistant}</span>
            <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
              ● claude-sonnet-4-6
            </span>
            <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={12} style={{ marginLeft: 4, transform: expanded ? 'rotate(180deg)' : 'rotate(-90deg)', transition: 'transform 240ms' }} />
          </button>
          {!expanded && (
            <div style={{ display: 'flex', gap: 6, flex: 1, overflow: 'hidden' }}>
              {['Draft a User Story', 'Summarize PR #1147', 'Where is JwtTokenService?'].map((s) => (
                <button key={s} onClick={() => { onToggle(); setInput(s); }} style={{
                  padding: '5px 10px', background: 'var(--surface-2)', border: '1px solid var(--border)',
                  borderRadius: 999, fontSize: 11.5, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)',
                  whiteSpace: 'nowrap',
                }}>{s}</button>
              ))}
            </div>
          )}
          {!expanded && (
            <button onClick={onToggle} style={{ marginLeft: 'auto', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 4 }}>⌘J</button>
          )}
        </div>

        {expanded && (
          <>
            <div ref={threadRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {thread.map((m, i) => <DockBubble key={i} m={m} assistant={assistant} />)}
              {streamTarget && <DockBubble m={{ role: 'assistant', text: streamingOut + '▍' }} assistant={assistant} />}
              {typing && <Typing />}
            </div>

            <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '8px 8px 8px 12px' }}>
                <textarea value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                  rows={1} placeholder={`Ask ${assistant}…`}
                  style={{ flex: 1, resize: 'none', border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: 13.5, lineHeight: 1.5, padding: '4px 0', fontFamily: 'inherit', maxHeight: 120 }} />
                <button onClick={send} disabled={!input.trim() || typing} style={{
                  width: 30, height: 30, borderRadius: 'var(--r-sm)',
                  background: input.trim() && !typing ? 'var(--primary)' : 'var(--surface-3)',
                  color: input.trim() && !typing ? '#fff' : 'var(--text-tertiary)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="send" size={13} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  function DockBubble({ m, assistant }) {
    if (m.role === 'tool') return <ToolCall label={m.label} detail={m.detail} status="done" count={m.files || m.lines} />;
    const isUser = m.role === 'user';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', animation: 'agpFadeIn 240ms var(--ease-out)' }}>
        {!isUser && (
          <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} /> {assistant}
          </div>
        )}
        <div style={{
          maxWidth: '88%',
          padding: '9px 13px',
          fontSize: 13, lineHeight: 1.55,
          background: isUser ? 'var(--primary)' : 'var(--surface-2)',
          color:      isUser ? '#fff' : 'var(--text-primary)',
          border:     isUser ? 'none' : '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          borderBottomLeftRadius:  isUser ? 'var(--r-md)' : 4,
          borderBottomRightRadius: isUser ? 4 : 'var(--r-md)',
        }}>
          {m.text.split(/(`[^`]+`)/g).map((p, i) =>
            p.startsWith('`') && p.endsWith('`')
              ? <code key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, background: isUser ? 'rgba(255,255,255,.15)' : 'var(--surface-3)', padding: '1px 5px', borderRadius: 4 }}>{p.slice(1, -1)}</code>
              : <React.Fragment key={i}>{p}</React.Fragment>
          )}
        </div>
      </div>
    );
  }

  /* ───────── Modals — share with OPTB style (clean surface) ───────── */

  function Modal({ onClose, title, sub, children, width = 640 }) {
    useEffect(() => { const h = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
    return (
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(3,14,26,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40, padding: 24,
        animation: 'agpFadeIn 200ms var(--ease-out)',
      }}>
        <div onClick={(e) => e.stopPropagation()} style={{
          width: '100%', maxWidth: width, maxHeight: '88%',
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-lg)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
              {sub && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 3 }}>{sub}</div>}
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', color: 'var(--text-tertiary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              <Icon name="x" size={16} />
            </button>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>{children}</div>
        </div>
      </div>
    );
  }

  function Builder({ onClose }) {
    const [prompt, setPrompt] = useState('Spike: hot-reload the agentic tool loop in dev so we don\'t have to restart the API to iterate on tool definitions.');
    const [draft, setDraft] = useState(null);
    const [gen, setGen] = useState(false);
    function generate() {
      setGen(true); setDraft(null);
      setTimeout(() => {
        setDraft({
          type: 'Task',
          title: 'Hot-reload tool definitions in AnthropicChatService',
          description: "As an engineer, I want the agentic tool loop to pick up changes to tool definitions without restarting the API, so that I can iterate faster on new tools.",
          acceptanceCriteria: [
            "Tool definitions are loaded from a JSON file watched by FileSystemWatcher.",
            "Changes are debounced (200ms) before re-loading.",
            "Active chats use the current snapshot for the rest of the turn.",
            "A debug endpoint returns the active tool definitions.",
          ],
          tags: ['ai', 'devex'],
        });
        setGen(false);
      }, 1100);
    }
    return (
      <Modal onClose={onClose} title="Draft a work item with AI" sub="Plain language in, ADO work item out" width={700}>
        <div style={{ padding: 22 }}>
          <FieldLabel>Describe the work</FieldLabel>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} style={{
            width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
            padding: 12, fontSize: 13.5, lineHeight: 1.5, resize: 'vertical', outline: 'none', fontFamily: 'inherit', color: 'var(--text-primary)',
          }} />
          <div style={{ marginTop: 12 }}>
            <Btn icon="sparkle" onClick={generate} disabled={gen}>{gen ? 'Drafting…' : (draft ? 'Re-draft' : 'Generate draft')}</Btn>
          </div>
          {gen && <div style={{ marginTop: 12 }}><ToolCall label="Anthropic" detail="claude-sonnet-4-6 · drafting…" status="…" /></div>}
          {draft && (
            <div style={{ marginTop: 16, padding: 18, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}><WorkItemTypeBadge type={draft.type} /></div>
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }} />
              <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={4}
                style={{ width: '100%', marginTop: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: 10, fontSize: 13, lineHeight: 1.6, resize: 'vertical', outline: 'none', fontFamily: 'inherit', color: 'var(--text-primary)' }} />
              <div style={{ marginTop: 10, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Acceptance criteria</div>
              <ul style={{ margin: '6px 0 0', padding: '0 0 0 18px', fontSize: 13, lineHeight: 1.7 }}>{draft.acceptanceCriteria.map((a, i) => <li key={i}>{a}</li>)}</ul>
              <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>{draft.tags.map((t) => <Pill key={t}>{t}</Pill>)}</div>
            </div>
          )}
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" icon="azure" disabled={!draft} onClick={onClose}>Create in Azure DevOps</Btn>
        </div>
      </Modal>
    );
  }

  function WIDetail({ item, onClose }) {
    return (
      <Modal onClose={onClose} title={`#${item.id} · ${item.title}`} sub={`${item.area} · ${item.points} pts · updated ${item.updated}`} width={620}>
        <div style={{ padding: 22 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <WorkItemTypeBadge type={item.type} />
            <StateBadge state={item.state} />
            <Pill>Priority {item.priority}</Pill>
          </div>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            Live from Azure DevOps. State changes round-trip via PATCH operations on <code style={{ fontFamily: 'var(--font-mono)' }}>System.State</code>.
          </p>
          <div style={{ marginTop: 14, padding: 14, background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 'var(--r-md)' }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#7a5a05', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6, display: 'flex', gap: 6, alignItems: 'center' }}><Icon name="sparkle" size={12} /> Claude suggests</div>
            <div style={{ fontSize: 13, lineHeight: 1.55 }}>This bug is likely fixed by PR #1147's partial-cascade guard. I can draft a verification test plan if you want.</div>
          </div>
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'space-between' }}>
          <Btn variant="ghost" size="sm" icon="comment">Add comment</Btn>
          <Btn variant="primary" size="sm">Update state →</Btn>
        </div>
      </Modal>
    );
  }

  function PRDetail({ pr, onClose }) {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    function summarize() {
      setLoading(true);
      setTimeout(() => {
        setSummary({
          what: "Preserves dirty state on partial vehicle cascade. Splits the vehicle update from dirty-marking and guards the cascade for the empty-changes case.",
          why:  "Fixes #24812.",
          watch:["Guard skips cascade when changedVehicles is empty.", "Partial-cascade branch mutates the map in place.", "No e2e coverage on the empty path."],
        });
        setLoading(false);
      }, 1100);
    }
    return (
      <Modal onClose={onClose} title={`!${pr.id} · ${pr.title}`} sub={`${pr.repo} · ${pr.changes}`} width={720}>
        <div style={{ padding: 22 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <Pill tone="navy"><Icon name={pr.source === 'ado' ? 'azure' : 'github'} size={11} /> {pr.source === 'ado' ? 'Azure DevOps' : 'GitHub'}</Pill>
            <StateBadge state={pr.status} />
          </div>
          <Btn icon="sparkle" onClick={summarize} disabled={loading}>{loading ? 'Reading PR…' : 'Summarize with Claude'}</Btn>
          {loading && <div style={{ marginTop: 12 }}><ToolCall label="get_file" detail="vehicles-form.adapter.ts" status="…" /></div>}
          {summary && (
            <div style={{ marginTop: 14, padding: 16, background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 'var(--r-md)' }}>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}><strong>What:</strong> {summary.what}</p>
              <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.6 }}><strong>Why:</strong> {summary.why}</p>
              <p style={{ margin: '10px 0 4px', fontSize: 12.5, fontWeight: 600 }}>Watch in review:</p>
              <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 13, lineHeight: 1.65 }}>{summary.watch.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </div>
          )}
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Btn variant="secondary" size="sm">Reject</Btn>
          <Btn variant="primary" size="sm" icon="check">Approve</Btn>
        </div>
      </Modal>
    );
  }

  function Compose({ email, onClose }) {
    const [to, setTo] = useState(email.fromEmail || '');
    const [subj, setSubj] = useState(email.subject ? `Re: ${email.subject}` : '');
    const [body, setBody] = useState('');
    const [draft, setDraft] = useState(false);
    function aiDraft() {
      setDraft(true); setBody('');
      setTimeout(() => {
        setBody(`Hey ${(email.from || '').split(' ')[0] || 'there'},\n\nThanks for the flag — I'll take a second pass tonight and add the empty-changes guard. Will ping when ready.\n\n— Dillon`);
        setDraft(false);
      }, 1000);
    }
    return (
      <Modal onClose={onClose} title={email.subject ? `Reply · ${email.subject}` : 'Compose'} width={560}>
        <div style={{ padding: 22 }}>
          <FieldLabel>To</FieldLabel><Input value={to} onChange={setTo} mono />
          <div style={{ height: 10 }} />
          <FieldLabel>Subject</FieldLabel><Input value={subj} onChange={setSubj} />
          <div style={{ height: 10 }} />
          <FieldLabel>Body</FieldLabel>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} placeholder="Write a message…" style={{
            width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
            padding: 12, fontSize: 13.5, lineHeight: 1.6, resize: 'vertical', outline: 'none', fontFamily: 'inherit', color: 'var(--text-primary)',
          }} />
          <div style={{ marginTop: 12 }}>
            <Btn icon="sparkle" variant="secondary" onClick={aiDraft} disabled={draft}>{draft ? 'Drafting…' : 'Draft with AI'}</Btn>
          </div>
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Btn variant="ghost" onClick={onClose}>Discard</Btn>
          <Btn variant="primary" icon="send" disabled={!body.trim()}>Send</Btn>
        </div>
      </Modal>
    );
  }

  /* ───────── Root ───────── */

  function App() {
    const [screen, setScreen] = useState('auth');
    const [profile, setProfile] = useState({ ...AGP_MOCK.user });
    const { theme, setAssist } = useAGP();
    return (
      <div className={`agp-app theme-${theme}`} style={{ position: 'absolute', inset: 0 }}>
        {screen === 'auth'    && <SignIn onSignIn={() => setScreen('onboard')} />}
        {screen === 'onboard' && <Onboarding onComplete={(d) => { setAssist(d.assistant || 'AGP Assistant'); setProfile((p) => ({ ...p, ...d })); setScreen('station'); }} />}
        {screen === 'station' && <Station profile={profile} onSignOut={() => setScreen('auth')} />}
      </div>
    );
  }

  return { App };
})();

window.OPTC = OPTC;
