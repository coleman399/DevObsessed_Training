/* ─────────────────────────────────────────────────────────────────────────
 * Option B · "Workbench"
 * Tab-first focus workspace. Each section (Work / Repos / Mail / Calendar /
 * Teams) takes the full canvas, AI assistant is a slide-out side drawer.
 * Mobile-friendly: tabs collapse to a bottom nav, drawer becomes fullscreen.
 *   1. Microsoft sign-in (single centered card)
 *   2. Onboarding as a single-page settings form
 *   3. Station: top app bar → tab strip → focused canvas + AI drawer
 * ───────────────────────────────────────────────────────────────────────── */

const OPTB = (function () {
  const { useState, useEffect, useRef } = React;

  /* ───────── Sign-in ───────── */

  function SignIn({ onSignIn }) {
    const [loading, setLoading] = useState(false);
    return (
      <div style={{
        position: 'absolute', inset: 0,
        background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}>
        {/* Faint navy field at the top */}
        <div aria-hidden style={{
          position: 'absolute', inset: '0 0 auto 0', height: '52%',
          background: 'linear-gradient(180deg, var(--primary) 0%, transparent 100%)',
          opacity: 0.07,
        }} />

        <div style={{
          position: 'relative', zIndex: 1,
          width: '100%', maxWidth: 420,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)',
          boxShadow: 'var(--shadow-lg)',
          padding: '36px 32px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <AGPLogo height={32} />
            <div style={{ marginTop: 22, fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
              Command Station
            </div>
            <h2 style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 600, letterSpacing: '-.01em', color: 'var(--text-primary)' }}>
              Welcome to your workbench.
            </h2>
            <p style={{ margin: '8px 0 0', fontSize: 13.5, lineHeight: 1.55, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 320 }}>
              Sign in with your AGP account to load your work items, PRs, inbox, and team channels.
            </p>
          </div>

          <div style={{ marginTop: 28 }}>
            <MicrosoftSignIn loading={loading} onClick={() => {
              setLoading(true);
              setTimeout(() => { setLoading(false); onSignIn(); }, 1200);
            }} />
          </div>

          <div style={{ marginTop: 18, padding: '12px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
            <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.14em', marginBottom: 6 }}>
              Requested scopes
            </div>
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

  /* ───────── Onboarding (single-page settings) ───────── */

  function Onboarding({ onComplete }) {
    const [data, setData] = useState({
      role: 'SoftwareEngineer',
      assistant: 'AGP Assistant',
      anthropicKey: '',
      adoOrg: 'agp-co', adoProject: 'ELO Platform', adoPat: '',
      ghOrg: 'agp-co', ghPat: '',
      teamsChannels: [
        { team: 'ELO Platform', channel: 'general' },
        { team: 'ELO Platform', channel: 'dev-frontend' },
      ],
    });
    const u = (p) => setData((d) => ({ ...d, ...p }));
    const sections = [
      { id: 'role',  title: 'Role & Assistant',    icon: 'user',     done: !!data.role && !!data.assistant },
      { id: 'key',   title: 'Anthropic API key',   icon: 'sparkle',  done: data.anthropicKey.length > 8 },
      { id: 'ado',   title: 'Azure DevOps',        icon: 'azure',    done: data.adoOrg && data.adoPat.length > 8 },
      { id: 'gh',    title: 'GitHub',              icon: 'github',   done: data.ghOrg && data.ghPat.length > 8 },
      { id: 'teams', title: 'Teams channels',      icon: 'teams',    done: data.teamsChannels.length > 0 },
    ];
    const completed = sections.filter((s) => s.done).length;

    return (
      <div style={{
        position: 'absolute', inset: 0,
        background: 'var(--bg)',
        overflowY: 'auto',
      }}>
        {/* slim top bar */}
        <div style={{
          position: 'sticky', top: 0,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          zIndex: 2,
          padding: '0 28px',
          height: 56,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <AGPLogo height={24} />
          <div style={{ height: 22, width: 1, background: 'var(--border)' }} />
          <div style={{ fontSize: 13.5, fontWeight: 500 }}>Set up your workbench</div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
              {completed} / {sections.length} complete
            </span>
            <div style={{ width: 80, height: 6, borderRadius: 3, background: 'var(--surface-3)', overflow: 'hidden' }}>
              <div style={{ width: `${(completed / sections.length) * 100}%`, height: '100%', background: 'var(--accent)', transition: 'width 240ms var(--ease-out)' }} />
            </div>
          </div>
        </div>

        <div style={{
          maxWidth: 820,
          margin: '0 auto',
          padding: '32px 28px 80px',
        }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-.01em' }}>Hi, Dillon. Let's set you up.</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            Connect your accounts so your assistant can read your work items, PRs, mail, calendar, and Teams channels.
            You can edit any of these later in <a href="#">Profile → Connections</a>.
          </p>

          <Section icon="user" title="Role & Assistant" subtitle="The role only shapes Claude's system prompt — everyone can build work items.">
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
                  cursor: 'pointer', textAlign: 'left',
                }}>
                  <Icon name={i} size={18} style={{ color: data.role === k ? 'var(--primary)' : 'var(--text-tertiary)' }} />
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{l}</div>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              <FieldLabel>Assistant name</FieldLabel>
              <Input value={data.assistant} onChange={(v) => u({ assistant: v })} placeholder="AGP Assistant" />
              <Hint>This is what Claude will call itself in replies — try “Atlas” or “ELO” if you want something shorter.</Hint>
            </div>
          </Section>

          <Section icon="sparkle" title="Anthropic API key" subtitle="Bring your own key (sk-ant-…). Encrypted with AES-256-GCM before storing.">
            <Input value={data.anthropicKey} onChange={(v) => u({ anthropicKey: v })} placeholder="sk-ant-api03-…" mono type="password" icon="lock" />
            <Hint>Get a key at console.anthropic.com. We use claude-sonnet-4-6 with streaming.</Hint>
          </Section>

          <Section icon="azure" title="Azure DevOps" subtitle="For work items, repos, and pull requests under your org / project.">
            <Row2>
              <div><FieldLabel>Organization</FieldLabel><Input value={data.adoOrg} onChange={(v) => u({ adoOrg: v })} mono icon="azure" /></div>
              <div><FieldLabel>Project</FieldLabel><Input value={data.adoProject} onChange={(v) => u({ adoProject: v })} mono /></div>
            </Row2>
            <div style={{ marginTop: 10 }}>
              <FieldLabel>Personal access token</FieldLabel>
              <Input value={data.adoPat} onChange={(v) => u({ adoPat: v })} placeholder="dewj4ks…" mono type="password" icon="lock" />
              <Hint>Scopes: Work Items (RW), Code (RW), Pull Requests (Contribute).</Hint>
            </div>
          </Section>

          <Section icon="github" title="GitHub" subtitle="For org repos, PRs, and code search outside Azure DevOps.">
            <Row2>
              <div><FieldLabel>Org or username</FieldLabel><Input value={data.ghOrg} onChange={(v) => u({ ghOrg: v })} mono icon="github" /></div>
              <div><FieldLabel>Personal access token</FieldLabel><Input value={data.ghPat} onChange={(v) => u({ ghPat: v })} placeholder="ghp_…" mono type="password" icon="lock" /></div>
            </Row2>
            <Hint>Fine-grained token with <code>repo</code> + <code>pull_request</code> scopes.</Hint>
          </Section>

          <Section icon="teams" title="Teams channels" subtitle="Up to 3 channels we'll watch for @mentions and replies.">
            <div style={{ display: 'grid', gap: 8 }}>
              {data.teamsChannels.map((c, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 32px', gap: 8, alignItems: 'end' }}>
                  <div><FieldLabel>Team</FieldLabel><Input value={c.team}    onChange={(v) => { const t = [...data.teamsChannels]; t[i] = { ...t[i], team: v };    u({ teamsChannels: t }); }} mono /></div>
                  <div><FieldLabel>Channel</FieldLabel><Input value={c.channel} onChange={(v) => { const t = [...data.teamsChannels]; t[i] = { ...t[i], channel: v }; u({ teamsChannels: t }); }} mono /></div>
                  <button onClick={() => u({ teamsChannels: data.teamsChannels.filter((_, j) => j !== i) })} style={{ width: 32, height: 38, color: 'var(--text-tertiary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--r-sm)' }}>
                    <Icon name="x" size={14} />
                  </button>
                </div>
              ))}
              {data.teamsChannels.length < 3 && (
                <button onClick={() => u({ teamsChannels: [...data.teamsChannels, { team: '', channel: '' }] })}
                  style={{
                    padding: 12, borderRadius: 'var(--r-md)',
                    border: '1px dashed var(--border-strong)',
                    color: 'var(--text-secondary)', fontSize: 12.5, fontWeight: 500,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                  <Icon name="plus" size={14} /> Add another channel
                </button>
              )}
            </div>
            <Hint>Need to post to channels? Ask IT to grant <code>ChannelMessage.Send</code>.</Hint>
          </Section>

          <div style={{
            position: 'sticky', bottom: 0,
            marginTop: 32,
            padding: '14px 0',
            display: 'flex', justifyContent: 'flex-end', gap: 10,
            background: 'linear-gradient(180deg, transparent 0%, var(--bg) 30%, var(--bg) 100%)',
          }}>
            <Btn variant="ghost" onClick={() => onComplete(data)}>Skip for now</Btn>
            <Btn variant="primary" iconRight="arrow-right" onClick={() => onComplete(data)}>
              Open my workbench
            </Btn>
          </div>
        </div>
      </div>
    );
  }

  /* tiny form atoms */
  function Section({ icon, title, subtitle, children }) {
    return (
      <section style={{
        marginTop: 26,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: 22,
      }}>
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
  function Hint({ children }) { return <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 6, lineHeight: 1.5 }}>{children}</div>; }
  function Row2({ children }) { return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>{children}</div>; }
  function Input({ value, onChange, placeholder, type = 'text', mono, icon }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
        {icon && <span style={{ paddingLeft: 12, color: 'var(--text-tertiary)' }}><Icon name={icon} size={14} /></span>}
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '10px 12px', fontSize: 13.5, fontFamily: mono ? 'var(--font-mono)' : 'inherit', color: 'var(--text-primary)' }}
        />
      </div>
    );
  }

  /* ───────── Station ───────── */

  function Station({ profile, onSignOut }) {
    const { theme, setTheme, role, assistant } = useAGP();
    const [tab, setTab] = useState('work');
    const [drawerOpen, setDrawerOpen] = useState(true);
    const [active, setActive] = useState({ wi: null, pr: null, email: null, builder: false });

    return (
      <div style={{
        position: 'absolute', inset: 0,
        background: 'var(--bg)',
        display: 'grid',
        gridTemplateRows: 'auto auto 1fr',
        minHeight: 0,
      }}>
        <AppBar profile={profile} onSignOut={onSignOut} theme={theme} setTheme={setTheme} drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} />
        <TabStrip tab={tab} setTab={setTab} />

        <div style={{
          display: 'grid',
          gridTemplateColumns: drawerOpen ? 'minmax(0, 1fr) 400px' : 'minmax(0, 1fr) 0',
          minHeight: 0,
          transition: 'grid-template-columns 240ms var(--ease-out)',
        }}>
          <main style={{ minHeight: 0, overflowY: 'auto', padding: '20px 28px 32px' }}>
            {tab === 'work'     && <WorkPane  onOpen={(wi) => setActive({ ...active, wi })} onBuilder={() => setActive({ ...active, builder: true })} role={role} />}
            {tab === 'repos'    && <ReposPane onOpenPR={(pr) => setActive({ ...active, pr })} />}
            {tab === 'mail'     && <MailPane  onOpen={(e) => setActive({ ...active, email: e })} />}
            {tab === 'calendar' && <CalendarPane />}
            {tab === 'teams'    && <TeamsPane />}
          </main>
          <ChatDrawer assistant={assistant} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        </div>

        {!drawerOpen && (
          <button onClick={() => setDrawerOpen(true)}
            style={{
              position: 'absolute', right: 20, bottom: 20,
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--primary)', color: '#fff',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-pop)',
              zIndex: 10,
            }}>
            <Icon name="sparkle" size={22} />
          </button>
        )}

        {active.builder && <Builder onClose={() => setActive({ ...active, builder: false })} />}
        {active.wi      && <WIDetail item={active.wi} onClose={() => setActive({ ...active, wi: null })} />}
        {active.pr      && <PRDetail pr={active.pr}   onClose={() => setActive({ ...active, pr: null })} />}
        {active.email   && <Compose email={active.email} onClose={() => setActive({ ...active, email: null })} />}
      </div>
    );
  }

  function AppBar({ profile, onSignOut, theme, setTheme, drawerOpen, setDrawerOpen }) {
    const [menu, setMenu] = useState(false);
    return (
      <div style={{
        height: 56,
        padding: '0 20px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 16,
        position: 'relative', zIndex: 5,
      }}>
        <AGPLogo height={26} />
        <div style={{ height: 22, width: 1, background: 'var(--border)' }} />
        <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)' }}>
          Command Station
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 12px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)',
            width: 280,
            fontSize: 12.5,
          }}>
            <Icon name="search" size={13} style={{ color: 'var(--text-tertiary)' }} />
            <span style={{ color: 'var(--text-tertiary)' }}>Search work items, PRs, mail…</span>
            <span style={{ marginLeft: 'auto', fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', padding: '1px 5px', border: '1px solid var(--border)', borderRadius: 3 }}>⌘K</span>
          </div>

          <IconBtn icon={theme === 'light' ? 'moon' : 'sun'} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} />
          <IconBtn icon="bell" badge />
          <IconBtn
            icon="sparkle"
            tone={drawerOpen ? 'primary' : 'default'}
            onClick={() => setDrawerOpen(!drawerOpen)}
            label={drawerOpen ? 'Hide AI' : 'Show AI'}
          />

          <div style={{ position: 'relative' }}>
            <button onClick={() => setMenu(!menu)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px 4px 4px', borderRadius: 999, background: 'var(--surface-2)' }}>
              <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{profile.initials}</span>
              <span style={{ fontSize: 13 }}>{profile.firstName}</span>
              <Icon name="chevron-down" size={12} />
            </button>
            {menu && (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-pop)', minWidth: 220, padding: 6, zIndex: 30 }}>
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
      </div>
    );
  }

  function IconBtn({ icon, onClick, badge, tone, label }) {
    return (
      <button onClick={onClick}
        title={label}
        style={{
          width: 34, height: 34, borderRadius: 'var(--r-sm)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: tone === 'primary' ? 'var(--primary)' : 'transparent',
          color: tone === 'primary' ? '#fff' : 'var(--text-secondary)',
          position: 'relative',
        }}
        onMouseEnter={(e) => { if (tone !== 'primary') e.currentTarget.style.background = 'var(--surface-hover)'; }}
        onMouseLeave={(e) => { if (tone !== 'primary') e.currentTarget.style.background = 'transparent'; }}
      >
        <Icon name={icon} size={15} />
        {badge && <span style={{ position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />}
      </button>
    );
  }
  function MenuItem({ icon, label, onClick }) {
    return (
      <button onClick={onClick} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--r-sm)', fontSize: 13, color: 'var(--text-primary)', textAlign: 'left' }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <Icon name={icon} size={14} style={{ color: 'var(--text-tertiary)' }} /> {label}
      </button>
    );
  }

  function TabStrip({ tab, setTab }) {
    const tabs = [
      { key: 'work',     label: 'Work items', icon: 'work',     count: AGP_MOCK.workItems.filter((w) => w.state !== 'Closed').length },
      { key: 'repos',    label: 'Repos & PRs',icon: 'pr',       count: AGP_MOCK.pullRequests.length },
      { key: 'mail',     label: 'Email',      icon: 'mail',     count: AGP_MOCK.emails.filter((e) => e.unread).length },
      { key: 'calendar', label: 'Calendar',   icon: 'calendar' },
      { key: 'teams',    label: 'Teams',      icon: 'teams',    count: AGP_MOCK.teamsMentions.length },
    ];
    return (
      <div style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 28px',
        display: 'flex',
        position: 'relative', zIndex: 4,
      }}>
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
              transition: 'color 140ms',
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
            </button>
          );
        })}
      </div>
    );
  }

  /* ───────── Panes ───────── */

  function WorkPane({ onOpen, onBuilder, role }) {
    const cols = ['New', 'Active', 'Resolved'];
    const M = AGP_MOCK;
    return (
      <>
        <PaneHeader title="Work items" sub="Pulled live from Azure DevOps · WIQL @me filter">
          <Btn variant="accent" icon="sparkle" onClick={onBuilder}>Draft with AI</Btn>
          <Btn variant="primary" icon="plus">New item</Btn>
        </PaneHeader>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 14,
          minHeight: 380,
        }}>
          {cols.map((c) => {
            const items = M.workItems.filter((w) => w.state === c);
            return (
              <div key={c} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                display: 'flex', flexDirection: 'column',
                minHeight: 280,
              }}>
                <div style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: c === 'Active' ? 'var(--primary)' : c === 'Resolved' ? 'var(--agp-green-status)' : 'var(--text-tertiary)' }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{c}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{items.length}</span>
                </div>
                <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map((w) => (
                    <button key={w.id} onClick={() => onOpen(w)} style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--r-sm)',
                      padding: 12,
                      textAlign: 'left',
                      display: 'flex', flexDirection: 'column', gap: 8,
                      cursor: 'pointer',
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
      </>
    );
  }

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

  function ReposPane({ onOpenPR }) {
    const M = AGP_MOCK;
    return (
      <>
        <PaneHeader title="Repositories & Pull Requests" sub="Azure DevOps + GitHub">
          <Btn variant="secondary" icon="search">Search code</Btn>
          <Btn variant="primary" icon="plus">New PR</Btn>
        </PaneHeader>

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
                padding: '12px 14px',
                borderBottom: i < M.pullRequests.length - 1 ? '1px solid var(--border)' : 'none',
                display: 'flex', flexDirection: 'column', gap: 6,
                background: 'transparent',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
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
      </>
    );
  }

  function MailPane({ onOpen }) {
    const M = AGP_MOCK;
    return (
      <>
        <PaneHeader title="Inbox" sub={`${M.emails.filter((e) => e.unread).length} unread · synced from Outlook`}>
          <Btn variant="primary" icon="edit">Compose</Btn>
        </PaneHeader>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
          {M.emails.map((e, i) => (
            <button key={e.id} onClick={() => onOpen(e)} style={{
              width: '100%', textAlign: 'left',
              padding: '14px 18px',
              borderBottom: i < M.emails.length - 1 ? '1px solid var(--border)' : 'none',
              background: e.unread ? 'rgba(235,182,59,0.04)' : 'transparent',
              display: 'grid', gridTemplateColumns: '8px 200px 1fr auto', gap: 16, alignItems: 'center',
              transition: 'background 120ms',
            }}
            onMouseEnter={(el) => el.currentTarget.style.background = 'var(--surface-hover)'}
            onMouseLeave={(el) => el.currentTarget.style.background = e.unread ? 'rgba(235,182,59,0.04)' : 'transparent'}
            >
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
      </>
    );
  }

  function CalendarPane() {
    const M = AGP_MOCK;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const dates = [12, 13, 14, 15, 16];
    return (
      <>
        <PaneHeader title="This week" sub="May 12 – 16, 2026">
          <Btn variant="secondary" icon="calendar">Today</Btn>
          <Btn variant="primary" icon="plus">New event</Btn>
        </PaneHeader>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          overflow: 'hidden',
        }}>
          {days.map((d, i) => (
            <div key={d} style={{
              borderRight: i < days.length - 1 ? '1px solid var(--border)' : 'none',
              padding: 14,
              minHeight: 320,
            }}>
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
      </>
    );
  }

  function TeamsPane() {
    const M = AGP_MOCK;
    return (
      <>
        <PaneHeader title="Teams" sub="Mentions across monitored channels">
          <Btn variant="primary" icon="send">Post to channel</Btn>
        </PaneHeader>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Card title="@ Mentions">
            {M.teamsMentions.map((m, i) => (
              <div key={m.id} style={{ padding: '14px 18px', borderBottom: i < M.teamsMentions.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{m.from}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{m.channel}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{m.time}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{m.text}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <Btn size="sm" variant="ghost" icon="comment">Reply</Btn>
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

  /* ───────── Chat drawer ───────── */

  function ChatDrawer({ assistant, open, onClose }) {
    const [thread, setThread] = useState(AGP_MOCK.seedThread);
    const [input, setInput]   = useState('');
    const [typing, setTyping] = useState(false);
    const [streamTarget, setStreamTarget] = useState(null);
    const streamingOut = useStreamingText(streamTarget, { speed: 4, tick: 22 });
    const threadRef = useRef(null);

    useEffect(() => { const el = threadRef.current; if (el) el.scrollTop = el.scrollHeight; }, [thread, typing, streamingOut, open]);

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
      setTimeout(() => {
        setThread((t) => [...t, { role: 'assistant', text: reply }]);
        setStreamTarget(null);
      }, 1100 + Math.min(reply.length * 6, 2400));
    }

    return (
      <aside style={{
        background: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
        transition: 'all 240ms var(--ease-out)',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
      }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 28, height: 28, borderRadius: 'var(--r-sm)', background: 'var(--primary)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="sparkle" size={14} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{assistant}</div>
            <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
              ● claude-sonnet-4-6
            </div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, color: 'var(--text-tertiary)', borderRadius: 'var(--r-sm)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={14} />
          </button>
        </div>

        <div ref={threadRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {thread.map((m, i) => <DrawerBubble key={i} m={m} assistant={assistant} />)}
          {streamTarget && <DrawerBubble m={{ role: 'assistant', text: streamingOut + '▍' }} assistant={assistant} />}
          {typing && <Typing />}
        </div>

        <div style={{ padding: 12, borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          {/* Suggested actions */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {['Draft a User Story', 'Summarize PR #1147', 'Where is JwtTokenService?'].map((s) => (
              <button key={s} onClick={() => setInput(s)} style={{
                padding: '5px 10px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 999,
                fontSize: 11.5, color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
              }}>{s}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '8px 8px 8px 12px' }}>
            <textarea value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              rows={1} placeholder={`Ask ${assistant} anything…`}
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
          maxWidth: '92%',
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

  /* ───────── Modals (delegated visually distinct via top-bar) ───────── */

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

  function Builder({ onClose }) {
    const [prompt, setPrompt] = useState('Add a draft-review-comment feature: user describes their concern, Claude drafts a constructive PR comment that the user can edit before posting.');
    const [draft, setDraft] = useState(null);
    const [gen, setGen]     = useState(false);
    function generate() {
      setGen(true); setDraft(null);
      setTimeout(() => {
        setDraft({
          type: 'User Story',
          title: 'Draft PR review comments with Claude',
          description: "As a reviewer, I want to describe my concern in plain English and have Claude draft a constructive PR comment, so that I can post higher-quality feedback in less time.",
          acceptanceCriteria: [
            "‘Draft comment’ button is visible on every PR detail view.",
            "User describes the concern in a textarea.",
            "Claude returns a draft comment with file/line citation when possible.",
            "User edits the draft and posts via the platform’s native PR comment API.",
          ],
          tags: ['ai', 'review'],
        });
        setGen(false);
      }, 1200);
    }
    return (
      <Modal onClose={onClose} title="Draft a work item with AI" sub="Plain language in, structured ADO work item out" width={680}>
        <div style={{ padding: 22 }}>
          <FieldLabel>Describe the work</FieldLabel>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} style={{
            width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
            padding: 12, fontSize: 13.5, lineHeight: 1.5, resize: 'vertical', outline: 'none', fontFamily: 'inherit', color: 'var(--text-primary)',
          }} />
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <Btn icon="sparkle" onClick={generate} disabled={gen}>{gen ? 'Drafting…' : (draft ? 'Re-draft' : 'Generate draft')}</Btn>
          </div>
          {gen && <ToolCall label="Anthropic" detail="claude-sonnet-4-6 · drafting…" status="…" />}
          {draft && (
            <div style={{ marginTop: 16, padding: 18, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}><WorkItemTypeBadge type={draft.type} /></div>
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', padding: 0 }} />
              <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={4} style={{ width: '100%', marginTop: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: 10, fontSize: 13, lineHeight: 1.6, resize: 'vertical', outline: 'none', fontFamily: 'inherit', color: 'var(--text-primary)' }} />
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
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    function summarize() {
      setLoading(true);
      setTimeout(() => {
        setSummary({
          what: "Preserves dirty state on partial vehicle cascade. Splits the vehicle update from the dirty-marking step and adds a guard so single-vehicle edits don't cascade-clear unrelated dirty state.",
          why:  "Fixes #24812.",
          watch:["Guard skips cascade when changedVehicles is empty — verify with seeded test.", "Partial-cascade branch updates the map in place.", "No e2e coverage on the empty-changes path."],
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
          <Btn icon="sparkle" onClick={summarize} disabled={loading}>{loading ? 'Reading PR…' : 'Summarize this PR'}</Btn>
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
    const [draft, setDraft] = useState(false);
    function aiDraft() {
      setDraft(true); setBody('');
      setTimeout(() => {
        setBody(`Hey ${(email.from || '').split(' ')[0] || 'there'},\n\nThanks for the flag — I'll take a second pass on the partial-cascade branch tonight and add a guard for the empty-changes case. Will ping you when it lands.\n\n— Dillon`);
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
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} placeholder="Write a message, or use Draft with AI…" style={{
            width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
            padding: 12, fontSize: 13.5, lineHeight: 1.6, resize: 'vertical', outline: 'none', fontFamily: 'inherit', color: 'var(--text-primary)',
          }} />
          <div style={{ marginTop: 12 }}>
            <Btn icon="sparkle" variant="secondary" onClick={aiDraft} disabled={draft}>{draft ? 'Drafting…' : 'Draft reply with AI'}</Btn>
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

window.OPTB = OPTB;
