/* ─────────────────────────────────────────────────────────────────────────
 * Option A · "Command Bridge"
 * Classic 3-pane Azure-portal-grade workspace.
 *   1. Microsoft sign-in (split card, AGP wordmark left)
 *   2. Stepped onboarding wizard (5 steps)
 *   3. Station: navy app bar → Chat | Work | M365 rail
 * ───────────────────────────────────────────────────────────────────────── */

const OPTA = (function () {
  const { useState, useEffect, useRef, useMemo, useCallback } = React;

  /* ───────────── Sign-in ───────────── */

  function SignIn({ onSignIn }) {
    const [loading, setLoading] = useState(false);
    function go() {
      setLoading(true);
      setTimeout(() => { setLoading(false); onSignIn(); }, 1200);
    }
    return (
      <div style={{
        position: 'absolute', inset: 0,
        background: 'var(--bg-grad)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}>
        {/* subtle navy grid pattern */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0,
          backgroundImage:
            'linear-gradient(rgba(3,52,90,0.05) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(3,52,90,0.05) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(60% 60% at 50% 50%, #000, transparent)',
          WebkitMaskImage: 'radial-gradient(60% 60% at 50% 50%, #000, transparent)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 380px)',
          width: '100%',
          maxWidth: 880,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}>
          {/* Left — brand panel */}
          <div style={{
            padding: '44px 40px',
            background: 'linear-gradient(170deg, var(--primary) 0%, var(--agp-navy-800) 100%)',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* corner amber glint */}
            <div aria-hidden style={{
              position: 'absolute', right: -100, top: -100,
              width: 280, height: 280, borderRadius: '50%',
              background: 'radial-gradient(circle, var(--accent) 0%, transparent 60%)',
              opacity: .14,
            }} />
            <AGPLogo height={36} style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,.25))' }} />
            <div style={{ marginTop: 36, fontSize: 13, fontFamily: 'var(--font-mono)', letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)' }}>
              Command Station
            </div>
            <h1 style={{ margin: '12px 0 0', fontSize: 32, fontWeight: 500, lineHeight: 1.15, letterSpacing: '-.01em' }}>
              Your day, your codebase,
              <br />
              <span style={{
                background: 'linear-gradient(110deg, var(--accent), #fff 80%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontStyle: 'italic',
                fontWeight: 400,
              }}>
                one command station.
              </span>
            </h1>
            <p style={{ marginTop: 18, fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,.72)', maxWidth: 340 }}>
              Azure DevOps, GitHub, Outlook, Teams, and a Claude-powered assistant —
              all wired to your AGP account.
            </p>
            <div style={{ marginTop: 'auto', paddingTop: 32, display: 'flex', gap: 24, fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,.45)', letterSpacing: '.12em', textTransform: 'uppercase' }}>
              <span>v2.0 · build 1147</span>
              <span style={{ marginLeft: 'auto' }}>● internal use only</span>
            </div>
          </div>
          {/* Right — sign-in */}
          <div style={{ padding: '44px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-.01em' }}>
              Sign in
            </h2>
            <p style={{ marginTop: 8, fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Use your AGP Microsoft account. We'll set up your assistant in the next step.
            </p>
            <div style={{ marginTop: 24 }}>
              <MicrosoftSignIn onClick={go} loading={loading} />
            </div>
            <div style={{
              marginTop: 18, display: 'flex', alignItems: 'center', gap: 10,
              fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase', letterSpacing: '.14em',
            }}>
              <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span>SSO via Entra ID</span>
              <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            <ul style={{ margin: '20px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
              {[
                ['user', 'Profile & directory access'],
                ['mail', 'Outlook mail + calendar'],
                ['teams', 'Teams channels & DMs'],
              ].map(([icon, text]) => (
                <li key={icon} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                  <span style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--primary-soft)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={icon} size={12} />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
            <p style={{ marginTop: 28, fontSize: 11, color: 'var(--text-quaternary)', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
              By signing in you agree to AGP's acceptable-use policy.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ───────────── Onboarding wizard ───────────── */

  function Onboarding({ onComplete }) {
    const STEPS = [
      { key: 'role',      label: 'Your role',     icon: 'user' },
      { key: 'anthropic', label: 'Anthropic key', icon: 'sparkle' },
      { key: 'ado',       label: 'Azure DevOps',  icon: 'azure' },
      { key: 'github',    label: 'GitHub',        icon: 'github' },
      { key: 'teams',     label: 'Teams',         icon: 'teams' },
    ];
    const [step, setStep] = useState(0);
    const [data, setData] = useState({
      role: 'SoftwareEngineer',
      assistant: 'AGP Assistant',
      anthropicKey: '',
      adoOrg: 'agp-co',
      adoProject: 'ELO Platform',
      adoPat: '',
      ghOrg: 'agp-co',
      ghPat: '',
      teamsChannels: [
        { team: 'ELO Platform', channel: 'general' },
        { team: 'ELO Platform', channel: 'dev-frontend' },
        { team: 'AGP Engineering', channel: 'announce' },
      ],
    });
    function update(patch) { setData((d) => ({ ...d, ...patch })); }
    function next() { step + 1 >= STEPS.length ? onComplete(data) : setStep(step + 1); }
    function prev() { setStep(Math.max(0, step - 1)); }

    return (
      <div style={{
        position: 'absolute', inset: 0,
        background: 'var(--bg-grad)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}>
        <div style={{
          width: '100%', maxWidth: 760,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}>
          {/* Header — navy strip with stepper */}
          <div style={{ padding: '20px 28px', background: 'var(--primary)', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <AGPLogo height={26} />
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)' }}>
                Set up · Step {step + 1} of {STEPS.length}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
              {STEPS.map((s, i) => (
                <div key={s.key} style={{
                  flex: 1, height: 3, borderRadius: 2,
                  background: i <= step ? 'var(--accent)' : 'rgba(255,255,255,.18)',
                  transition: 'background 240ms var(--ease-out)',
                }} />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
              <span style={{
                width: 28, height: 28, borderRadius: 'var(--r-sm)',
                background: 'rgba(255,255,255,.12)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={STEPS[step].icon} size={15} />
              </span>
              <div style={{ fontSize: 18, fontWeight: 500 }}>{STEPS[step].label}</div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '28px 28px 8px', minHeight: 280 }}>
            {step === 0 && <RoleStep data={data} update={update} />}
            {step === 1 && <AnthropicStep data={data} update={update} />}
            {step === 2 && <ADOStep data={data} update={update} />}
            {step === 3 && <GitHubStep data={data} update={update} />}
            {step === 4 && <TeamsStep data={data} update={update} />}
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 28px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface-2)',
          }}>
            <Btn variant="ghost" icon={step === 0 ? null : 'arrow-left'} onClick={prev} disabled={step === 0}>
              Back
            </Btn>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              {step + 1} / {STEPS.length}
            </div>
            <Btn variant="primary" iconRight="arrow-right" onClick={next}>
              {step + 1 === STEPS.length ? 'Enter the station' : 'Continue'}
            </Btn>
          </div>
        </div>
      </div>
    );
  }

  function Field({ label, hint, children }) {
    return (
      <label style={{ display: 'block', marginBottom: 14 }}>
        <span style={{
          display: 'block',
          fontSize: 11, fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase', letterSpacing: '.08em',
          color: 'var(--text-secondary)', fontWeight: 600,
          marginBottom: 7,
        }}>{label}</span>
        {children}
        {hint && <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 5 }}>{hint}</span>}
      </label>
    );
  }

  function Input({ value, onChange, placeholder, type = 'text', mono, icon, suffix }) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center',
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        transition: 'all 160ms var(--ease-out)',
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-soft)'; }}
      onBlur={ (e) => { e.currentTarget.style.borderColor = 'var(--border)';  e.currentTarget.style.boxShadow = 'none'; }}
      >
        {icon && <span style={{ paddingLeft: 12, color: 'var(--text-tertiary)' }}><Icon name={icon} size={15} /></span>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none', outline: 'none',
            padding: '11px 14px',
            fontSize: 13.5,
            fontFamily: mono ? 'var(--font-mono)' : 'inherit',
            color: 'var(--text-primary)',
            width: '100%',
          }}
        />
        {suffix && <span style={{ paddingRight: 12, color: 'var(--text-tertiary)', fontSize: 11.5, fontFamily: 'var(--font-mono)' }}>{suffix}</span>}
      </div>
    );
  }

  function RoleStep({ data, update }) {
    const roles = [
      { key: 'ProductOwner',     label: 'Product Owner',     desc: 'Refine backlogs, draft user stories with AI', icon: 'work' },
      { key: 'SoftwareEngineer', label: 'Software Engineer', desc: 'Build, review PRs, get code Q&A from Claude', icon: 'code' },
      { key: 'QA',               label: 'QA Engineer',       desc: 'Author test cases, draft bug reports',         icon: 'bug' },
    ];
    return (
      <>
        <p style={{ margin: '0 0 18px', fontSize: 13.5, color: 'var(--text-secondary)' }}>
          Pick the role you'll spend most of your day in. Everyone can build work items —
          this only changes the assistant's system prompt and a handful of shortcuts.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          {roles.map((r) => (
            <button
              key={r.key}
              onClick={() => update({ role: r.key })}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px',
                background: data.role === r.key ? 'var(--primary-soft)' : 'var(--surface-2)',
                border: `1px solid ${data.role === r.key ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 'var(--r-md)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 160ms var(--ease-out)',
              }}
            >
              <span style={{
                width: 36, height: 36, borderRadius: 'var(--r-sm)',
                background: data.role === r.key ? 'var(--primary)' : 'var(--surface)',
                color: data.role === r.key ? '#fff' : 'var(--primary)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid var(--border)',
              }}>
                <Icon name={r.icon} size={18} />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text-primary)' }}>{r.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.desc}</div>
              </div>
              {data.role === r.key && (
                <span style={{ color: 'var(--primary)' }}><Icon name="check" size={18} /></span>
              )}
            </button>
          ))}
        </div>
      </>
    );
  }

  function AnthropicStep({ data, update }) {
    return (
      <>
        <p style={{ margin: '0 0 18px', fontSize: 13.5, color: 'var(--text-secondary)' }}>
          Bring your own Anthropic API key. We encrypt it with AES-256-GCM
          before storing — it never appears in responses.
        </p>
        <Field label="What should your assistant be called?" hint="Default: AGP Assistant. Be friendly — they’ll see this name in every reply.">
          <Input value={data.assistant} onChange={(v) => update({ assistant: v })} placeholder="AGP Assistant" />
        </Field>
        <Field label="Anthropic API key" hint="Starts with sk-ant-. Get one at console.anthropic.com.">
          <Input value={data.anthropicKey} onChange={(v) => update({ anthropicKey: v })} placeholder="sk-ant-api-…" mono icon="lock" type="password" />
        </Field>
      </>
    );
  }

  function ADOStep({ data, update }) {
    return (
      <>
        <p style={{ margin: '0 0 18px', fontSize: 13.5, color: 'var(--text-secondary)' }}>
          We use your PAT for Work Items, Code, and Pull Requests. Read-write scope is enough.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Organization">
            <Input value={data.adoOrg} onChange={(v) => update({ adoOrg: v })} placeholder="agp-co" mono icon="azure" />
          </Field>
          <Field label="Project">
            <Input value={data.adoProject} onChange={(v) => update({ adoProject: v })} placeholder="ELO Platform" mono />
          </Field>
        </div>
        <Field label="Personal access token" hint="Scopes: Work Items (RW), Code (RW), Pull Requests (Contribute).">
          <Input value={data.adoPat} onChange={(v) => update({ adoPat: v })} placeholder="dewj4ks…" mono icon="lock" type="password" />
        </Field>
      </>
    );
  }

  function GitHubStep({ data, update }) {
    return (
      <>
        <p style={{ margin: '0 0 18px', fontSize: 13.5, color: 'var(--text-secondary)' }}>
          PAT scopes needed: <code style={{ background: 'var(--surface-3)', padding: '1px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 12 }}>repo</code> and <code style={{ background: 'var(--surface-3)', padding: '1px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 12 }}>pull_request</code>.
        </p>
        <Field label="GitHub org or username">
          <Input value={data.ghOrg} onChange={(v) => update({ ghOrg: v })} placeholder="agp-co" mono icon="github" />
        </Field>
        <Field label="Personal access token" hint="Create a fine-grained token at github.com/settings/tokens.">
          <Input value={data.ghPat} onChange={(v) => update({ ghPat: v })} placeholder="ghp_…" mono icon="lock" type="password" />
        </Field>
      </>
    );
  }

  function TeamsStep({ data, update }) {
    return (
      <>
        <p style={{ margin: '0 0 18px', fontSize: 13.5, color: 'var(--text-secondary)' }}>
          Pick up to 3 channels we'll monitor for @mentions and replies. You can change these later in Profile.
        </p>
        <div style={{ display: 'grid', gap: 8 }}>
          {data.teamsChannels.map((ch, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 28px', gap: 10,
              alignItems: 'center',
              padding: 10,
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
            }}>
              <Input value={ch.team}    onChange={(v) => { const t = [...data.teamsChannels]; t[i] = { ...t[i], team: v };    update({ teamsChannels: t }); }} placeholder="Team name"   mono />
              <Input value={ch.channel} onChange={(v) => { const t = [...data.teamsChannels]; t[i] = { ...t[i], channel: v }; update({ teamsChannels: t }); }} placeholder="Channel"     mono />
              <button onClick={() => update({ teamsChannels: data.teamsChannels.filter((_, j) => j !== i) })}
                style={{ background: 'transparent', color: 'var(--text-tertiary)', padding: 4, borderRadius: 4 }}>
                <Icon name="x" size={14} />
              </button>
            </div>
          ))}
          {data.teamsChannels.length < 3 && (
            <button
              onClick={() => update({ teamsChannels: [...data.teamsChannels, { team: '', channel: '' }] })}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: 10, background: 'transparent',
                border: '1px dashed var(--border-strong)',
                borderRadius: 'var(--r-md)',
                color: 'var(--text-secondary)', fontSize: 12.5, fontWeight: 500,
              }}>
              <Icon name="plus" size={14} /> Add channel
            </button>
          )}
        </div>
      </>
    );
  }

  /* ───────────── Command Station ───────────── */

  function Station({ profile, onSignOut }) {
    const { theme, setTheme, role, assistant } = useAGP();
    const M = AGP_MOCK;
    const [tab, setTab]                   = useState('work');   // work | repos | mail | calendar | teams
    const [activeWorkItem, setActiveWI]   = useState(null);
    const [showBuilder, setShowBuilder]   = useState(false);
    const [activePR, setActivePR]         = useState(null);
    const [composeOpen, setComposeOpen]   = useState(null);     // null | email object
    const [pinned, setPinned]             = useState([]);

    return (
      <div style={{
        position: 'absolute', inset: 0,
        background: 'var(--bg)',
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        minHeight: 0,
      }}>
        <TopBar profile={profile} onSignOut={onSignOut} theme={theme} setTheme={setTheme} role={role} />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 340px) minmax(0, 1fr) minmax(0, 320px)',
          minHeight: 0,
          overflow: 'hidden',
        }}>
          <ChatPanel pinned={pinned} setPinned={setPinned} assistant={assistant} />
          <WorkPanel
            tab={tab} setTab={setTab}
            role={role}
            onOpenWI={setActiveWI}
            onOpenPR={setActivePR}
            onCompose={setComposeOpen}
            onBuilder={() => setShowBuilder(true)}
            onPin={(name) => setPinned((p) => p.includes(name) ? p : [...p, name])}
          />
          <ContextRail />
        </div>

        {showBuilder    && <WorkItemBuilder onClose={() => setShowBuilder(false)} onCreated={() => setShowBuilder(false)} />}
        {activeWorkItem && <WorkItemDetail item={activeWorkItem} onClose={() => setActiveWI(null)} />}
        {activePR       && <PRDetail pr={activePR} onClose={() => setActivePR(null)} />}
        {composeOpen    && <ComposeEmail email={composeOpen} onClose={() => setComposeOpen(null)} />}
      </div>
    );
  }

  function TopBar({ profile, onSignOut, theme, setTheme, role }) {
    const [menu, setMenu] = useState(false);
    return (
      <div style={{
        background: 'var(--primary)',
        color: '#fff',
        padding: '0 20px',
        height: 56,
        display: 'flex', alignItems: 'center', gap: 18,
        position: 'relative',
        borderBottom: '3px solid var(--accent)',
      }}>
        <AGPLogo height={26} />
        <div style={{
          height: 22, width: 1,
          background: 'rgba(255,255,255,.22)',
          margin: '0 6px',
        }} />
        <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '.01em' }}>
          Command Station
          <span style={{ marginLeft: 10, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,.55)', letterSpacing: '.14em', textTransform: 'uppercase' }}>
            · {role === 'ProductOwner' ? 'PO' : role === 'QA' ? 'QA' : 'SE'}
          </span>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 12px',
          background: 'rgba(255,255,255,.08)',
          borderRadius: 999,
          fontSize: 12.5,
          color: 'rgba(255,255,255,.85)',
          width: 240,
        }}>
          <Icon name="search" size={14} />
          <span style={{ color: 'rgba(255,255,255,.55)' }}>Jump to work item, PR, file…</span>
          <span style={{ marginLeft: 'auto', fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,.5)', padding: '1px 6px', border: '1px solid rgba(255,255,255,.2)', borderRadius: 4 }}>⌘K</span>
        </div>

        <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.85)' }}>
          <Icon name={theme === 'light' ? 'moon' : 'sun'} size={16} />
        </button>
        <button style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.85)', position: 'relative' }}>
          <Icon name="bell" size={16} />
          <span style={{ position: 'absolute', top: 7, right: 7, width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
        </button>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenu((v) => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '4px 10px 4px 4px',
              background: 'rgba(255,255,255,.08)',
              borderRadius: 999,
            }}>
            <span style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--accent)', color: '#1a1306',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700,
            }}>{profile.initials}</span>
            <span style={{ fontSize: 13, color: '#fff' }}>{profile.firstName}</span>
            <Icon name="chevron-down" size={13} />
          </button>
          {menu && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 6px)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              boxShadow: 'var(--shadow-pop)',
              minWidth: 220,
              padding: 6,
              color: 'var(--text-primary)',
              zIndex: 30,
            }}>
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
      </div>
    );
  }

  function MenuItem({ icon, label, onClick }) {
    return (
      <button onClick={onClick} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', borderRadius: 'var(--r-sm)',
        fontSize: 13, color: 'var(--text-primary)', textAlign: 'left',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <Icon name={icon} size={14} style={{ color: 'var(--text-tertiary)' }} /> {label}
      </button>
    );
  }

  /* ───────── Chat panel ───────── */

  function ChatPanel({ pinned, setPinned, assistant }) {
    const M = AGP_MOCK;
    const [convId, setConvId] = useState('current');
    const [thread, setThread] = useState(M.seedThread);
    const [input, setInput]   = useState('');
    const [typing, setTyping] = useState(false);
    const [streamTarget, setStreamTarget] = useState(null);
    const streamingOut = useStreamingText(streamTarget, { speed: 4, tick: 22 });
    const threadRef = useRef(null);

    useEffect(() => {
      const el = threadRef.current; if (!el) return;
      el.scrollTop = el.scrollHeight;
    }, [thread, typing, streamingOut]);

    function send() {
      const text = input.trim();
      if (!text || typing) return;
      const user = { role: 'user', text };
      setThread((t) => [...t, user]);
      setInput('');
      setTyping(true);
      const reply = pickCannedReply(text);
      const useTool = /pr|review|where|find|search|code/i.test(text);
      setTimeout(() => {
        if (useTool) {
          setThread((t) => [...t, { role: 'tool', label: 'search_code', detail: `"${text.slice(0,38)}"`, status: 'done', files: 3 }]);
        }
      }, 500);
      setTimeout(() => {
        setTyping(false);
        setStreamTarget(reply);
      }, 1200);
      setTimeout(() => {
        setThread((t) => [...t, { role: 'assistant', text: reply }]);
        setStreamTarget(null);
      }, 1200 + Math.min(reply.length * 6, 2400));
    }

    return (
      <div style={{
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        minHeight: 0,
      }}>
        {/* Chat header */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{
            width: 28, height: 28, borderRadius: 'var(--r-sm)',
            background: 'var(--primary)', color: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="sparkle" size={14} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{assistant}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
              ● claude-sonnet-4-6 · ready
            </div>
          </div>
          <Btn variant="ghost" size="sm" icon="plus">New</Btn>
        </div>

        {/* Recents (collapsible) */}
        <details style={{ borderBottom: '1px solid var(--border)' }}>
          <summary style={{
            padding: '10px 18px', fontSize: 11, fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase', letterSpacing: '.14em',
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            listStyle: 'none',
          }}>
            <Icon name="chevron-right" size={12} /> Recent · {M.conversations.length}
          </summary>
          <div style={{ padding: '4px 10px 12px' }}>
            {M.conversations.slice(0, 4).map((c) => (
              <button key={c.id} style={{
                width: '100%', padding: '8px 8px',
                borderRadius: 'var(--r-sm)',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontSize: 12.5, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
                <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 2 }}>
                  {fmtRelative(c.updated)} · {c.turns} turns
                </div>
              </button>
            ))}
          </div>
        </details>

        {/* Pinned files */}
        {pinned.length > 0 && (
          <div style={{ padding: '8px 14px', display: 'flex', flexWrap: 'wrap', gap: 6, borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.1em', alignSelf: 'center' }}>
              <Icon name="pin" size={11} style={{ marginRight: 4 }} />Pinned
            </span>
            {pinned.map((p, i) => (
              <span key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '3px 8px',
                background: 'var(--accent-soft)',
                color: 'var(--text-on-accent)',
                fontSize: 11, fontFamily: 'var(--font-mono)',
                borderRadius: 4,
              }}>
                {p}
                <button onClick={() => setPinned((arr) => arr.filter((_, j) => j !== i))} style={{ color: 'var(--text-on-accent)' }}>
                  <Icon name="x" size={10} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Thread */}
        <div ref={threadRef} style={{
          flex: 1, minHeight: 0, overflowY: 'auto',
          padding: '16px 18px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {thread.map((m, i) => <Bubble key={i} m={m} assistant={assistant} />)}
          {streamTarget && <Bubble m={{ role: 'assistant', text: streamingOut + '▍' }} assistant={assistant} />}
          {typing && <Typing />}
        </div>

        {/* Composer */}
        <div style={{ padding: 12, borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 8,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            padding: '8px 8px 8px 12px',
            transition: 'all 160ms var(--ease-out)',
          }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={`Ask ${assistant} anything…`}
              rows={1}
              style={{
                flex: 1, resize: 'none', border: 'none', outline: 'none',
                background: 'transparent', color: 'var(--text-primary)',
                fontSize: 13.5, lineHeight: 1.5, padding: '4px 0',
                fontFamily: 'inherit',
                maxHeight: 120,
              }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || typing}
              style={{
                width: 32, height: 32,
                borderRadius: 'var(--r-sm)',
                background: input.trim() && !typing ? 'var(--primary)' : 'var(--surface-3)',
                color: input.trim() && !typing ? '#fff' : 'var(--text-tertiary)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 160ms var(--ease-out)',
              }}>
              <Icon name="send" size={14} />
            </button>
          </div>
          <div style={{ marginTop: 6, fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.1em', display: 'flex', justifyContent: 'space-between' }}>
            <span>↵ send · ⇧↵ newline</span>
            <span>Streaming via Anthropic SSE</span>
          </div>
        </div>
      </div>
    );
  }

  function Bubble({ m, assistant }) {
    if (m.role === 'tool') {
      return <ToolCall label={m.label} detail={m.detail} status={m.status === 'done' ? 'done' : '…'} count={m.files || m.lines} />;
    }
    const isUser = m.role === 'user';
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        animation: 'agpFadeIn 240ms var(--ease-out)',
      }}>
        {!isUser && (
          <div style={{
            fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)',
            textTransform: 'uppercase', letterSpacing: '.1em',
            marginBottom: 4,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
            {assistant}
          </div>
        )}
        <div style={{
          maxWidth: '88%',
          padding: '10px 14px',
          fontSize: 13.5,
          lineHeight: 1.55,
          background: isUser ? 'var(--primary)' : 'var(--surface-2)',
          color:      isUser ? '#fff' : 'var(--text-primary)',
          border:     isUser ? 'none' : '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          borderBottomLeftRadius:  isUser ? 'var(--r-md)' : 4,
          borderBottomRightRadius: isUser ? 4 : 'var(--r-md)',
        }}>
          {m.text.split(/(`[^`]+`)/g).map((part, i) =>
            part.startsWith('`') && part.endsWith('`')
              ? <code key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: isUser ? 'rgba(255,255,255,.15)' : 'var(--surface-3)', padding: '1px 5px', borderRadius: 4 }}>{part.slice(1, -1)}</code>
              : <React.Fragment key={i}>{part}</React.Fragment>
          )}
        </div>
      </div>
    );
  }

  /* ───────── Middle "Work" panel ───────── */

  function WorkPanel({ tab, setTab, role, onOpenWI, onOpenPR, onCompose, onBuilder, onPin }) {
    const tabs = [
      { key: 'work',     label: 'Work items', icon: 'work',    count: AGP_MOCK.workItems.filter((w) => w.state !== 'Closed').length },
      { key: 'repos',    label: 'Repos & PRs', icon: 'pr',      count: AGP_MOCK.pullRequests.length },
      { key: 'mail',     label: 'Email',      icon: 'mail',    count: AGP_MOCK.emails.filter((e) => e.unread).length },
      { key: 'calendar', label: 'Calendar',   icon: 'calendar' },
      { key: 'teams',    label: 'Teams',      icon: 'teams',   count: AGP_MOCK.teamsMentions.length },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--surface-2)' }}>
        {/* tabs */}
        <div style={{
          display: 'flex',
          padding: '0 18px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
        }}>
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '14px 14px 12px',
                  fontSize: 13, fontWeight: 500,
                  color: active ? 'var(--primary)' : 'var(--text-secondary)',
                  borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
                  marginBottom: -1,
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                <Icon name={t.icon} size={14} />
                {t.label}
                {t.count != null && (
                  <span style={{
                    fontSize: 10.5, fontFamily: 'var(--font-mono)',
                    color: active ? '#fff' : 'var(--text-tertiary)',
                    background: active ? 'var(--primary)' : 'var(--surface-3)',
                    padding: '1px 6px', borderRadius: 4, fontWeight: 600,
                  }}>{t.count}</span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 22px' }}>
          {tab === 'work'     && <WorkItemsTab    onOpen={onOpenWI} onBuilder={onBuilder} />}
          {tab === 'repos'    && <ReposTab        onOpenPR={onOpenPR} onPin={onPin} />}
          {tab === 'mail'     && <MailTab         onCompose={onCompose} />}
          {tab === 'calendar' && <CalendarTab     />}
          {tab === 'teams'    && <TeamsTab        />}
        </div>
      </div>
    );
  }

  function WorkItemsTab({ onOpen, onBuilder }) {
    const [filter, setFilter] = useState('all');
    const items = AGP_MOCK.workItems.filter((w) =>
      filter === 'all' ? true :
      filter === 'mine' ? true :
      w.type.toLowerCase() === filter
    );
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Assigned to me</h2>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
            WIQL · @me · state ≠ closed
          </span>
          <div style={{ marginLeft: 'auto' }}>
            <Btn variant="accent" icon="sparkle" onClick={onBuilder}>AI Work Item Builder</Btn>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
          {[
            ['all',  'All'],
            ['bug',  'Bugs'],
            ['user story', 'Stories'],
            ['task', 'Tasks'],
          ].map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)} style={{
              padding: '5px 12px', borderRadius: 999,
              fontSize: 12, fontWeight: 500,
              background: filter === k ? 'var(--primary)' : 'transparent',
              color:      filter === k ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${filter === k ? 'var(--primary)' : 'var(--border)'}`,
            }}>{label}</button>
          ))}
        </div>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          overflow: 'hidden',
        }}>
          {items.map((w, i) => (
            <button key={w.id} onClick={() => onOpen(w)}
              style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: '80px 90px 1fr auto auto',
                gap: 16,
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
                textAlign: 'left',
                transition: 'background 120ms',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-tertiary)', fontWeight: 600 }}>
                #{w.id}
              </span>
              <WorkItemTypeBadge type={w.type} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {w.title}
                </div>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginTop: 3 }}>
                  {w.area} · {w.points} pts · updated {w.updated}
                </div>
              </div>
              <StateBadge state={w.state} />
              <Icon name="chevron-right" size={14} style={{ color: 'var(--text-tertiary)' }} />
            </button>
          ))}
        </div>
      </>
    );
  }

  function ReposTab({ onOpenPR, onPin }) {
    const [source, setSource] = useState('ado');
    const M = AGP_MOCK;
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Repositories & Pull Requests</h2>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 0, background: 'var(--surface-3)', borderRadius: 'var(--r-sm)', padding: 3 }}>
            {['ado', 'github'].map((s) => (
              <button key={s} onClick={() => setSource(s)} style={{
                padding: '5px 12px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                background: source === s ? 'var(--surface)' : 'transparent',
                color: source === s ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: source === s ? 'var(--shadow-sm)' : 'none',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                <Icon name={s === 'ado' ? 'azure' : 'github'} size={13} />
                {s === 'ado' ? 'Azure DevOps' : 'GitHub'}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: 16,
          minHeight: 380,
        }}>
          {/* repo tree (compact) */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            padding: 10,
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            maxHeight: 460, overflow: 'auto',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8, padding: '0 4px' }}>
              {source === 'ado' ? 'AGP.ELO.WebPortal' : 'agp-co/command-station'}
            </div>
            <Tree items={M.repoTree} depth={0} onPin={onPin} />
          </div>

          {/* PR list */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="pr" size={14} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>Pull requests · review requested</span>
              <Btn size="sm" variant="ghost" icon="plus" style={{ marginLeft: 'auto' }}>New PR</Btn>
            </div>
            {M.pullRequests.filter((pr) => pr.source === source).map((pr) => (
              <button key={pr.id} onClick={() => onOpenPR(pr)} style={{
                width: '100%', textAlign: 'left',
                display: 'flex', flexDirection: 'column', gap: 6,
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                transition: 'background 120ms',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-tertiary)', fontWeight: 600 }}>!{pr.id}</span>
                  <StateBadge state={pr.status} />
                  <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)', flex: 1 }}>{pr.title}</span>
                </div>
                <div style={{ display: 'flex', gap: 14, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                  <span>{pr.author}</span>
                  <span>{pr.changes}</span>
                  <span>{pr.comments} comments</span>
                  <span style={{ marginLeft: 'auto' }}>{pr.updated}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </>
    );
  }

  function Tree({ items, depth, onPin }) {
    return items.map((it, i) => {
      const [open, setOpen] = useState(depth < 1);
      return (
        <div key={it.name + i}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '3px 4px',
            borderRadius: 4,
            cursor: 'pointer',
          }}
          onClick={() => { if (it.type === 'folder') setOpen(!open); else onPin && onPin(it.name); }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ width: depth * 12 }} />
            <Icon name={it.type === 'folder' ? (open ? 'folder' : 'folder') : 'file'} size={12}
              style={{ color: it.type === 'folder' ? 'var(--primary)' : 'var(--text-tertiary)' }} />
            <span style={{ color: 'var(--text-primary)' }}>{it.name}</span>
            {it.type === 'file' && (
              <button onClick={(e) => { e.stopPropagation(); onPin && onPin(it.name); }}
                style={{ marginLeft: 'auto', color: 'var(--text-tertiary)', padding: 2 }}
                title="Pin to chat">
                <Icon name="pin" size={11} />
              </button>
            )}
          </div>
          {it.type === 'folder' && open && it.children && <Tree items={it.children} depth={depth + 1} onPin={onPin} />}
        </div>
      );
    });
  }

  function MailTab({ onCompose }) {
    const M = AGP_MOCK;
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Inbox</h2>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
            {M.emails.filter((e) => e.unread).length} unread
          </span>
          <Btn variant="primary" icon="edit" style={{ marginLeft: 'auto' }} onClick={() => onCompose({ from: '', subject: '', preview: '' })}>Compose</Btn>
        </div>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          overflow: 'hidden',
        }}>
          {M.emails.map((e, i) => (
            <button key={e.id} onClick={() => onCompose(e)} style={{
              width: '100%', textAlign: 'left',
              display: 'grid', gridTemplateColumns: '8px 1fr auto', gap: 14,
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: i < M.emails.length - 1 ? '1px solid var(--border)' : 'none',
              background: e.unread ? 'rgba(235,182,59,0.04)' : 'transparent',
              transition: 'background 120ms',
            }}
            onMouseEnter={(el) => el.currentTarget.style.background = 'var(--surface-hover)'}
            onMouseLeave={(el) => el.currentTarget.style.background = e.unread ? 'rgba(235,182,59,0.04)' : 'transparent'}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: e.unread ? 'var(--accent)' : 'transparent' }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                  <span style={{ fontSize: 13.5, fontWeight: e.unread ? 600 : 500, color: 'var(--text-primary)' }}>{e.from}</span>
                  <span style={{ fontSize: 13, color: e.unread ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: e.unread ? 500 : 400, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.subject}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {e.preview}
                </div>
              </div>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{e.time}</span>
            </button>
          ))}
        </div>
      </>
    );
  }

  function CalendarTab() {
    const M = AGP_MOCK;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const dates = [12, 13, 14, 15, 16];
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>This week</h2>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.1em' }}>May 12 – 16, 2026</span>
          <Btn variant="primary" icon="plus" style={{ marginLeft: 'auto' }}>New event</Btn>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 8,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          padding: 12,
        }}>
          {days.map((d, i) => (
            <div key={d} style={{ minHeight: 280, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.1em' }}>{d}</div>
                <div style={{ fontSize: 18, fontWeight: 500, color: i === 1 ? 'var(--accent)' : 'var(--text-primary)' }}>{dates[i]}</div>
              </div>
              {M.events.filter((ev) => ev.day === d).map((ev, j) => {
                const tone = ev.color;
                const colors = {
                  navy:    { bg: 'var(--primary-soft)',    fg: 'var(--primary)',          accent: 'var(--primary)' },
                  amber:   { bg: 'var(--accent-soft)',     fg: '#7a5a05',                 accent: 'var(--accent)' },
                  neutral: { bg: 'var(--surface-3)',       fg: 'var(--text-secondary)',   accent: 'var(--text-tertiary)' },
                };
                const c = colors[tone];
                return (
                  <div key={j} style={{
                    padding: '7px 8px',
                    background: c.bg,
                    borderLeft: `3px solid ${c.accent}`,
                    borderRadius: 4,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: c.fg, lineHeight: 1.3 }}>{ev.title}</div>
                    <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: c.fg, opacity: 0.7, marginTop: 2 }}>{ev.time}</div>
                    {ev.teams && <Btn size="sm" variant="ghost" icon="teams" style={{ padding: '2px 6px', marginTop: 4, fontSize: 10.5, color: c.fg }}>Join</Btn>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </>
    );
  }

  function TeamsTab() {
    const M = AGP_MOCK;
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Mentions & channels</h2>
          <Btn variant="primary" icon="send" style={{ marginLeft: 'auto' }}>Post to channel</Btn>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>@ Mentions</div>
            {M.teamsMentions.map((m, i) => (
              <div key={m.id} style={{ padding: '12px 16px', borderBottom: i < M.teamsMentions.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{m.from}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{m.channel}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{m.time}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>{m.text}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Monitored channels</div>
            {M.teamsChannels.map((ch, i) => (
              <div key={ch.id} style={{ padding: '12px 16px', borderBottom: i < M.teamsChannels.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>{ch.team}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>#{ch.name}</span>
                  {ch.unread > 0 && <span style={{ marginLeft: 'auto', fontSize: 10.5, fontFamily: 'var(--font-mono)', background: 'var(--accent)', color: '#1a1306', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>{ch.unread}</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{ch.lastMessage}</div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  /* ───────── Right "M365" rail ───────── */

  function ContextRail() {
    const M = AGP_MOCK;
    return (
      <div style={{
        background: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
        minHeight: 0, overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 16,
        padding: '16px 16px',
      }}>
        <RailCard title="Today, in your space" icon="calendar">
          <Row label="Drafts"       value="3" />
          <Row label="Pending PRs"  value="4" />
          <Row label="Workspace"    value="elo-platform" mono />
          <Row label="Build"        value="●  passing" valueColor="var(--agp-green-status)" />
        </RailCard>
        <RailCard title="Up next" icon="calendar">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {M.events.slice(0, 3).map((ev, i) => (
              <div key={i} style={{
                padding: '8px 10px',
                background: 'var(--surface-2)',
                borderLeft: `3px solid ${ev.color === 'amber' ? 'var(--accent)' : ev.color === 'navy' ? 'var(--primary)' : 'var(--border-strong)'}`,
                borderRadius: 4,
              }}>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{ev.title}</div>
                <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {ev.day} · {ev.time}
                </div>
              </div>
            ))}
          </div>
        </RailCard>
        <RailCard title="Inbox" icon="mail">
          {M.emails.slice(0, 3).map((e) => (
            <div key={e.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {e.unread && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />}
                <span style={{ fontSize: 12.5, fontWeight: e.unread ? 600 : 500, color: 'var(--text-primary)' }}>{e.from}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{e.time}</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {e.subject}
              </div>
            </div>
          ))}
        </RailCard>
      </div>
    );
  }

  function RailCard({ title, icon, children }) {
    return (
      <div>
        <div style={{
          fontSize: 10.5, fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase', letterSpacing: '.14em',
          color: 'var(--text-tertiary)', marginBottom: 8,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Icon name={icon} size={12} /> {title}
        </div>
        <div style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          padding: '10px 12px',
        }}>
          {children}
        </div>
      </div>
    );
  }

  function Row({ label, value, valueColor, mono }) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '6px 0',
        borderBottom: '1px dashed var(--border)',
        fontSize: 12.5,
      }}>
        <span style={{ color: 'var(--text-tertiary)' }}>{label}</span>
        <span style={{
          color: valueColor || 'var(--text-primary)',
          fontFamily: mono ? 'var(--font-mono)' : 'inherit',
          fontWeight: 600,
        }}>{value}</span>
      </div>
    );
  }

  /* ───────── Modals ───────── */

  function ModalShell({ children, onClose, width = 720, title, subtitle }) {
    useEffect(() => {
      function onEsc(e) { if (e.key === 'Escape') onClose(); }
      window.addEventListener('keydown', onEsc);
      return () => window.removeEventListener('keydown', onEsc);
    }, [onClose]);
    return (
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(3, 14, 26, 0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 40,
        padding: 24,
        animation: 'agpFadeIn 180ms var(--ease-out)',
      }} onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()} style={{
          width: '100%', maxWidth: width,
          maxHeight: '92%',
          display: 'flex', flexDirection: 'column',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}>
          {(title || subtitle) && (
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                {title && <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>}
                {subtitle && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 3 }}>{subtitle}</div>}
              </div>
              <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', color: 'var(--text-tertiary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <Icon name="x" size={16} />
              </button>
            </div>
          )}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>{children}</div>
        </div>
      </div>
    );
  }

  function WorkItemBuilder({ onClose, onCreated }) {
    const [prompt, setPrompt] = useState('I want to add a button to pin files from the repo tree to a chat thread, so Claude can read them as context.');
    const [draft, setDraft]   = useState(null);
    const [generating, setGenerating] = useState(false);

    function generate() {
      setGenerating(true);
      setDraft(null);
      setTimeout(() => {
        setDraft({
          type: 'User Story',
          title: 'PO/SE can pin repo files to a chat thread for AI context',
          description:
            "As a developer using the Command Station, I want to pin files from the repo tree to my chat thread, so that the assistant has those files as known context for every message in the thread without using a tool call.",
          acceptanceCriteria: [
            'A pin icon appears on every file in the repo tree.',
            'Clicking pin adds the file as a pill above the chat composer.',
            'Pinned files are prepended to every message as system context.',
            'Pinned state persists across sessions for the active conversation.',
            'User can unpin a file from the chat composer.',
          ],
          tags: ['ai', 'chat', 'devex'],
        });
        setGenerating(false);
      }, 1400);
    }

    return (
      <ModalShell onClose={onClose} title="AI Work Item Builder" subtitle="Describe a feature, bug, or task. Claude drafts a structured work item that you can edit before creating in Azure DevOps." width={760}>
        <div style={{ padding: 22 }}>
          <Field label="What do you want to build?">
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} style={{
              width: '100%',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              padding: 12, fontSize: 13.5, lineHeight: 1.5,
              resize: 'vertical', outline: 'none',
              fontFamily: 'inherit',
              color: 'var(--text-primary)',
            }} />
          </Field>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn icon="sparkle" onClick={generate} disabled={generating}>
              {generating ? 'Drafting…' : (draft ? 'Re-generate draft' : 'Generate draft')}
            </Btn>
            {draft && <Btn variant="ghost" icon="edit">Edit prompt</Btn>}
          </div>

          {generating && (
            <div style={{ marginTop: 20, padding: 18, background: 'var(--surface-2)', border: '1px dashed var(--border)', borderRadius: 'var(--r-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)' }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'agpSpin 700ms linear infinite' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>Asking Claude…</span>
              </div>
            </div>
          )}

          {draft && (
            <div style={{ marginTop: 20, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <WorkItemTypeBadge type={draft.type} />
                <span style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>Draft · ready to edit</span>
              </div>
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} style={{
                width: '100%', background: 'transparent', border: 'none', outline: 'none',
                fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', padding: 0, marginBottom: 10,
              }} />
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.1em', marginTop: 12, marginBottom: 6 }}>Description</div>
              <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={4} style={{
                width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
                padding: 10, fontSize: 13, lineHeight: 1.55, resize: 'vertical', outline: 'none', fontFamily: 'inherit', color: 'var(--text-primary)',
              }} />
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.1em', marginTop: 14, marginBottom: 6 }}>Acceptance criteria</div>
              <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 13, lineHeight: 1.7, color: 'var(--text-primary)' }}>
                {draft.acceptanceCriteria.map((ac, i) => <li key={i}>{ac}</li>)}
              </ul>
              <div style={{ marginTop: 14, display: 'flex', gap: 6 }}>
                {draft.tags.map((t) => <Pill key={t} tone="neutral">{t}</Pill>)}
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end', background: 'var(--surface-2)' }}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" icon="azure" disabled={!draft} onClick={onCreated}>Create in Azure DevOps</Btn>
        </div>
      </ModalShell>
    );
  }

  function WorkItemDetail({ item, onClose }) {
    return (
      <ModalShell onClose={onClose} title={`#${item.id} · ${item.title}`} subtitle={`${item.area} · ${item.points} points · updated ${item.updated}`} width={680}>
        <div style={{ padding: 22 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <WorkItemTypeBadge type={item.type} />
            <StateBadge state={item.state} />
            <Pill tone="neutral">Priority {item.priority}</Pill>
          </div>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            This work item is pulled live from Azure DevOps using a WIQL <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--surface-3)', padding: '1px 4px', borderRadius: 4 }}>SELECT [Id],[Title],[State]…</code> query against the assigned-to-me filter.
          </p>
          <div style={{ marginTop: 16, padding: 14, background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 'var(--r-md)' }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#7a5a05', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
              <Icon name="sparkle" size={12} /> Claude suggests
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.55 }}>
              This bug is likely linked to the partial-cascade branch in PR #1147. The proposed fix moves <code style={{ fontFamily: 'var(--font-mono)' }}>markAsPristineSafe</code> after the cascade. I can draft a comment on the PR if you'd like.
            </div>
          </div>
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="ghost" size="sm" icon="comment">Add comment</Btn>
            <Btn variant="ghost" size="sm" icon="tag">Edit fields</Btn>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" size="sm">Open in ADO ↗</Btn>
            <Btn variant="primary" size="sm">Update state → Resolved</Btn>
          </div>
        </div>
      </ModalShell>
    );
  }

  function PRDetail({ pr, onClose }) {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    function summarize() {
      setLoading(true);
      setSummary(null);
      setTimeout(() => {
        setSummary({
          what: "Preserves dirty state on partial vehicle cascade. Splits the vehicle update from the dirty-marking step, and adds a guard so single-vehicle edits don't cascade-clear unrelated dirty state.",
          why:  "Fixes #24812 — saving a single-vehicle change was clearing dirty markers on sibling vehicles, causing user edits to be silently discarded.",
          watch:[
            "The new guard skips cascade when changedVehicles is empty — verify with seeded test (line 172).",
            "Partial-cascade branch updates the vehicle map in place; check we don't mutate the form-array snapshot.",
            "No e2e coverage on the empty-changes path yet.",
          ],
        });
        setLoading(false);
      }, 1100);
    }
    return (
      <ModalShell onClose={onClose} title={`!${pr.id} · ${pr.title}`} subtitle={`${pr.repo} · by ${pr.author} · ${pr.changes}`} width={780}>
        <div style={{ padding: 22 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <Pill tone={pr.source === 'ado' ? 'navy' : 'neutral'}>{pr.source === 'ado' ? <><Icon name="azure" size={11} /> Azure DevOps</> : <><Icon name="github" size={11} /> GitHub</>}</Pill>
            <StateBadge state={pr.status} />
            <Pill tone="neutral">{pr.comments} comments</Pill>
          </div>
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 14, fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.7 }}>
            <div style={{ color: 'var(--text-tertiary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.1em', fontSize: 10.5 }}>Files changed (3)</div>
            <div style={{ color: 'var(--text-secondary)' }}>vehicles-form.adapter.ts <span style={{ color: 'var(--agp-green-status)' }}>+74</span> / <span style={{ color: 'var(--agp-red)' }}>−12</span></div>
            <div style={{ color: 'var(--text-secondary)' }}>load-order.component.ts <span style={{ color: 'var(--agp-green-status)' }}>+88</span> / <span style={{ color: 'var(--agp-red)' }}>−62</span></div>
            <div style={{ color: 'var(--text-secondary)' }}>load-order.spec.ts <span style={{ color: 'var(--agp-green-status)' }}>+20</span> / <span style={{ color: 'var(--agp-red)' }}>−20</span></div>
          </div>

          <div style={{ marginTop: 18 }}>
            <Btn icon="sparkle" onClick={summarize} disabled={loading}>{loading ? 'Reading PR…' : (summary ? 'Re-summarize' : 'Summarize this PR with Claude')}</Btn>
          </div>

          {loading && (
            <div style={{ marginTop: 14, padding: 14, background: 'var(--surface-2)', border: '1px dashed var(--border)', borderRadius: 'var(--r-md)' }}>
              <ToolCall label="get_file" detail="vehicles-form.adapter.ts" status="…" />
            </div>
          )}

          {summary && (
            <div style={{ marginTop: 14, padding: 18, background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#7a5a05', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="sparkle" size={12} /> PR summary
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}><strong>What changed:</strong> {summary.what}</p>
              <p style={{ margin: '10px 0 0', fontSize: 13, lineHeight: 1.6 }}><strong>Why:</strong> {summary.why}</p>
              <p style={{ margin: '10px 0 4px', fontSize: 12.5, fontWeight: 600 }}>Watch in review:</p>
              <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 13, lineHeight: 1.65 }}>
                {summary.watch.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          <Btn variant="ghost" size="sm" icon="comment">Draft comment</Btn>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" size="sm">Reject</Btn>
            <Btn variant="primary" size="sm" icon="check">Approve</Btn>
          </div>
        </div>
      </ModalShell>
    );
  }

  function ComposeEmail({ email, onClose }) {
    const [to, setTo]           = useState(email.fromEmail || '');
    const [subj, setSubj]       = useState(email.subject ? `Re: ${email.subject}` : '');
    const [body, setBody]       = useState('');
    const [drafting, setDrafting] = useState(false);
    function draftWithAI() {
      setDrafting(true);
      setBody('');
      setTimeout(() => {
        setBody(`Hey ${(email.from || '').split(' ')[0] || 'there'},\n\nThanks for the heads-up. I'll take a second pass on the partial-cascade branch tonight and add a guard for the empty-changes case. I'll ping you when the new commit lands so you can finish your review.\n\n— Dillon`);
        setDrafting(false);
      }, 1100);
    }
    return (
      <ModalShell onClose={onClose} title={email.subject ? `Reply · ${email.subject}` : 'New message'} width={620}>
        <div style={{ padding: 22 }}>
          <Field label="To"><Input value={to} onChange={setTo} mono /></Field>
          <Field label="Subject"><Input value={subj} onChange={setSubj} /></Field>
          <Field label="Body">
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} placeholder="Write a message, or click ‘Draft with AI’ below…" style={{
              width: '100%',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              padding: 12, fontSize: 13.5, lineHeight: 1.6,
              resize: 'vertical', outline: 'none', fontFamily: 'inherit', color: 'var(--text-primary)',
            }} />
          </Field>
          <Btn icon="sparkle" variant="secondary" onClick={draftWithAI} disabled={drafting}>
            {drafting ? 'Drafting…' : 'Draft reply with AI'}
          </Btn>
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Btn variant="ghost" onClick={onClose}>Discard</Btn>
          <Btn variant="primary" icon="send" disabled={!body.trim()}>Send</Btn>
        </div>
      </ModalShell>
    );
  }

  /* ───────── helpers ───────── */

  function fmtRelative(ms) {
    const s = Math.floor(ms / 1000);
    if (s < 60)        return 'just now';
    if (s < 3600)      return Math.floor(s / 60) + 'm ago';
    if (s < 86400)     return Math.floor(s / 3600) + 'h ago';
    if (s < 86400 * 7) return Math.floor(s / 86400) + 'd ago';
    return Math.floor(s / 86400) + 'd ago';
  }

  /* ───────── Root ───────── */

  function App() {
    const [screen, setScreen] = useState('auth');     // auth | onboard | station
    const [profile, setProfile] = useState({ ...AGP_MOCK.user, ...{} });
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

window.OPTA = OPTA;
