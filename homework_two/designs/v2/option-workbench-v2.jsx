/* ─────────────────────────────────────────────────────────────────────────
 * Option B v2 — "Workbench" (revised)
 * Addresses revision brief:
 *   1.  Assistant name removed from onboarding (auto-read from config)
 *   2.  Work Item Builder accessible to all roles, type defaults by role
 *   3.  Anthropic/ADO/GitHub fields have inline validation + Test connection
 *   4.  Teams channel picker replaces manual name entry
 *   5.  ChannelMessage.Send scope warning banner (onboarding + Teams panel)
 *   6.  Error / empty / credential-error states across panels and modals
 *   7.  Profile Settings page (single screen, settings sections)
 *   8.  AI ops have skeleton + result + error/retry states
 *   9.  Notification bell dropdown
 *   10. ⌘K command palette
 *   11. ⌘/ shortcuts overlay
 *   12. Role indicator pill in nav
 * ───────────────────────────────────────────────────────────────────────── */

const OPTB2 = (function () {
  const { useState, useEffect, useRef, useMemo } = React;
  const X = OPTBX;

  /* ────────────────────────────── Sign-in ────────────────────────────── */

  function SignIn({ onSignIn }) {
    const [loading, setLoading] = useState(false);
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div aria-hidden style={{ position: 'absolute', inset: '0 0 auto 0', height: '52%', background: 'linear-gradient(180deg, var(--primary) 0%, transparent 100%)', opacity: 0.07 }} />
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-lg)', padding: '36px 32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <AGPLogo height={32} />
            <div style={{ marginTop: 22, fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
              Command Station · v2.0
            </div>
            <h2 style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 600, letterSpacing: '-.01em', color: 'var(--text-primary)' }}>
              Welcome to your workbench.
            </h2>
            <p style={{ margin: '8px 0 0', fontSize: 13.5, lineHeight: 1.55, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 320 }}>
              Sign in with your AGP account to load your work items, PRs, inbox, and team channels.
            </p>
          </div>
          <div style={{ marginTop: 28 }}>
            <MicrosoftSignIn loading={loading} onClick={() => { setLoading(true); setTimeout(() => { setLoading(false); onSignIn(); }, 1100); }} />
          </div>
          <div style={{ marginTop: 18, padding: '12px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
            <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.14em', marginBottom: 6 }}>Requested scopes</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {['User.Read', 'Mail.Read', 'Mail.Send', 'Calendars.ReadWrite', 'Chat.Read', 'ChannelMessage.Read.User'].map((s) => (
                <span key={s} style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', padding: '2px 7px', background: 'var(--primary-soft)', color: 'var(--primary)', borderRadius: 4, fontWeight: 500 }}>{s}</span>
              ))}
            </div>
          </div>
          <p style={{ marginTop: 18, fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
            Your Graph token never leaves your browser session.
          </p>
        </div>
      </div>
    );
  }

  /* ──────────────────────────── Onboarding ──────────────────────────── */

  function Onboarding({ onComplete }) {
    /* postingEnabled simulates whether IT has approved ChannelMessage.Send. */
    const [data, setData] = useState({
      role: 'SoftwareEngineer',
      anthropicKey: '',
      adoOrg: 'agp-co', adoProject: 'ELO Platform',
      ghOrg: 'agp-co', ghPat: '',
      channels: [
        { teamId: 't-elo', teamName: 'ELO Platform', channelId: 'c-elo-general', channelName: 'general' },
      ],
      postingEnabled: false,    // default: warning shown
    });
    const u = (p) => setData((d) => ({ ...d, ...p }));

    return (
      <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', overflowY: 'auto' }}>
        <div style={{ position: 'sticky', top: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', zIndex: 2, padding: '0 28px', height: 56, display: 'flex', alignItems: 'center', gap: 14 }}>
          <AGPLogo height={24} />
          <div style={{ height: 22, width: 1, background: 'var(--border)' }} />
          <div style={{ fontSize: 13.5, fontWeight: 500 }}>Set up your workbench</div>
          <div style={{ marginLeft: 'auto', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.14em' }}>
            Connect to continue
          </div>
        </div>

        <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px 28px 80px' }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-.01em' }}>Hi, Dillon. Let's get connected.</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            Hook up the services your workbench needs. Each credential is encrypted with AES-256-GCM
            before storage and used only to scope you, not to act as you.
          </p>

          <Section icon="user" title="Your role" subtitle="Shapes the assistant's system prompt. Everyone can build work items, ship PRs, etc.">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                ['ProductOwner',     'Product Owner',     'work'],
                ['SoftwareEngineer', 'Software Engineer', 'code'],
                ['QA',               'QA Engineer',       'bug'],
              ].map(([k, l, i]) => (
                <button key={k} onClick={() => u({ role: k })} style={{
                  padding: 14, borderRadius: 'var(--r-md)',
                  background: data.role === k ? 'var(--primary-soft)' : 'var(--surface)',
                  border: `1px solid ${data.role === k ? 'var(--primary)' : 'var(--border)'}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6,
                  textAlign: 'left', cursor: 'pointer',
                }}>
                  <Icon name={i} size={18} style={{ color: data.role === k ? 'var(--primary)' : 'var(--text-tertiary)' }} />
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{l}</div>
                </button>
              ))}
            </div>
          </Section>

          <Section icon="sparkle" title="Anthropic API key" subtitle={`Bring your own key (sk-ant-…). Streamed via ${AGP_MOCK.config.modelName}.`}>
            <X.ConnField
              label="API key"
              type="password" icon="lock"
              value={data.anthropicKey}
              onChange={(v) => u({ anthropicKey: v })}
              placeholder="sk-ant-api03-…"
              validator={X.validators.anthropic}
              hint="Your assistant's display name is read from your local Claude config — no need to set it here."
            />
          </Section>

          <Section icon="azure" title="Azure DevOps" subtitle="Inherited from your Microsoft sign-in — no PAT needed. Just tell us which org/project to query.">
            <Row2>
              <div><FieldLabel>Organization</FieldLabel><Input value={data.adoOrg} onChange={(v) => u({ adoOrg: v })} mono icon="azure" /></div>
              <div><FieldLabel>Project</FieldLabel><Input value={data.adoProject} onChange={(v) => u({ adoProject: v })} mono /></div>
            </Row2>
            <div style={{
              marginTop: 12,
              padding: '10px 12px',
              background: 'rgba(46,125,50,0.08)',
              border: '1px solid rgba(46,125,50,0.32)',
              borderRadius: 'var(--r-sm)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ width: 22, height: 22, borderRadius: 'var(--r-sm)', background: 'rgba(46,125,50,0.16)', color: 'var(--agp-green-status)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="check" size={12} />
              </span>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Signed in as {AGP_MOCK.user.email}</strong> ·
                Azure DevOps auth comes through your Microsoft token automatically.
              </div>
            </div>
          </Section>

          <Section icon="github" title="GitHub" subtitle="For org repos, PRs, and code search outside Azure DevOps.">
            <Row2>
              <div><FieldLabel>Org or username</FieldLabel><Input value={data.ghOrg} onChange={(v) => u({ ghOrg: v })} mono icon="github" /></div>
              <div>
                <X.ConnField
                  label="Personal access token"
                  type="password" icon="lock"
                  value={data.ghPat}
                  onChange={(v) => u({ ghPat: v })}
                  placeholder="ghp_…"
                  validator={X.validators.githubPat}
                  hint="Fine-grained token with repo + pull_request scopes."
                />
              </div>
            </Row2>
          </Section>

          <Section icon="teams" title="Teams channels" subtitle="Pick up to 3 channels we'll watch for @mentions and replies.">
            {!data.postingEnabled && (
              <div style={{ marginBottom: 12 }}>
                <X.ScopeWarning />
              </div>
            )}
            <X.TeamsPicker
              value={data.channels}
              onChange={(channels) => u({ channels })}
              max={3}
            />
            {/* Demo toggle for the scope, since real signal comes from IT */}
            <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--surface-2)', border: '1px dashed var(--border)', borderRadius: 'var(--r-sm)', fontSize: 11.5, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="lightning" size={12} />
              <span>Demo only · simulate IT admin grant:</span>
              <Btn size="sm" variant="ghost" onClick={() => u({ postingEnabled: !data.postingEnabled })}>
                {data.postingEnabled ? 'Revoke posting' : 'Grant posting'}
              </Btn>
            </div>
          </Section>

          <div style={{ position: 'sticky', bottom: 0, marginTop: 32, padding: '14px 0', display: 'flex', justifyContent: 'flex-end', gap: 10, background: 'linear-gradient(180deg, transparent 0%, var(--bg) 30%, var(--bg) 100%)' }}>
            <Btn variant="ghost" onClick={() => onComplete(data)}>Skip for now</Btn>
            <Btn variant="primary" iconRight="arrow-right" onClick={() => onComplete(data)}>Open my workbench</Btn>
          </div>
        </div>
      </div>
    );
  }

  /* ─── form atoms ─── */
  function Section({ icon, title, subtitle, children }) {
    return (
      <section style={{ marginTop: 26, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <span style={{ width: 34, height: 34, borderRadius: 'var(--r-sm)', background: 'var(--primary-soft)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={icon} size={16} />
          </span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>{subtitle}</div>}
          </div>
        </div>
        {children}
      </section>
    );
  }
  function FieldLabel({ children }) { return <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 6 }}>{children}</div>; }
  function Row2({ children }) { return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>{children}</div>; }
  function Input({ value, onChange, placeholder, type = 'text', mono, icon }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
        {icon && <span style={{ paddingLeft: 12, color: 'var(--text-tertiary)' }}><Icon name={icon} size={14} /></span>}
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '10px 12px', fontSize: 13.5, fontFamily: mono ? 'var(--font-mono)' : 'inherit', color: 'var(--text-primary)' }} />
      </div>
    );
  }

  /* ─────────────────────────────── Station ─────────────────────────────── */

  function Station({ profile, onSignOut, onProfile }) {
    const { theme, setTheme, role, assistant } = useAGP();
    const [tab, setTab]             = useState('work');
    const [drawerOpen, setDrawerOpen] = useState(true);
    const [active, setActive]       = useState({ wi: null, pr: null, email: null, builder: false, newPR: false, newEvent: false, sendChannel: false });
    const [bellOpen, setBellOpen]   = useState(false);
    const [palette, setPalette]     = useState(false);
    const [shortcuts, setShortcuts] = useState(false);
    const [notifs, setNotifs]       = useState(AGP_MOCK.notifications);
    const [errorTab, setErrorTab]   = useState(null);  // simulate API failure on a single tab
    const [credExpired, setCred]    = useState(null);  // 'anthropic'|'ado'|'github'|null
    const [postingEnabled, setPost] = useState(profile.postingEnabled);

    /* Keyboard shortcuts */
    useEffect(() => {
      function onKey(e) {
        const meta = e.metaKey || e.ctrlKey;
        if (meta && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette(true); }
        if (meta && e.key.toLowerCase() === 'j') { e.preventDefault(); setDrawerOpen((d) => !d); }
        if (meta && e.key === '/')               { e.preventDefault(); setShortcuts(true); }
        if (meta && e.key.toLowerCase() === 'n') { e.preventDefault(); setActive((a) => ({ ...a, builder: true })); }
        if (!meta && /^[1-5]$/.test(e.key) && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          const map = { '1': 'work', '2': 'repos', '3': 'mail', '4': 'calendar', '5': 'teams' };
          if (map[e.key]) { e.preventDefault(); setTab(map[e.key]); }
        }
      }
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, []);

    return (
      <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', display: 'grid', gridTemplateRows: 'auto auto 1fr', minHeight: 0 }}>
        <AppBar
          profile={profile} role={role} theme={theme} setTheme={setTheme}
          drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen}
          onSignOut={onSignOut} onProfile={onProfile} onShortcuts={() => setShortcuts(true)}
          onSearch={() => setPalette(true)}
          bellOpen={bellOpen} setBellOpen={setBellOpen}
          notifs={notifs} setNotifs={setNotifs}
        />
        <TabStrip tab={tab} setTab={setTab} />

        <div style={{ display: 'grid', gridTemplateColumns: drawerOpen ? 'minmax(0, 1fr) 400px' : 'minmax(0, 1fr) 0', minHeight: 0, transition: 'grid-template-columns 240ms var(--ease-out)' }}>
          <main style={{ minHeight: 0, overflowY: 'auto', padding: '20px 28px 32px' }}>
            {/* simulated credential-error banner */}
            {credExpired && (
              <div style={{ marginBottom: 16 }}>
                <X.CredErrorBanner service={credExpired === 'anthropic' ? 'Anthropic' : 'GitHub'} onUpdate={onProfile} />
              </div>
            )}
            {tab === 'work'     && <WorkPane     role={role} onOpen={(wi) => setActive({ ...active, wi })} onBuilder={() => setActive({ ...active, builder: true })} simulateError={errorTab === 'work'} onRetry={() => setErrorTab(null)} />}
            {tab === 'repos'    && <ReposPane    onOpenPR={(pr) => setActive({ ...active, pr })} onNewPR={() => setActive({ ...active, newPR: true })} simulateError={errorTab === 'repos'} onRetry={() => setErrorTab(null)} credExpired={credExpired === 'github'} onProfile={onProfile} />}
            {tab === 'mail'     && <MailPane     onOpen={(e) => setActive({ ...active, email: e })} simulateError={errorTab === 'mail'} onRetry={() => setErrorTab(null)} />}
            {tab === 'calendar' && <CalendarPane onNewEvent={() => setActive({ ...active, newEvent: true })} simulateError={errorTab === 'calendar'} onRetry={() => setErrorTab(null)} />}
            {tab === 'teams'    && <TeamsPane    simulateError={errorTab === 'teams'} onRetry={() => setErrorTab(null)} postingEnabled={postingEnabled} onPostToChannel={() => setActive({ ...active, sendChannel: true })} />}
          </main>
          <ChatDrawer assistant={assistant} open={drawerOpen} onClose={() => setDrawerOpen(false)} credExpired={credExpired === 'anthropic'} onProfile={onProfile} />
        </div>

        {!drawerOpen && (
          <button onClick={() => setDrawerOpen(true)} style={{
            position: 'absolute', right: 20, bottom: 20,
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--primary)', color: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-pop)', zIndex: 10,
          }}>
            <Icon name="sparkle" size={22} />
          </button>
        )}

        {active.builder && <Builder onClose={() => setActive({ ...active, builder: false })} role={role} />}
        {active.wi       && <WIDetail item={active.wi} onClose={() => setActive({ ...active, wi: null })} />}
        {active.pr       && <PRDetail pr={active.pr}   onClose={() => setActive({ ...active, pr: null })} />}
        {active.email    && <Compose email={active.email} onClose={() => setActive({ ...active, email: null })} />}
        {active.newPR       && <X.NewPrModal         onClose={() => setActive({ ...active, newPR: false })} />}
        {active.newEvent    && <X.NewEventModal      onClose={() => setActive({ ...active, newEvent: false })} />}
        {active.sendChannel && <X.SendToChannelModal onClose={() => setActive({ ...active, sendChannel: false })} channels={AGP_MOCK.teamsChannels} postingEnabled={postingEnabled} />}

        <X.CommandPalette  open={palette}   onClose={() => setPalette(false)} />
        <X.ShortcutsOverlay open={shortcuts} onClose={() => setShortcuts(false)} />

        {/* Demo toggles — sit invisibly until hovered (so they don't clutter the design). */}
        <DemoToggles
          errorTab={errorTab} setErrorTab={setErrorTab}
          credExpired={credExpired} setCred={setCred}
          postingEnabled={postingEnabled} setPost={setPost}
        />
      </div>
    );
  }

  /* tiny corner panel: lets the user TOGGLE the error / scope / credential
   * states to actually exercise the new designs. Hidden via low opacity unless
   * hovered. */
  function DemoToggles({ errorTab, setErrorTab, credExpired, setCred, postingEnabled, setPost }) {
    return (
      <div style={{
        position: 'absolute', left: 12, bottom: 12, zIndex: 25,
        padding: '8px 10px',
        background: 'rgba(15, 22, 32, 0.92)',
        color: '#eef2f7',
        border: '1px solid rgba(255,255,255,.08)',
        borderRadius: 'var(--r-sm)',
        fontSize: 10.5, fontFamily: 'var(--font-mono)',
        display: 'flex', flexDirection: 'column', gap: 6,
        opacity: 0.3,
        transition: 'opacity 160ms',
      }}
      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
      onMouseLeave={(e) => e.currentTarget.style.opacity = '0.3'}
      >
        <div style={{ textTransform: 'uppercase', letterSpacing: '.16em', color: 'rgba(255,255,255,.55)' }}>Demo states</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {['work', 'repos', 'mail', 'calendar', 'teams'].map((t) => (
            <button key={t} onClick={() => setErrorTab(errorTab === t ? null : t)}
              style={{ padding: '2px 6px', borderRadius: 4, background: errorTab === t ? 'var(--agp-red)' : 'rgba(255,255,255,.08)', color: '#fff' }}>
              {t} err
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['anthropic', 'github'].map((c) => (
            <button key={c} onClick={() => setCred(credExpired === c ? null : c)}
              style={{ padding: '2px 6px', borderRadius: 4, background: credExpired === c ? 'var(--agp-red)' : 'rgba(255,255,255,.08)', color: '#fff' }}>
              {c} cred
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setPost(!postingEnabled)}
            style={{ padding: '2px 6px', borderRadius: 4, background: postingEnabled ? 'var(--agp-green-status)' : 'rgba(235,182,59,0.5)', color: '#fff' }}>
            teams post: {postingEnabled ? 'on' : 'off'}
          </button>
        </div>
      </div>
    );
  }

  function AppBar({ profile, role, theme, setTheme, drawerOpen, setDrawerOpen, onSignOut, onProfile, onShortcuts, onSearch, bellOpen, setBellOpen, notifs, setNotifs }) {
    const [menu, setMenu] = useState(false);
    return (
      <div style={{
        height: 56, padding: '0 20px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 16,
        position: 'relative', zIndex: 5,
      }}>
        <AGPLogo height={26} />
        <div style={{ height: 22, width: 1, background: 'var(--border)' }} />
        <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)' }}>Command Station</div>
        <X.RolePill role={role} onClick={onProfile} />

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={onSearch}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 12px',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)',
              width: 320, fontSize: 12.5, color: 'var(--text-tertiary)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <Icon name="search" size={13} />
            <span>Search work items, PRs, code, mail…</span>
            <span style={{ marginLeft: 'auto', fontSize: 10.5, fontFamily: 'var(--font-mono)', padding: '1px 5px', border: '1px solid var(--border)', borderRadius: 3 }}>⌘K</span>
          </button>

          <IconBtn icon={theme === 'light' ? 'moon' : 'sun'} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} title={theme === 'light' ? 'Switch to dark' : 'Switch to light'} />

          <X.NotificationsBell
            open={bellOpen}
            onClose={() => setBellOpen(false)}
            onClick={() => setBellOpen(!bellOpen)}
            items={notifs}
            onMarkAll={() => setNotifs(notifs.map((n) => ({ ...n, unread: false })))}
          />

          <IconBtn icon="sparkle" tone={drawerOpen ? 'primary' : 'default'} onClick={() => setDrawerOpen(!drawerOpen)} title={drawerOpen ? 'Hide assistant (⌘J)' : 'Show assistant (⌘J)'} />

          <div style={{ position: 'relative' }}>
            <button onClick={() => setMenu(!menu)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px 4px 4px', borderRadius: 999, background: 'var(--surface-2)' }}>
              <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{profile.initials}</span>
              <span style={{ fontSize: 13 }}>{profile.firstName}</span>
              <Icon name="chevron-down" size={12} />
            </button>
            {menu && (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-pop)', minWidth: 240, padding: 6, zIndex: 30 }}>
                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{profile.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{profile.email}</div>
                  <div style={{ marginTop: 8 }}><X.RolePill role={role} compact /></div>
                </div>
                <MenuItem icon="settings"  label="Profile settings"     onClick={() => { setMenu(false); onProfile(); }} />
                <MenuItem icon="lightning" label="Keyboard shortcuts"   shortcut="⌘/" onClick={() => { setMenu(false); onShortcuts(); }} />
                <MenuItem icon="bell"      label="Notification settings"  />
                <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                <MenuItem icon="logout" label="Sign out" onClick={onSignOut} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function IconBtn({ icon, onClick, badge, tone, title }) {
    return (
      <button onClick={onClick} title={title}
        style={{
          width: 34, height: 34, borderRadius: 'var(--r-sm)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: tone === 'primary' ? 'var(--primary)' : 'transparent',
          color: tone === 'primary' ? '#fff' : 'var(--text-secondary)',
          position: 'relative',
        }}
        onMouseEnter={(e) => { if (tone !== 'primary') e.currentTarget.style.background = 'var(--surface-hover)'; }}
        onMouseLeave={(e) => { if (tone !== 'primary') e.currentTarget.style.background = 'transparent'; }}>
        <Icon name={icon} size={15} />
        {badge && <span style={{ position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />}
      </button>
    );
  }
  function MenuItem({ icon, label, onClick, shortcut }) {
    return (
      <button onClick={onClick} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--r-sm)', fontSize: 13, color: 'var(--text-primary)', textAlign: 'left' }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
        <Icon name={icon} size={14} style={{ color: 'var(--text-tertiary)' }} />
        <span style={{ flex: 1 }}>{label}</span>
        {shortcut && <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{shortcut}</span>}
      </button>
    );
  }

  function TabStrip({ tab, setTab }) {
    const tabs = [
      { key: 'work',     label: 'Work items', icon: 'work',     count: AGP_MOCK.workItems.filter((w) => w.state !== 'Closed').length, kbd: '1' },
      { key: 'repos',    label: 'Repos & PRs',icon: 'pr',       count: AGP_MOCK.pullRequests.length, kbd: '2' },
      { key: 'mail',     label: 'Email',      icon: 'mail',     count: AGP_MOCK.emails.filter((e) => e.unread).length, kbd: '3' },
      { key: 'calendar', label: 'Calendar',   icon: 'calendar', kbd: '4' },
      { key: 'teams',    label: 'Teams',      icon: 'teams',    count: AGP_MOCK.teamsMentions.length, kbd: '5' },
    ];
    return (
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 28px', display: 'flex', position: 'relative', zIndex: 4 }}>
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 16px 12px',
              fontSize: 13.5, fontWeight: 500,
              color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
              borderBottom: `2px solid ${active ? 'var(--primary)' : 'transparent'}`,
              marginBottom: -1,
            }}>
              <Icon name={t.icon} size={14} style={{ color: active ? 'var(--primary)' : 'var(--text-tertiary)' }} />
              {t.label}
              {t.count != null && (
                <span style={{
                  fontSize: 10.5, fontFamily: 'var(--font-mono)',
                  background: active ? 'var(--accent)' : 'var(--surface-3)',
                  color:      active ? 'var(--text-on-accent)' : 'var(--text-tertiary)',
                  padding: '1px 6px', borderRadius: 4, fontWeight: 700,
                }}>{t.count}</span>
              )}
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginLeft: 4, opacity: 0.6 }}>{t.kbd}</span>
            </button>
          );
        })}
      </div>
    );
  }

  /* ─────────────── Panes ─────────────── */

  function PaneHeader({ title, sub, children }) {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-.01em' }}>{title}</h1>
          {sub && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 4 }}>{sub}</div>}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>{children}</div>
      </div>
    );
  }

  function WorkPane({ role, onOpen, onBuilder, simulateError, onRetry }) {
    const cols = ['New', 'Active', 'Resolved'];
    const M = AGP_MOCK;
    return (
      <>
        <PaneHeader title="Work items" sub="Pulled live from Azure DevOps · WIQL @me filter">
          <Btn variant="accent" icon="sparkle" onClick={onBuilder}>Draft with AI</Btn>
          <Btn variant="primary" icon="plus">New item</Btn>
        </PaneHeader>

        {simulateError ? (
          <X.ErrorCard title="Couldn't load your work items" message="Azure DevOps returned a 503. The service may be having a moment — give it a few seconds." onRetry={onRetry} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, minHeight: 380 }}>
            {cols.map((c) => {
              const items = M.workItems.filter((w) => w.state === c);
              return (
                <div key={c} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', minHeight: 280 }}>
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: c === 'Active' ? 'var(--primary)' : c === 'Resolved' ? 'var(--agp-green-status)' : 'var(--text-tertiary)' }} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{c}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{items.length}</span>
                  </div>
                  <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                    {items.length === 0 ? (
                      <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                        Nothing in {c.toLowerCase()}.
                      </div>
                    ) : items.map((w) => (
                      <button key={w.id} onClick={() => onOpen(w)} style={{
                        background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
                        padding: 12, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)';  e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <WorkItemTypeBadge type={w.type} />
                          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>#{w.id}</span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4 }}>{w.title}</div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                          <span>{w.points} pts</span>
                          <span>·</span>
                          <span>{w.updated}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  }

  function ReposPane({ onOpenPR, onNewPR, simulateError, onRetry, credExpired, onProfile }) {
    const M = AGP_MOCK;
    return (
      <>
        <PaneHeader title="Repositories & Pull Requests" sub="Azure DevOps + GitHub">
          <Btn variant="secondary" icon="search">Search code</Btn>
          <Btn variant="primary" icon="plus" onClick={onNewPR}>New PR</Btn>
        </PaneHeader>

        {credExpired && <X.CredErrorBanner service="GitHub" onUpdate={onProfile} />}

        {simulateError ? (
          <X.ErrorCard title="GitHub is unreachable" message="We couldn't reach GitHub's API. Could be the network, GitHub status, or your PAT — check status.github.com or update your token in Profile Settings." onRetry={onRetry} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Card title="Your repos">
              {M.repos.map((r, i) => (
                <div key={r.id} style={{ padding: '12px 14px', borderBottom: i < M.repos.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Icon name={r.source === 'ado' ? 'azure' : 'github'} size={14} style={{ color: 'var(--text-tertiary)' }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{r.lang} · {r.defaultBranch} · updated {r.updated}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                    {r.prs > 0 && <Pill tone="navy" size="sm">{r.prs} PRs</Pill>}
                  </div>
                </div>
              ))}
            </Card>
            <Card title="Reviews requested">
              {M.pullRequests.map((pr, i) => (
                <button key={pr.id} onClick={() => onOpenPR(pr)} style={{
                  width: '100%', textAlign: 'left',
                  padding: '12px 14px', borderBottom: i < M.pullRequests.length - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex', flexDirection: 'column', gap: 6, background: 'transparent',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)' }}>!{pr.id}</span>
                    <StateBadge state={pr.status} />
                    <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{pr.title}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                    <span>{pr.author}</span>
                    <span>{pr.changes}</span>
                    <span style={{ marginLeft: 'auto' }}>{pr.updated}</span>
                  </div>
                </button>
              ))}
            </Card>
          </div>
        )}
      </>
    );
  }

  function MailPane({ onOpen, simulateError, onRetry }) {
    const M = AGP_MOCK;
    return (
      <>
        <PaneHeader title="Inbox" sub={`${M.emails.filter((e) => e.unread).length} unread · synced from Outlook`}>
          <Btn variant="primary" icon="edit">Compose</Btn>
        </PaneHeader>
        {simulateError ? (
          <X.ErrorCard title="Outlook isn't responding" message="Microsoft Graph returned a 429 (rate limited). We'll retry in 30s, or you can try now." onRetry={onRetry} />
        ) : M.emails.length === 0 ? (
          <X.EmptyState icon="mail" title="Inbox zero." message="Nothing waiting on you right now. Take a breath." />
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
            {M.emails.map((e, i) => (
              <button key={e.id} onClick={() => onOpen(e)} style={{
                width: '100%', textAlign: 'left',
                padding: '14px 18px', borderBottom: i < M.emails.length - 1 ? '1px solid var(--border)' : 'none',
                background: e.unread ? 'rgba(235,182,59,0.04)' : 'transparent',
                display: 'grid', gridTemplateColumns: '8px 200px 1fr auto', gap: 16, alignItems: 'center',
              }}
              onMouseEnter={(el) => el.currentTarget.style.background = 'var(--surface-hover)'}
              onMouseLeave={(el) => el.currentTarget.style.background = e.unread ? 'rgba(235,182,59,0.04)' : 'transparent'}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: e.unread ? 'var(--accent)' : 'transparent' }} />
                <span style={{ fontSize: 13.5, fontWeight: e.unread ? 600 : 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.from}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: e.unread ? 600 : 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.subject}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.preview}</div>
                </div>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{e.time}</span>
              </button>
            ))}
          </div>
        )}
      </>
    );
  }

  function CalendarPane({ onNewEvent, simulateError, onRetry }) {
    const M = AGP_MOCK;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const dates = [12, 13, 14, 15, 16];
    return (
      <>
        <PaneHeader title="This week" sub="May 12 – 16, 2026">
          <Btn variant="secondary" icon="calendar">Today</Btn>
          <Btn variant="primary" icon="plus" onClick={onNewEvent}>New event</Btn>
        </PaneHeader>
        {simulateError ? (
          <X.ErrorCard title="Calendar didn't load" message="Microsoft Graph timed out. Your token might need a refresh — sign out and back in if this keeps happening." onRetry={onRetry} />
        ) : (
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
                        {ev.teams && <button style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontFamily: 'var(--font-mono)', color: c.fg, padding: '2px 6px', background: 'rgba(255,255,255,.5)', borderRadius: 4 }}><Icon name="teams" size={10} /> Join</button>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  function TeamsPane({ simulateError, onRetry, postingEnabled, onPostToChannel }) {
    const M = AGP_MOCK;
    return (
      <>
        <PaneHeader title="Teams" sub="Mentions across monitored channels">
          {postingEnabled ? (
            <Btn variant="primary" icon="send" onClick={onPostToChannel}>Post to channel</Btn>
          ) : (
            <Btn variant="secondary" icon="lock" disabled title="Posting requires IT admin approval">Post (disabled)</Btn>
          )}
        </PaneHeader>

        {!postingEnabled && (
          <div style={{ marginBottom: 14 }}><X.ScopeWarning /></div>
        )}

        {simulateError ? (
          <X.ErrorCard title="Teams channels didn't load" message="Microsoft Graph returned an empty channel list. Have you been added to the team you're watching?" onRetry={onRetry} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Card title="@ Mentions">
              {M.teamsMentions.length === 0 ? (
                <X.EmptyState icon="teams" title="No mentions" message="When someone @-mentions you in a monitored channel, it'll show up here." />
              ) : M.teamsMentions.map((m, i) => (
                <div key={m.id} style={{ padding: '14px 18px', borderBottom: i < M.teamsMentions.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{m.from}</span>
                    <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{m.channel}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{m.time}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{m.text}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    <Btn size="sm" variant="ghost" icon="comment" disabled={!postingEnabled}>Reply</Btn>
                    <Btn size="sm" variant="ghost" icon="sparkle">Draft with AI</Btn>
                  </div>
                </div>
              ))}
            </Card>
            <Card title="Channels">
              {M.teamsChannels.map((ch, i) => (
                <div key={ch.id} style={{ padding: '14px 18px', borderBottom: i < M.teamsChannels.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', background: 'var(--primary-soft)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700 }}>#</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{ch.team} <span style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>/ {ch.name}</span></div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.lastMessage}</div>
                  </div>
                  {ch.unread > 0 && <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', background: 'var(--accent)', color: '#1a1306', padding: '1px 7px', borderRadius: 4, fontWeight: 700 }}>{ch.unread}</span>}
                </div>
              ))}
            </Card>
          </div>
        )}
      </>
    );
  }

  function Card({ title, children }) {
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{title}</div>
        {children}
      </div>
    );
  }

  /* ──────────────────────── Chat drawer ──────────────────────── */

  function ChatDrawer({ assistant, open, onClose, credExpired, onProfile }) {
    const [thread, setThread] = useState(AGP_MOCK.seedThread);
    const [input, setInput]   = useState('');
    const [typing, setTyping] = useState(false);
    const [streamTarget, setStreamTarget] = useState(null);
    const streamingOut = useStreamingText(streamTarget, { speed: 4, tick: 22 });
    const threadRef = useRef(null);

    useEffect(() => { const el = threadRef.current; if (el) el.scrollTop = el.scrollHeight; }, [thread, typing, streamingOut, open]);

    function send() {
      const text = input.trim();
      if (!text || typing || credExpired) return;
      setThread((t) => [...t, { role: 'user', text }]);
      setInput('');
      setTyping(true);
      const reply = pickCannedReply(text);
      const tool = /pr|review|where|find|search|code/i.test(text);
      setTimeout(() => { if (tool) setThread((t) => [...t, { role: 'tool', label: 'search_code', detail: `"${text.slice(0,38)}"`, status: 'done', files: 3 }]); }, 400);
      setTimeout(() => { setTyping(false); setStreamTarget(reply); }, 1100);
      setTimeout(() => { setThread((t) => [...t, { role: 'assistant', text: reply }]); setStreamTarget(null); }, 1100 + Math.min(reply.length * 6, 2400));
    }

    return (
      <aside style={{
        background: 'var(--surface)', borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden',
        transition: 'all 240ms var(--ease-out)',
        opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
      }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 28, height: 28, borderRadius: 'var(--r-sm)', background: 'var(--primary)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="sparkle" size={14} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{assistant}</div>
            <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
              {credExpired ? '● API key invalid' : `● ${AGP_MOCK.config.modelName}`}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, color: 'var(--text-tertiary)', borderRadius: 'var(--r-sm)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={14} />
          </button>
        </div>

        {credExpired && (
          <div style={{ padding: 14 }}>
            <X.CredErrorBanner service="Anthropic" onUpdate={onProfile} />
          </div>
        )}

        <div ref={threadRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {thread.map((m, i) => <DrawerBubble key={i} m={m} assistant={assistant} />)}
          {streamTarget && <DrawerBubble m={{ role: 'assistant', text: streamingOut + '▍' }} assistant={assistant} />}
          {typing && <Typing />}
        </div>

        <div style={{ padding: 12, borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {['Draft a User Story', 'Summarize PR #1147', 'Where is JwtTokenService?'].map((s) => (
              <button key={s} onClick={() => setInput(s)} style={{
                padding: '5px 10px', background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 999, fontSize: 11.5, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)',
              }}>{s}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '8px 8px 8px 12px' }}>
            <textarea value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              rows={1} placeholder={credExpired ? 'Update your Anthropic key to continue…' : `Ask ${assistant} anything…`}
              disabled={credExpired}
              style={{ flex: 1, resize: 'none', border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: 13.5, lineHeight: 1.5, padding: '4px 0', fontFamily: 'inherit', maxHeight: 120 }} />
            <button onClick={send} disabled={!input.trim() || typing || credExpired} style={{
              width: 30, height: 30, borderRadius: 'var(--r-sm)',
              background: input.trim() && !typing && !credExpired ? 'var(--primary)' : 'var(--surface-3)',
              color:      input.trim() && !typing && !credExpired ? '#fff' : 'var(--text-tertiary)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="send" size={13} />
            </button>
          </div>
        </div>
      </aside>
    );
  }

  function DrawerBubble({ m, assistant }) {
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
          maxWidth: '92%', padding: '9px 13px',
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

  /* ──────────────────────── Modal shell ──────────────────────── */

  function Modal({ onClose, title, sub, children, width = 640 }) {
    useEffect(() => { const h = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
    return (
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(3,14,26,0.55)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 80, zIndex: 40,
        animation: 'agpFadeIn 200ms var(--ease-out)',
      }}>
        <div onClick={(e) => e.stopPropagation()} style={{
          width: '100%', maxWidth: width, maxHeight: '85vh',
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-lg)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ padding: '18px 22px', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
              {sub && <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>{sub}</div>}
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', color: 'rgba(255,255,255,.9)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="x" size={16} />
            </button>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>{children}</div>
        </div>
      </div>
    );
  }

  /* ──────────────────────── Work Item Builder ──────────────────────── */

  /* AI op state machine: 'idle' | 'loading' | 'done' | 'error' */
  function Builder({ onClose, role }) {
    const defaultType = role === 'QA' ? 'Bug' : role === 'ProductOwner' ? 'User Story' : 'Task';
    const [type, setType] = useState(defaultType);
    const [prompt, setPrompt] = useState(
      defaultType === 'Bug'
        ? 'Repro the partial-cascade dirty-state bug: edit a single vehicle, save, observe dirty state on the sibling vehicle gets cleared.'
        : defaultType === 'User Story'
        ? 'PO can attach pinned repo files to a chat thread so the assistant has them as known context.'
        : 'Hot-reload tool definitions in AnthropicChatService so we don\'t have to restart the API to iterate.'
    );
    const [phase, setPhase] = useState('idle');     // idle | loading | done | error
    const [draft, setDraft] = useState(null);

    /* Drafts vary by type. */
    const TYPE_DRAFTS = {
      'Bug': {
        type: 'Bug',
        title: 'Partial vehicle cascade clears sibling vehicle dirty state',
        description: "When a user edits a single vehicle and saves, the cascade clears the dirty state of sibling vehicles even though they weren't touched. This causes user edits on sibling vehicles to be silently discarded on the next save.",
        acceptanceCriteria: [
          "Reproduce: seed two vehicles, mark vehicle A dirty, save vehicle B only.",
          "Sibling vehicle A's dirty flag should NOT be cleared.",
          "Add an e2e test covering the empty-changes case.",
          "Add a regression test for multi-vehicle dirty state.",
        ],
        tags: ['regression', 'load-orders', 'dirty-state'],
      },
      'User Story': {
        type: 'User Story',
        title: 'Pin repo files to a chat thread for AI context',
        description: "As a Command Station user, I want to pin files from the repo tree to my chat thread so that the assistant has those files as known context for every message in the thread without using a tool call.",
        acceptanceCriteria: [
          "A pin icon appears on every file in the repo tree.",
          "Clicking pin adds the file as a pill above the chat composer.",
          "Pinned files are prepended to every message as system context.",
          "Pinned state persists across sessions for the active conversation.",
          "User can unpin a file from the chat composer.",
        ],
        tags: ['ai', 'chat', 'devex'],
      },
      'Task': {
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
      },
    };

    function generate(forceError = false) {
      setPhase('loading'); setDraft(null);
      setTimeout(() => {
        if (forceError) { setPhase('error'); return; }
        setDraft(TYPE_DRAFTS[type]);
        setPhase('done');
      }, 1100);
    }

    return (
      <Modal onClose={onClose} title="Draft a work item with AI" sub={`Defaults to ${defaultType} for your role · all types available`} width={720}>
        <div style={{ padding: 22 }}>
          <FieldLabel>Type</FieldLabel>
          <div style={{ display: 'flex', gap: 6 }}>
            {['Bug', 'User Story', 'Task'].map((t) => (
              <button key={t} onClick={() => { setType(t); setDraft(null); setPhase('idle'); }}
                style={{
                  padding: '7px 14px',
                  fontSize: 12.5, fontWeight: 600,
                  borderRadius: 'var(--r-sm)',
                  background: type === t ? 'var(--primary)' : 'var(--surface-2)',
                  color:      type === t ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${type === t ? 'var(--primary)' : 'var(--border)'}`,
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}>
                {t === defaultType && <span style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', padding: '0 4px', background: type === t ? 'rgba(255,255,255,.18)' : 'var(--accent-soft)', color: type === t ? '#fff' : '#7a5a05', borderRadius: 3 }}>default</span>}
                {t}
              </button>
            ))}
          </div>
          <div style={{ height: 18 }} />
          <FieldLabel>Describe the work</FieldLabel>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} style={{
            width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
            padding: 12, fontSize: 13.5, lineHeight: 1.5, resize: 'vertical', outline: 'none', fontFamily: 'inherit', color: 'var(--text-primary)',
          }} />
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <Btn icon="sparkle" onClick={() => generate(false)} disabled={phase === 'loading'}>
              {phase === 'loading' ? 'Drafting…' : (draft ? 'Re-draft' : 'Generate draft')}
            </Btn>
            <Btn variant="ghost" size="sm" onClick={() => generate(true)} disabled={phase === 'loading'} style={{ marginLeft: 'auto' }}>
              Simulate failure
            </Btn>
          </div>

          {/* Loading skeleton */}
          {phase === 'loading' && <BuilderSkeleton />}

          {phase === 'error' && (
            <div style={{ marginTop: 16 }}>
              <X.ErrorCard
                title="Couldn't reach Anthropic"
                message="The API returned a 503 or your key was rate-limited. Try again, or check the Anthropic status page."
                onRetry={() => generate(false)}
              />
            </div>
          )}

          {phase === 'done' && draft && (
            <div style={{ marginTop: 16, padding: 18, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', animation: 'agpFadeIn 240ms var(--ease-out)' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                <WorkItemTypeBadge type={draft.type} />
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
                  Draft · edit before creating
                </span>
              </div>
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', padding: 0 }} />
              <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={4}
                style={{ width: '100%', marginTop: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: 10, fontSize: 13, lineHeight: 1.6, resize: 'vertical', outline: 'none', fontFamily: 'inherit', color: 'var(--text-primary)' }} />
              <div style={{ marginTop: 10, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Acceptance criteria</div>
              <ul style={{ margin: '6px 0 0', padding: '0 0 0 18px', fontSize: 13, lineHeight: 1.7 }}>
                {draft.acceptanceCriteria.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
              <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                {draft.tags.map((t) => <Pill key={t}>{t}</Pill>)}
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" icon="azure" disabled={phase !== 'done' || !draft} onClick={onClose}>Create in Azure DevOps</Btn>
        </div>
      </Modal>
    );
  }

  function BuilderSkeleton() {
    return (
      <div style={{ marginTop: 16, padding: 18, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'agpSpin 700ms linear infinite' }} />
          <span style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 600 }}>
            Asking {AGP_MOCK.config.modelName}…
          </span>
        </div>
        {[80, 60, 90, 70, 85, 50].map((w, i) => (
          <div key={i} style={{
            height: i === 0 ? 18 : 10,
            width: `${w}%`,
            background: 'linear-gradient(90deg, var(--surface-3) 0%, var(--surface) 50%, var(--surface-3) 100%)',
            backgroundSize: '200% 100%',
            borderRadius: 4,
            marginBottom: i === 0 ? 16 : 6,
            animation: 'agpShimmer 1.6s ease-in-out infinite',
          }} />
        ))}
      </div>
    );
  }

  function WIDetail({ item, onClose }) {
    return (
      <Modal onClose={onClose} title={`#${item.id} · ${item.title}`} sub={`${item.area} · ${item.points} pts`} width={620}>
        <div style={{ padding: 22 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <WorkItemTypeBadge type={item.type} />
            <StateBadge state={item.state} />
          </div>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            Live from Azure DevOps. State changes write back via PATCH <code style={{ fontFamily: 'var(--font-mono)' }}>.../workitems/{item.id}</code>.
          </p>
          <div style={{ marginTop: 14, padding: 14, background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 'var(--r-md)' }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#7a5a05', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6, display: 'flex', gap: 6, alignItems: 'center' }}><Icon name="sparkle" size={12} /> AI suggestion</div>
            <div style={{ fontSize: 13, lineHeight: 1.55 }}>Looks like a likely fit for the partial-cascade fix in PR #1147. I can open the PR detail with an AI summary if useful.</div>
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
    const [phase, setPhase]     = useState('idle');
    const [summary, setSummary] = useState(null);
    function summarize(forceError = false) {
      setPhase('loading');
      setTimeout(() => {
        if (forceError) { setPhase('error'); return; }
        setSummary({
          what: "Preserves dirty state on partial vehicle cascade. Splits the vehicle update from the dirty-marking step and adds a guard so single-vehicle edits don't cascade-clear unrelated dirty state.",
          why:  "Fixes #24812.",
          watch:["Guard skips cascade when changedVehicles is empty — verify with seeded test.", "Partial-cascade branch updates the map in place.", "No e2e coverage on the empty-changes path."],
        });
        setPhase('done');
      }, 1100);
    }
    return (
      <Modal onClose={onClose} title={`!${pr.id} · ${pr.title}`} sub={`${pr.repo} · ${pr.changes}`} width={720}>
        <div style={{ padding: 22 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <Pill tone="navy"><Icon name={pr.source === 'ado' ? 'azure' : 'github'} size={11} /> {pr.source === 'ado' ? 'Azure DevOps' : 'GitHub'}</Pill>
            <StateBadge state={pr.status} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn icon="sparkle" onClick={() => summarize(false)} disabled={phase === 'loading'}>
              {phase === 'loading' ? 'Reading PR…' : 'Summarize this PR'}
            </Btn>
            <Btn variant="ghost" size="sm" onClick={() => summarize(true)} disabled={phase === 'loading'}>Simulate failure</Btn>
          </div>

          {phase === 'loading' && (
            <div style={{ marginTop: 14 }}>
              <ToolCall label="get_file" detail="vehicles-form.adapter.ts" status="…" />
              <div style={{ marginTop: 10 }}>
                {[90, 70, 80].map((w, i) => (
                  <div key={i} style={{
                    height: 10, width: `${w}%`,
                    background: 'linear-gradient(90deg, var(--surface-3) 0%, var(--surface) 50%, var(--surface-3) 100%)',
                    backgroundSize: '200% 100%',
                    borderRadius: 4, marginBottom: 6,
                    animation: 'agpShimmer 1.6s ease-in-out infinite',
                  }} />
                ))}
              </div>
            </div>
          )}

          {phase === 'error' && (
            <div style={{ marginTop: 14 }}>
              <X.ErrorCard
                title="Couldn't summarize"
                message="Anthropic rejected the request — likely a too-long context window. I'll try a shorter prompt."
                onRetry={() => summarize(false)}
              />
            </div>
          )}

          {phase === 'done' && summary && (
            <div style={{ marginTop: 14, padding: 16, background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 'var(--r-md)', animation: 'agpFadeIn 240ms var(--ease-out)' }}>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}><strong>What:</strong> {summary.what}</p>
              <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.6 }}><strong>Why:</strong> {summary.why}</p>
              <p style={{ margin: '10px 0 4px', fontSize: 12.5, fontWeight: 600 }}>Watch in review:</p>
              <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 13, lineHeight: 1.65 }}>{summary.watch.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </div>
          )}
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
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
    const [phase, setPhase] = useState('idle');

    function aiDraft(forceError = false) {
      setPhase('loading'); setBody('');
      setTimeout(() => {
        if (forceError) { setPhase('error'); return; }
        setBody(`Hey ${(email.from || '').split(' ')[0] || 'there'},\n\nThanks for the flag — I'll take a second pass on the partial-cascade branch tonight and add a guard for the empty-changes case. Will ping you when it lands.\n\n— Dillon`);
        setPhase('done');
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
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} placeholder={phase === 'loading' ? 'Claude is drafting…' : 'Write a message, or use Draft with AI…'} style={{
            width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
            padding: 12, fontSize: 13.5, lineHeight: 1.6, resize: 'vertical', outline: 'none', fontFamily: 'inherit', color: 'var(--text-primary)',
          }} />

          {phase === 'loading' && (
            <div style={{ marginTop: 12, padding: 12, background: 'var(--surface-2)', border: '1px dashed var(--border)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'agpSpin 700ms linear infinite' }} />
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>Drafting reply…</span>
            </div>
          )}

          {phase === 'error' && (
            <div style={{ marginTop: 12 }}>
              <X.ErrorCard compact title="Draft failed" message="Anthropic timed out. Try again — usually works on the next attempt." onRetry={() => aiDraft(false)} />
            </div>
          )}

          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <Btn icon="sparkle" variant="secondary" onClick={() => aiDraft(false)} disabled={phase === 'loading'}>
              {phase === 'loading' ? 'Drafting…' : 'Draft reply with AI'}
            </Btn>
            <Btn variant="ghost" size="sm" onClick={() => aiDraft(true)} disabled={phase === 'loading'} style={{ marginLeft: 'auto' }}>Simulate failure</Btn>
          </div>
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Btn variant="ghost" onClick={onClose}>Discard</Btn>
          <Btn variant="primary" icon="send" disabled={!body.trim()}>Send</Btn>
        </div>
      </Modal>
    );
  }

  /* ────────────────────── New PR modal ────────────────────── */

  function NewPRModal({ onClose }) {
    const M = AGP_MOCK;
    const [source, setSource]   = useState('ado');
    const [repo, setRepo]       = useState('AGP.ELO.WebPortal');
    const [from, setFrom]       = useState('feature/pin-files');
    const [into, setInto]       = useState('main');
    const [title, setTitle]     = useState('feat(chat): pin repo files to chat threads');
    const [body, setBody]       = useState('');
    const [linkWI, setLinkWI]   = useState('#24798');
    const [reviewers, setRev]   = useState(['m.park', 'a.khan']);
    const [phase, setPhase]     = useState('idle');     // idle | loading | done | error
    const [creating, setCreating] = useState(false);

    function aiDescription(forceError = false) {
      setPhase('loading'); setBody('');
      setTimeout(() => {
        if (forceError) { setPhase('error'); return; }
        setBody(
`## What

Adds a pin icon to every file in the repo tree. Pinned files appear as pills above the chat composer and are prepended to every assistant message as system context.

## Why

Linked: ${linkWI}. Tool-call round-trips for "what's in this file" are slow when the user already knows which file matters. Pinning skips the search step.

## How to test

1. Open Repos & PRs, expand any file.
2. Click the pin icon.
3. Open the assistant drawer — the file appears as a pill.
4. Ask "explain this file" — assistant references it without a tool call.

## Risk

Low. Pinned context is per-conversation and clears on sign-out.`);
        setPhase('done');
      }, 1200);
    }

    function create() {
      setCreating(true);
      setTimeout(() => { setCreating(false); onClose(); }, 800);
    }

    return (
      <Modal onClose={onClose} title="New pull request" sub={`${source === 'ado' ? 'Azure DevOps' : 'GitHub'} \u00b7 ${repo}`} width={720}>
        <div style={{ padding: 22 }}>
          <FieldLabel>Repository</FieldLabel>
          <div style={{ display: 'flex', gap: 4, background: 'var(--surface-3)', borderRadius: 'var(--r-sm)', padding: 3, marginBottom: 10, width: 'fit-content' }}>
            {['ado', 'github'].map((s) => (
              <button key={s} onClick={() => setSource(s)} style={{
                padding: '6px 12px', borderRadius: 4,
                fontSize: 12, fontWeight: 600,
                background: source === s ? 'var(--surface)' : 'transparent',
                color:      source === s ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow:  source === s ? 'var(--shadow-sm)' : 'none',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                <Icon name={s === 'ado' ? 'azure' : 'github'} size={13} />
                {s === 'ado' ? 'Azure DevOps' : 'GitHub'}
              </button>
            ))}
          </div>
          <select value={repo} onChange={(e) => setRepo(e.target.value)} style={{
            width: '100%',
            background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
            padding: '10px 12px', fontSize: 13.5, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)',
            outline: 'none', cursor: 'pointer',
          }}>
            {M.repos.filter((r) => r.source === source).map((r) => <option key={r.id}>{r.name}</option>)}
          </select>

          <div style={{ height: 14 }} />

          <Row2>
            <div>
              <FieldLabel>Source branch</FieldLabel>
              <Input value={from} onChange={setFrom} mono icon="git" />
            </div>
            <div>
              <FieldLabel>Target branch</FieldLabel>
              <Input value={into} onChange={setInto} mono icon="git" />
            </div>
          </Row2>

          <div style={{ height: 14 }} />

          <FieldLabel>Title</FieldLabel>
          <Input value={title} onChange={setTitle} />

          <div style={{ height: 14 }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <FieldLabel>Description</FieldLabel>
            <button onClick={() => aiDescription(false)} disabled={phase === 'loading'} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 'var(--r-sm)',
              fontSize: 11.5, fontWeight: 600, color: 'var(--primary)',
              background: 'var(--primary-soft)',
              border: '1px solid transparent',
            }}>
              <Icon name="sparkle" size={11} /> {phase === 'loading' ? 'Drafting\u2026' : 'Draft with AI'}
            </button>
          </div>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8}
            placeholder="What changed? Why? Anything to watch in review?"
            style={{
              width: '100%',
              background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
              padding: 12, fontSize: 13, lineHeight: 1.6, resize: 'vertical', outline: 'none',
              fontFamily: 'var(--font-mono)', color: 'var(--text-primary)',
            }} />

          {phase === 'loading' && (
            <div style={{ marginTop: 10, padding: 10, background: 'var(--surface-2)', border: '1px dashed var(--border)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'agpSpin 700ms linear infinite' }} />
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>{AGP_MOCK.config.modelName} drafting description\u2026</span>
            </div>
          )}
          {phase === 'error' && (
            <div style={{ marginTop: 10 }}>
              <X.ErrorCard compact title="Draft failed" message="Anthropic timed out. Try again, or write the description manually." onRetry={() => aiDescription(false)} />
            </div>
          )}

          <div style={{ height: 14 }} />

          <Row2>
            <div>
              <FieldLabel>Linked work item</FieldLabel>
              <select value={linkWI} onChange={(e) => setLinkWI(e.target.value)} style={{
                width: '100%',
                background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                padding: '10px 12px', fontSize: 13.5, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)',
                outline: 'none', cursor: 'pointer',
              }}>
                {M.workItems.map((w) => <option key={w.id}>{`#${w.id} \u2014 ${w.title}`}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Reviewers</FieldLabel>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '8px 10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', minHeight: 40 }}>
                {reviewers.map((r) => (
                  <span key={r} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '3px 8px', background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 999, fontSize: 11.5, fontFamily: 'var(--font-mono)',
                  }}>
                    <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontSize: 9, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      {r.split('.')[0][0].toUpperCase()}{r.split('.')[1] ? r.split('.')[1][0].toUpperCase() : ''}
                    </span>
                    {r}
                    <button onClick={() => setRev(reviewers.filter((x) => x !== r))} style={{ color: 'var(--text-tertiary)' }}>
                      <Icon name="x" size={10} />
                    </button>
                  </span>
                ))}
                <button onClick={() => setRev([...reviewers, 'b.reyes'])} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 8px', fontSize: 11.5, color: 'var(--text-secondary)',
                  border: '1px dashed var(--border-strong)', borderRadius: 999,
                  fontFamily: 'var(--font-mono)',
                }}>
                  <Icon name="plus" size={10} /> Add
                </button>
              </div>
            </div>
          </Row2>

          <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="lightning" size={12} style={{ color: 'var(--text-tertiary)' }} />
            <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
              On create: <code style={{ fontFamily: 'var(--font-mono)' }}>POST {source === 'ado' ? 'dev.azure.com/.../pullrequests' : 'github.com/repos/.../pulls'}</code>
            </span>
          </div>
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <Btn variant="ghost" onClick={onClose} disabled={creating}>Cancel</Btn>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" disabled={creating}>Save as draft</Btn>
            <Btn variant="primary" icon={creating ? null : 'pr'} disabled={!title || creating} onClick={create}>
              {creating && <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', animation: 'agpSpin 700ms linear infinite' }} />}
              {creating ? 'Creating\u2026' : 'Create pull request'}
            </Btn>
          </div>
        </div>
      </Modal>
    );
  }

  /* ────────────────────── New Event modal ────────────────────── */

  function NewEventModal({ onClose }) {
    const [title, setTitle]    = useState('PR review with Maya');
    const [day, setDay]        = useState('Thu');
    const [start, setStart]    = useState('14:00');
    const [duration, setDur]   = useState(30);
    const [attendees, setAtt]  = useState([
      { name: 'Maya Park',    email: 'maya.park@agp.com' },
    ]);
    const [teams, setTeams]    = useState(true);
    const [body, setBody]      = useState('');
    const [phase, setPhase]    = useState('idle');
    const [creating, setCreating] = useState(false);

    function aiDraft(forceError = false) {
      setPhase('loading'); setBody('');
      setTimeout(() => {
        if (forceError) { setPhase('error'); return; }
        setTitle('Walk through partial-cascade fix');
        setDur(30);
        setBody(`Quick sync on PR !1147.\n\nAgenda:\n  \u2022 The empty-changes guard \u2014 confirm we want it in the cascade path.\n  \u2022 Reviewer signoff plan.\n  \u2022 Roll-out window (Thursday EOD?).`);
        setPhase('done');
      }, 1100);
    }
    function create() {
      setCreating(true);
      setTimeout(() => { setCreating(false); onClose(); }, 700);
    }

    return (
      <Modal onClose={onClose} title="New event" sub="Created in your Outlook calendar via Microsoft Graph" width={640}>
        <div style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <FieldLabel>Title</FieldLabel>
            <button onClick={() => aiDraft(false)} disabled={phase === 'loading'} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 'var(--r-sm)',
              fontSize: 11.5, fontWeight: 600, color: 'var(--primary)',
              background: 'var(--primary-soft)',
              border: '1px solid transparent',
            }}>
              <Icon name="sparkle" size={11} /> {phase === 'loading' ? 'Drafting\u2026' : 'Draft event with AI'}
            </button>
          </div>
          <Input value={title} onChange={setTitle} placeholder="What's this meeting about?" />

          <div style={{ height: 14 }} />

          <Row2>
            <div>
              <FieldLabel>Day</FieldLabel>
              <select value={day} onChange={(e) => setDay(e.target.value)} style={{
                width: '100%',
                background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                padding: '10px 12px', fontSize: 13.5, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)',
                outline: 'none',
              }}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Start</FieldLabel>
              <Input value={start} onChange={setStart} mono />
            </div>
          </Row2>

          <div style={{ height: 14 }} />

          <FieldLabel>Duration</FieldLabel>
          <div style={{ display: 'flex', gap: 4 }}>
            {[15, 30, 45, 60].map((d) => (
              <button key={d} onClick={() => setDur(d)} style={{
                padding: '7px 14px', fontSize: 12.5, fontWeight: 600,
                borderRadius: 'var(--r-sm)',
                background: duration === d ? 'var(--primary)' : 'var(--surface-2)',
                color:      duration === d ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${duration === d ? 'var(--primary)' : 'var(--border)'}`,
              }}>{d} min</button>
            ))}
          </div>

          <div style={{ height: 14 }} />

          <FieldLabel>Attendees</FieldLabel>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '8px 10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', minHeight: 44 }}>
            {attendees.map((a) => (
              <span key={a.email} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 10px',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 999, fontSize: 12,
              }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontSize: 9.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  {a.name.split(' ').map((s) => s[0]).join('')}
                </span>
                {a.name}
                <button onClick={() => setAtt(attendees.filter((x) => x.email !== a.email))} style={{ color: 'var(--text-tertiary)' }}>
                  <Icon name="x" size={11} />
                </button>
              </span>
            ))}
            <button onClick={() => setAtt([...attendees, { name: 'Aamir Khan', email: 'aamir.khan@agp.com' }])} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', fontSize: 12, color: 'var(--text-secondary)',
              border: '1px dashed var(--border-strong)', borderRadius: 999,
            }}>
              <Icon name="plus" size={10} /> Add attendee
            </button>
          </div>

          <div style={{ height: 14 }} />

          <FieldLabel>Description</FieldLabel>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4}
            placeholder="Optional. Agenda, links, prep notes\u2026"
            style={{
              width: '100%',
              background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
              padding: 12, fontSize: 13, lineHeight: 1.55, resize: 'vertical', outline: 'none',
              fontFamily: 'inherit', color: 'var(--text-primary)',
            }} />

          {phase === 'loading' && (
            <div style={{ marginTop: 10, padding: 10, background: 'var(--surface-2)', border: '1px dashed var(--border)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'agpSpin 700ms linear infinite' }} />
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>{AGP_MOCK.config.modelName} drafting agenda\u2026</span>
            </div>
          )}
          {phase === 'error' && (
            <div style={{ marginTop: 10 }}>
              <X.ErrorCard compact title="Draft failed" message="Anthropic timed out. Try again, or fill in the agenda yourself." onRetry={() => aiDraft(false)} />
            </div>
          )}

          <div style={{ height: 14 }} />

          <button onClick={() => setTeams(!teams)} style={{
            width: '100%',
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px',
            background: teams ? 'var(--primary-soft)' : 'var(--surface-2)',
            border: `1px solid ${teams ? 'var(--primary)' : 'var(--border)'}`,
            borderRadius: 'var(--r-md)',
            textAlign: 'left',
          }}>
            <span style={{
              width: 18, height: 18, borderRadius: 4,
              background: teams ? 'var(--primary)' : 'transparent',
              border: teams ? '1px solid var(--primary)' : '1px solid var(--border)',
              color: '#fff',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>{teams && <Icon name="check" size={11} />}</span>
            <Icon name="teams" size={14} style={{ color: teams ? 'var(--primary)' : 'var(--text-tertiary)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Add Microsoft Teams meeting</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>A Teams join link will be attached to the event.</div>
            </div>
          </button>
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <Btn variant="ghost" onClick={onClose} disabled={creating}>Cancel</Btn>
          <Btn variant="primary" icon={creating ? null : 'calendar'} disabled={!title || creating} onClick={create}>
            {creating && <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', animation: 'agpSpin 700ms linear infinite' }} />}
            {creating ? 'Creating\u2026' : 'Create event'}
          </Btn>
        </div>
      </Modal>
    );
  }

  /* ────────────────────── Profile Settings page ────────────────────── */

  function SaveIndicator({ state, lastSavedAt, verbose }) {
    if (state === 'clean')
      return verbose ? <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>No unsaved changes</span> : null;
    if (state === 'dirty')
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--accent-hover)', fontFamily: 'var(--font-mono)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
          Unsaved changes
        </span>
      );
    if (state === 'saving')
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'agpSpin 700ms linear infinite' }} />
          Saving…
        </span>
      );
    if (state === 'saved') {
      const when = lastSavedAt ? `at ${lastSavedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'just now';
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--agp-green-status)', fontFamily: 'var(--font-mono)' }}>
          <Icon name="check" size={12} />
          Saved {when}
        </span>
      );
    }
    return null;
  }

  function ProfileSettings({ onBack, onSave }) {
    const M = AGP_MOCK;
    const initial = {
      role: 'SoftwareEngineer',
      anthropicKey: 'sk-ant-api03-AAA-stub-stub-stub-stub-stub',
      adoOrg: 'agp-co', adoProject: 'ELO Platform',
      ghOrg: 'agp-co', ghPat: 'ghp_StubStubStubStubStubStubStubStub',
      channels: [
        { teamId: 't-elo', teamName: 'ELO Platform', channelId: 'c-elo-general',    channelName: 'general' },
        { teamId: 't-elo', teamName: 'ELO Platform', channelId: 'c-elo-fe',         channelName: 'dev-frontend' },
        { teamId: 't-eng', teamName: 'AGP Engineering', channelId: 'c-eng-announce',channelName: 'announce' },
      ],
      personaText: "Be concise. Match the team's voice — pragmatic, direct, never effusive. Prefer plain prose, no markdown unless explicitly asked. When referencing code, cite file path + line number.",
      postingEnabled: false,
    };
    const [data, setData]       = useState(initial);
    const [savedState, setSaved] = useState('clean');  // 'clean' | 'dirty' | 'saving' | 'saved'
    const [lastSavedAt, setLastSavedAt] = useState(null);
    const u = (p) => { setData((d) => ({ ...d, ...p })); setSaved('dirty'); };

    function save() {
      setSaved('saving');
      setTimeout(() => {
        setSaved('saved');
        setLastSavedAt(new Date());
        onSave && onSave(data);
      }, 700);
    }
    function discard() {
      setData(initial);
      setSaved('clean');
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', overflowY: 'auto' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 28px', height: 56, display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 'var(--r-sm)', color: 'var(--text-secondary)', fontSize: 12.5 }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Icon name="arrow-left" size={13} /> Back to workbench
          </button>
          <div style={{ height: 22, width: 1, background: 'var(--border)' }} />
          <AGPLogo height={22} />
          <div style={{ fontSize: 13.5, fontWeight: 500 }}>Profile settings</div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <SaveIndicator state={savedState} lastSavedAt={lastSavedAt} />
            <X.RolePill role={data.role} />
          </div>
        </div>

        <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px 28px 64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <span style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700 }}>
              {M.user.initials}
            </span>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-.01em' }}>{M.user.name}</h1>
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{M.user.email}</div>
            </div>
          </div>

          <Section icon="user" title="Your role" subtitle="Changes the assistant's system prompt and a few role-specific shortcuts.">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                ['ProductOwner',     'Product Owner',     'work'],
                ['SoftwareEngineer', 'Software Engineer', 'code'],
                ['QA',               'QA Engineer',       'bug'],
              ].map(([k, l, i]) => (
                <button key={k} onClick={() => u({ role: k })} style={{
                  padding: 14, borderRadius: 'var(--r-md)',
                  background: data.role === k ? 'var(--primary-soft)' : 'var(--surface)',
                  border: `1px solid ${data.role === k ? 'var(--primary)' : 'var(--border)'}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, textAlign: 'left',
                }}>
                  <Icon name={i} size={18} style={{ color: data.role === k ? 'var(--primary)' : 'var(--text-tertiary)' }} />
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{l}</div>
                </button>
              ))}
            </div>
          </Section>

          <Section icon="sparkle" title="Anthropic API key" subtitle={`${AGP_MOCK.config.modelName} · encrypted with ${AGP_MOCK.config.encryptionAtRest} at rest.`}>
            <X.ConnField label="API key" value={data.anthropicKey} onChange={(v) => u({ anthropicKey: v })}
              placeholder="sk-ant-…" type="password" icon="lock" validator={X.validators.anthropic}
              hint="Your assistant's name is auto-read from your local Claude configuration. Edit it in ~/.claude/persona.json." />
          </Section>

          <Section icon="azure" title="Azure DevOps" subtitle="Auth inherited from your Microsoft sign-in — no PAT to manage here.">
            <Row2>
              <div><FieldLabel>Organization</FieldLabel><Input value={data.adoOrg} onChange={(v) => u({ adoOrg: v })} mono icon="azure" /></div>
              <div><FieldLabel>Project</FieldLabel><Input value={data.adoProject} onChange={(v) => u({ adoProject: v })} mono /></div>
            </Row2>
            <div style={{
              marginTop: 12,
              padding: '10px 12px',
              background: 'rgba(46,125,50,0.08)',
              border: '1px solid rgba(46,125,50,0.32)',
              borderRadius: 'var(--r-sm)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ width: 22, height: 22, borderRadius: 'var(--r-sm)', background: 'rgba(46,125,50,0.16)', color: 'var(--agp-green-status)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="check" size={12} />
              </span>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Connected via {M.user.email}</strong> ·
                Sign out and back in to refresh the Microsoft token if access stops working.
              </div>
            </div>
          </Section>

          <Section icon="github" title="GitHub" subtitle="agp-co · 14 repos">
            <Row2>
              <div><FieldLabel>Org or username</FieldLabel><Input value={data.ghOrg} onChange={(v) => u({ ghOrg: v })} mono icon="github" /></div>
              <div><X.ConnField label="Personal access token" value={data.ghPat} onChange={(v) => u({ ghPat: v })}
                placeholder="ghp_…" type="password" icon="lock" validator={X.validators.githubPat}
                hint="Fine-grained token with repo + pull_request scopes." /></div>
            </Row2>
          </Section>

          <Section icon="teams" title="Teams channels" subtitle={`${data.channels.length} of 3 selected · we'll watch for @mentions and replies`}>
            {!data.postingEnabled && (
              <div style={{ marginBottom: 12 }}><X.ScopeWarning /></div>
            )}
            <X.TeamsPicker value={data.channels} onChange={(channels) => u({ channels })} max={3} />
          </Section>

          <Section icon="lightning" title="Bot persona override" subtitle="Optional. Paste a persona file if the auto-read from ~/.claude/ doesn't pick up your custom prompt.">
            <textarea value={data.personaText} onChange={(e) => u({ personaText: e.target.value })}
              rows={6}
              style={{
                width: '100%',
                background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                padding: 12, fontSize: 13, lineHeight: 1.55, resize: 'vertical', outline: 'none',
                fontFamily: 'var(--font-mono)', color: 'var(--text-primary)',
              }}
            />
            <div style={{ marginTop: 6, fontSize: 11.5, color: 'var(--text-tertiary)' }}>
              Prepended to every system prompt. Leave blank to use the role-default prompt only.
            </div>
          </Section>

          <div style={{ marginTop: 28, padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Icon name="lightning" size={14} style={{ color: 'var(--text-tertiary)' }} />
            <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
              Sign out and back in to refresh your Microsoft Graph token.
            </span>
            <Btn variant="ghost" icon="logout" size="sm" style={{ marginLeft: 'auto', color: 'var(--agp-red)' }}>
              Disconnect this workspace
            </Btn>
          </div>

          {/* spacer so content isn't hidden under the sticky save bar */}
          <div style={{ height: 70 }} />
        </div>

        {/* Sticky save bar */}
        <div style={{
          position: 'sticky', bottom: 0, left: 0, right: 0,
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          boxShadow: '0 -1px 0 var(--border), 0 -8px 24px rgba(15,26,42,0.06)',
          padding: '12px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          zIndex: 5,
        }}>
          <SaveIndicator state={savedState} lastSavedAt={lastSavedAt} verbose />
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="ghost" onClick={discard} disabled={savedState !== 'dirty'}>
              Discard changes
            </Btn>
            <Btn
              variant="primary"
              icon={savedState === 'saving' ? null : 'check'}
              onClick={save}
              disabled={savedState !== 'dirty'}
            >
              {savedState === 'saving' && <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', animation: 'agpSpin 700ms linear infinite' }} />}
              {savedState === 'saving' ? 'Saving…' : 'Save changes'}
            </Btn>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────── Root ─────────────────────────── */

  function App() {
    const [screen, setScreen] = useState('auth');
    const [profile, setProfile] = useState({ ...AGP_MOCK.user });
    const { theme } = useAGP();
    return (
      <div className={`agp-app theme-${theme}`} style={{ position: 'absolute', inset: 0 }}>
        {screen === 'auth'    && <SignIn       onSignIn={() => setScreen('onboard')} />}
        {screen === 'onboard' && <Onboarding   onComplete={(d) => { setProfile((p) => ({ ...p, ...d })); setScreen('station'); }} />}
        {screen === 'station' && <Station      profile={profile} onSignOut={() => setScreen('auth')} onProfile={() => setScreen('profile')} />}
        {screen === 'profile' && <ProfileSettings onBack={() => setScreen('station')} />}
      </div>
    );
  }

  return { App, ProfileSettings, SignIn, Onboarding };
})();

window.OPTB2 = OPTB2;
