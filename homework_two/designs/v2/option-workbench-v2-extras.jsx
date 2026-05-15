/* ─────────────────────────────────────────────────────────────────────────
 * Option B v2 — Shared extras
 * ConnField, ErrorCard, EmptyState, CredErrorBanner, ScopeWarning,
 * TeamsPicker, NotificationsBell, CommandPalette, ShortcutsOverlay
 * Used by the v2 station and Profile Settings page.
 * ───────────────────────────────────────────────────────────────────────── */

const OPTBX = (function () {
  const { useState, useEffect, useRef, useMemo } = React;

  /* ─────────────────────────── Validating field ─────────────────────────── */

  /* status: 'idle' | 'testing' | 'ok' | 'error'
   * Designed so an empty value stays 'idle' (no premature error flag). */
  function ConnField({ label, value, onChange, placeholder, type = 'text', mono = true, icon = 'lock', hint, validator, autoTestOnBlur = true }) {
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');
    const lastTested = useRef('');

    function reallyTest(v) {
      if (!v || v.length < 4) { setStatus('idle'); setMessage(''); return; }
      setStatus('testing');
      setMessage('Checking…');
      lastTested.current = v;
      const res = validator ? validator(v) : { ok: true };
      const done = (r) => {
        if (lastTested.current !== v) return;       // race-guard
        if (r.ok) { setStatus('ok'); setMessage(r.message || 'Connected'); }
        else      { setStatus('error'); setMessage(r.message || 'Could not verify'); }
      };
      /* Simulate latency. */
      setTimeout(() => done(res), 900 + Math.random() * 400);
    }

    function onBlur() {
      if (!autoTestOnBlur) return;
      if (!value) { setStatus('idle'); setMessage(''); return; }
      if (value === lastTested.current) return;
      reallyTest(value);
    }

    const borderColor =
      status === 'ok'      ? 'var(--agp-green-status)' :
      status === 'error'   ? 'var(--agp-red)' :
      'var(--border)';
    const ring =
      status === 'ok'      ? '0 0 0 3px rgba(46,125,50,0.18)' :
      status === 'error'   ? '0 0 0 3px rgba(248,58,64,0.18)' :
      'none';

    return (
      <div>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 6 }}>
          {label}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center',
          background: 'var(--surface-2)',
          border: `1px solid ${borderColor}`,
          borderRadius: 'var(--r-md)',
          boxShadow: ring,
          transition: 'all 160ms var(--ease-out)',
        }}>
          {icon && <span style={{ paddingLeft: 12, color: 'var(--text-tertiary)' }}><Icon name={icon} size={14} /></span>}
          <input
            type={type}
            value={value}
            onChange={(e) => { onChange(e.target.value); if (status !== 'idle') { setStatus('idle'); setMessage(''); } }}
            onBlur={onBlur}
            placeholder={placeholder}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              padding: '10px 12px', fontSize: 13.5,
              fontFamily: mono ? 'var(--font-mono)' : 'inherit', color: 'var(--text-primary)',
            }}
          />
          <button
            onClick={() => reallyTest(value)}
            disabled={!value || status === 'testing'}
            style={{
              margin: '4px 6px', padding: '6px 10px',
              fontSize: 11.5, fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              borderRadius: 'var(--r-sm)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              cursor: !value || status === 'testing' ? 'not-allowed' : 'pointer',
              opacity: !value ? 0.5 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {status === 'testing'
              ? <span style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'agpSpin 700ms linear infinite' }} />
              : <Icon name={status === 'ok' ? 'check' : status === 'error' ? 'x' : 'lightning'} size={12}
                  style={{ color: status === 'ok' ? 'var(--agp-green-status)' : status === 'error' ? 'var(--agp-red)' : 'var(--text-tertiary)' }} />}
            {status === 'testing' ? 'Testing' : status === 'ok' ? 'Connected' : status === 'error' ? 'Retry' : 'Test'}
          </button>
        </div>
        {(message || hint) && (
          <div style={{
            marginTop: 6,
            fontSize: 11.5,
            color: status === 'error' ? 'var(--agp-red)' : status === 'ok' ? 'var(--agp-green-status)' : 'var(--text-tertiary)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {status === 'ok'    && <Icon name="check" size={12} />}
            {status === 'error' && <Icon name="x" size={12} />}
            {message || hint}
          </div>
        )}
      </div>
    );
  }

  /* Realistic-feeling validators (for the prototype).
   * Each call simulates a real HTTP round-trip with a few possible outcomes:
   *   - ok: credential accepted by the upstream
   *   - invalid_format: caught locally before the request
   *   - auth_failed: 401 from the upstream
   *   - rate_limited: 429 from the upstream
   *   - network: couldn't reach the upstream at all
   * The prototype derives the outcome from substrings in the test value so
   * you can demo every state by typing keys like "ratelimit", "network", etc.
   * In production these would be the actual HTTP responses, not heuristics. */
  function classifyAnthropic(v) {
    if (v.includes('network'))   return { ok: false, kind: 'network',        message: "Couldn't reach Anthropic — check your network or status.anthropic.com." };
    if (v.includes('ratelimit')) return { ok: false, kind: 'rate_limited',   message: 'Rate limit hit on your account — wait a minute, then retry.' };
    if (v.includes('expired') || v.includes('revoked'))
                                  return { ok: false, kind: 'auth_failed',    message: 'Key rejected (401). It may have been revoked or expired — generate a new one.' };
    if (!v.startsWith('sk-ant-')) return { ok: false, kind: 'invalid_format', message: 'Anthropic keys begin with sk-ant- — check what you pasted.' };
    if (v.length < 20)            return { ok: false, kind: 'invalid_format', message: 'Key looks too short — make sure you copied the whole thing.' };
    return { ok: true, message: `Anthropic API reachable \u00b7 ${AGP_MOCK.config.modelName} ready.` };
  }
  function classifyGitHub(v) {
    if (v.includes('network'))   return { ok: false, kind: 'network',        message: "Couldn't reach GitHub — check status.github.com." };
    if (v.includes('ratelimit')) return { ok: false, kind: 'rate_limited',   message: 'GitHub secondary rate limit. Wait a few minutes before retrying.' };
    if (v.includes('expired'))   return { ok: false, kind: 'auth_failed',    message: 'Token rejected (401). It may have expired or had its scopes revoked.' };
    if (!v.startsWith('ghp_') && !v.startsWith('github_pat_'))
                                  return { ok: false, kind: 'invalid_format', message: 'Token should start with ghp_ or github_pat_.' };
    if (v.length < 20)            return { ok: false, kind: 'invalid_format', message: 'Token looks too short.' };
    return { ok: true, message: 'agp-co · 14 repos reachable.' };
  }

  const validators = {
    anthropic: classifyAnthropic,
    githubPat: classifyGitHub,
  };

  /* ───────────────────────── Error / empty cards ───────────────────────── */

  function ErrorCard({ title = "We couldn't load this", message = 'The connection to Azure DevOps timed out. Try again in a moment.', onRetry, compact }) {
    return (
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: '3px solid var(--agp-red)',
        borderRadius: 'var(--r-md)',
        padding: compact ? '12px 16px' : '20px 24px',
        display: 'flex', gap: 14, alignItems: 'flex-start',
      }}>
        <span style={{
          width: 32, height: 32, borderRadius: 'var(--r-sm)',
          background: 'rgba(248,58,64,0.12)', color: 'var(--agp-red)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon name="x" size={16} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>{message}</div>
          {onRetry && (
            <Btn variant="secondary" size="sm" icon="lightning" onClick={onRetry} style={{ marginTop: 10 }}>
              Try again
            </Btn>
          )}
        </div>
      </div>
    );
  }

  function EmptyState({ icon = 'check', title = "You're all caught up", message = 'Nothing to show here right now.', action }) {
    return (
      <div style={{
        padding: '40px 24px',
        textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      }}>
        <span style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--primary-soft)', color: 'var(--primary)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={icon} size={26} />
        </span>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', maxWidth: 320, lineHeight: 1.5 }}>{message}</div>
        {action}
      </div>
    );
  }

  function CredErrorBanner({ service, onUpdate }) {
    return (
      <div style={{
        background: 'rgba(248,58,64,0.07)',
        border: '1px solid rgba(248,58,64,0.32)',
        borderRadius: 'var(--r-md)',
        padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: 12,
        marginBottom: 16,
      }}>
        <span style={{ width: 26, height: 26, borderRadius: 'var(--r-sm)', background: 'rgba(248,58,64,0.16)', color: 'var(--agp-red)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="lock" size={13} />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>
            Your {service} credential expired or was rejected.
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
            Update it in <a href="#" onClick={(e) => { e.preventDefault(); onUpdate && onUpdate(); }} style={{ color: 'var(--link)', textDecoration: 'underline' }}>Profile Settings</a> to keep this panel working.
          </div>
        </div>
        <Btn variant="secondary" size="sm" onClick={onUpdate}>Update key</Btn>
      </div>
    );
  }

  /* ────────────────────────── Scope warning banner ────────────────────────── */

  function ScopeWarning({ compact, onContact }) {
    return (
      <div style={{
        background: 'rgba(235,182,59,0.10)',
        border: '1px solid rgba(235,182,59,0.42)',
        borderRadius: 'var(--r-md)',
        padding: compact ? '10px 14px' : '14px 18px',
        display: 'flex', gap: 12, alignItems: compact ? 'center' : 'flex-start',
      }}>
        <span style={{ width: 26, height: 26, borderRadius: 'var(--r-sm)', background: 'rgba(235,182,59,0.32)', color: '#7a5a05', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="lightning" size={13} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#7a5a05' }}>
            Posting to channels requires IT admin approval.
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.45 }}>
            You can still read mentions and channel messages. Have IT grant <code style={{ fontFamily: 'var(--font-mono)' }}>ChannelMessage.Send</code> to enable posting.
          </div>
        </div>
        {!compact && <Btn variant="ghost" size="sm" onClick={onContact}>Contact IT</Btn>}
      </div>
    );
  }

  /* ─────────────────────────── Teams channel picker ─────────────────────────── */

  function TeamsPicker({ value, onChange, max = 3 }) {
    const [open, setOpen]   = useState(false);
    const [query, setQuery] = useState('');
    const M = AGP_MOCK;

    const flat = useMemo(() => {
      const out = [];
      M.teamsPool.forEach((t) => {
        t.channels.forEach((c) => {
          out.push({
            teamId: t.teamId,    teamName: t.teamName,
            channelId: c.channelId, channelName: c.name,
            members: c.members, lastActivity: c.lastActivity,
          });
        });
      });
      return out;
    }, []);

    const filtered = useMemo(() => {
      const q = query.trim().toLowerCase();
      if (!q) return flat;
      return flat.filter((c) =>
        c.teamName.toLowerCase().includes(q) ||
        c.channelName.toLowerCase().includes(q)
      );
    }, [query, flat]);

    const grouped = useMemo(() => {
      const g = {};
      filtered.forEach((c) => { (g[c.teamName] ||= []).push(c); });
      return g;
    }, [filtered]);

    function toggle(c) {
      if (value.some((v) => v.channelId === c.channelId)) {
        onChange(value.filter((v) => v.channelId !== c.channelId));
      } else {
        if (value.length >= max) return;
        onChange([...value, c]);
      }
    }

    return (
      <div>
        {/* Selected chips */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6,
          padding: '10px 10px',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          minHeight: 50,
          alignItems: 'center',
        }}>
          {value.length === 0 && (
            <span style={{ color: 'var(--text-tertiary)', fontSize: 12.5, fontStyle: 'italic' }}>
              No channels selected yet.
            </span>
          )}
          {value.map((c) => (
            <span key={c.channelId} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 10px',
              background: 'var(--primary-soft)',
              color: 'var(--primary)',
              borderRadius: 999,
              fontSize: 12, fontWeight: 600,
              fontFamily: 'var(--font-mono)',
            }}>
              <Icon name="teams" size={11} />
              {c.teamName} <span style={{ color: 'var(--text-tertiary)' }}>/ #{c.channelName}</span>
              <button onClick={() => toggle(c)} style={{ color: 'var(--primary)', padding: 0, display: 'inline-flex' }}>
                <Icon name="x" size={11} />
              </button>
            </span>
          ))}
        </div>

        {/* Picker control */}
        <div style={{ position: 'relative', marginTop: 8 }}>
          <button
            onClick={() => setOpen(!open)}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'var(--surface)',
              border: `1px solid ${open ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 'var(--r-md)',
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 13, color: 'var(--text-secondary)',
              cursor: 'pointer',
              boxShadow: open ? '0 0 0 3px var(--primary-soft)' : 'none',
              transition: 'all 160ms var(--ease-out)',
            }}
          >
            <Icon name="search" size={13} />
            <span style={{ flex: 1, textAlign: 'left' }}>
              {value.length === 0 ? 'Browse your Teams channels…' : `Add another channel · ${max - value.length} slot${max - value.length === 1 ? '' : 's'} left`}
            </span>
            <Icon name="chevron-down" size={12} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 160ms' }} />
          </button>
          {open && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              boxShadow: 'var(--shadow-pop)',
              zIndex: 20,
              maxHeight: 360,
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search teams and channels…"
                  style={{
                    width: '100%', background: 'transparent', border: 'none', outline: 'none',
                    fontSize: 13, color: 'var(--text-primary)',
                  }}
                />
              </div>
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                {Object.keys(grouped).length === 0 && (
                  <div style={{ padding: 20, textAlign: 'center', fontSize: 12.5, color: 'var(--text-tertiary)' }}>
                    No teams or channels match “{query}”.
                  </div>
                )}
                {Object.entries(grouped).map(([teamName, channels]) => (
                  <div key={teamName}>
                    <div style={{
                      padding: '8px 12px 4px',
                      fontSize: 10.5, fontFamily: 'var(--font-mono)',
                      textTransform: 'uppercase', letterSpacing: '.14em',
                      color: 'var(--text-tertiary)',
                      background: 'var(--surface-2)',
                    }}>
                      {teamName}
                    </div>
                    {channels.map((c) => {
                      const selected = value.some((v) => v.channelId === c.channelId);
                      const disabled = !selected && value.length >= max;
                      return (
                        <button
                          key={c.channelId}
                          onClick={() => toggle(c)}
                          disabled={disabled}
                          style={{
                            width: '100%', textAlign: 'left',
                            padding: '8px 12px',
                            display: 'flex', alignItems: 'center', gap: 10,
                            background: selected ? 'var(--primary-soft)' : 'transparent',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            opacity: disabled ? 0.5 : 1,
                          }}
                          onMouseEnter={(e) => { if (!disabled && !selected) e.currentTarget.style.background = 'var(--surface-hover)'; }}
                          onMouseLeave={(e) => { if (!disabled && !selected) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <span style={{
                            width: 18, height: 18, borderRadius: 4,
                            border: selected ? '1px solid var(--primary)' : '1px solid var(--border)',
                            background: selected ? 'var(--primary)' : 'transparent',
                            color: '#fff',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          }}>{selected && <Icon name="check" size={11} />}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-primary)', fontWeight: selected ? 600 : 500 }}>
                            #{c.channelName}
                          </span>
                          <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                            {c.members} · {c.lastActivity}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ─────────────────────────── Notifications bell ─────────────────────────── */

  function NotificationsBell({ open, onClose, onClick, items, onMarkAll, anchorTop = 56 }) {
    const unread = items.filter((i) => i.unread).length;
    return (
      <>
        <button
          onClick={onClick}
          style={{
            width: 34, height: 34, borderRadius: 'var(--r-sm)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: open ? 'var(--surface-hover)' : 'transparent',
            color: 'var(--text-secondary)',
            position: 'relative',
          }}
          onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = 'var(--surface-hover)'; }}
          onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = 'transparent'; }}
          aria-label="Notifications"
        >
          <Icon name="bell" size={15} />
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: 5, right: 5,
              minWidth: 14, height: 14, padding: '0 4px',
              background: 'var(--accent)', color: '#1a1306',
              borderRadius: 7, fontSize: 9.5, fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
              border: '1px solid var(--surface)',
            }}>{unread}</span>
          )}
        </button>
        {open && (
          <div style={{
            position: 'absolute', top: anchorTop, right: 12,
            width: 380, maxHeight: 480,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            boxShadow: 'var(--shadow-pop)',
            zIndex: 30,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            animation: 'agpFadeIn 160ms var(--ease-out)',
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Notifications</span>
              {unread > 0 && <Pill tone="amber" size="sm">{unread} new</Pill>}
              <button onClick={onMarkAll} style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--link)', padding: 4 }}>
                Mark all as read
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              {items.length === 0 ? (
                <EmptyState icon="check" title="You're all caught up" message="No new notifications. Enjoy the quiet." />
              ) : (
                ['mention', 'pr', 'workitem', 'meeting'].map((kind) => {
                  const group = items.filter((n) => n.kind === kind);
                  if (group.length === 0) return null;
                  const titles = { mention: 'Mentions', pr: 'Pull requests', workitem: 'Work items', meeting: 'Meetings' };
                  const icons  = { mention: 'teams', pr: 'pr', workitem: 'work', meeting: 'calendar' };
                  return (
                    <div key={kind}>
                      <div style={{
                        padding: '8px 16px',
                        fontSize: 10.5, fontFamily: 'var(--font-mono)',
                        textTransform: 'uppercase', letterSpacing: '.14em',
                        color: 'var(--text-tertiary)',
                        background: 'var(--surface-2)',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        <Icon name={icons[kind]} size={11} /> {titles[kind]}
                      </div>
                      {group.map((n) => (
                        <button
                          key={n.id}
                          onClick={onClose}
                          style={{
                            width: '100%', textAlign: 'left',
                            padding: '10px 16px',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex', gap: 10, alignItems: 'flex-start',
                            background: n.unread ? 'rgba(235,182,59,0.04)' : 'transparent',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = n.unread ? 'rgba(235,182,59,0.04)' : 'transparent'}
                        >
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: n.unread ? 'var(--accent)' : 'transparent',
                            marginTop: 6, flexShrink: 0,
                          }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, color: 'var(--text-primary)', lineHeight: 1.45 }}>
                              <strong style={{ fontWeight: 600 }}>{n.from}</strong> {n.summary}
                            </div>
                            <div style={{ marginTop: 3, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', display: 'flex', gap: 8 }}>
                              <span>{n.source}</span>
                              <span style={{ marginLeft: 'auto' }}>{n.time}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
            <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', textAlign: 'center', fontSize: 11.5, color: 'var(--text-tertiary)' }}>
              <Icon name="lightning" size={11} style={{ marginRight: 6, verticalAlign: '-1px' }} />
              Synced from Outlook, Teams, Azure DevOps, GitHub
            </div>
          </div>
        )}
      </>
    );
  }

  /* ─────────────────────────── Command Palette (⌘K) ─────────────────────────── */

  function CommandPalette({ open, onClose }) {
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(0);
    const inputRef = useRef(null);
    const M = AGP_MOCK;

    useEffect(() => { if (open) { setQuery(''); setActive(0); setTimeout(() => inputRef.current?.focus(), 30); } }, [open]);

    const results = useMemo(() => {
      const q = query.trim().toLowerCase();
      const groups = [
        { kind: 'work',     label: 'Work items',     icon: 'work',     items: M.commandResults.work },
        { kind: 'pr',       label: 'Pull requests',  icon: 'pr',       items: M.commandResults.pr },
        { kind: 'code',     label: 'Code',           icon: 'code',     items: M.commandResults.code },
        { kind: 'mail',     label: 'Mail',           icon: 'mail',     items: M.commandResults.mail },
        { kind: 'teams',    label: 'Teams',          icon: 'teams',    items: M.commandResults.teams },
        { kind: 'calendar', label: 'Calendar',       icon: 'calendar', items: M.commandResults.calendar },
      ];
      if (!q) return groups;
      return groups
        .map((g) => ({ ...g, items: g.items.filter((i) => (i.title + ' ' + i.sub).toLowerCase().includes(q)) }))
        .filter((g) => g.items.length > 0);
    }, [query]);

    /* Flat list with section boundaries for keyboard nav */
    const flat = results.flatMap((g) => g.items.map((it) => ({ ...it, group: g.label, kind: g.kind, groupIcon: g.icon })));

    useEffect(() => {
      function onKey(e) {
        if (!open) return;
        if (e.key === 'Escape') { e.preventDefault(); onClose(); }
        if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(flat.length - 1, a + 1)); }
        if (e.key === 'ArrowUp')   { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
        if (e.key === 'Enter')     { e.preventDefault(); onClose(); }
      }
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [open, flat.length, onClose]);

    if (!open) return null;
    return (
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(3,14,26,0.55)',
        zIndex: 50,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: 80,
        animation: 'agpFadeIn 180ms var(--ease-out)',
      }}>
        <div onClick={(e) => e.stopPropagation()} style={{
          width: '100%', maxWidth: 640,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          maxHeight: '70vh',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Icon name="search" size={17} style={{ color: 'var(--text-tertiary)' }} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActive(0); }}
              placeholder="Search work items, PRs, code, mail, teams…"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontSize: 15, color: 'var(--text-primary)',
              }}
            />
            <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', padding: '2px 7px', border: '1px solid var(--border)', borderRadius: 4 }}>ESC</span>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '6px 0' }}>
            {flat.length === 0 && (
              <EmptyState icon="search" title="No matches" message={`Nothing in your workspace matches “${query}”. Try a wider search term.`} />
            )}
            {results.map((g) => (
              <div key={g.kind}>
                <div style={{
                  padding: '10px 20px 4px',
                  fontSize: 10.5, fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase', letterSpacing: '.14em',
                  color: 'var(--text-tertiary)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Icon name={g.icon} size={11} /> {g.label}
                </div>
                {g.items.map((it, j) => {
                  const flatIdx = flat.findIndex((f) => f.title === it.title);
                  const isActive = flatIdx === active;
                  return (
                    <button
                      key={it.title}
                      onClick={onClose}
                      onMouseEnter={() => setActive(flatIdx)}
                      style={{
                        width: '100%', textAlign: 'left',
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '8px 20px',
                        background: isActive ? 'var(--primary-soft)' : 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <Icon name={g.icon} size={13} style={{ color: 'var(--text-tertiary)' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {it.title}
                        </div>
                        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{it.sub}</div>
                      </div>
                      {isActive && <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>↵</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', gap: 18, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
            <span>↑↓ Navigate</span>
            <span>↵ Open</span>
            <span>ESC Close</span>
            <span style={{ marginLeft: 'auto' }}>⌘K to reopen</span>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────── Shortcuts overlay (⌘/) ─────────────────────────── */

  function ShortcutsOverlay({ open, onClose }) {
    useEffect(() => {
      if (!open) return;
      function h(e) { if (e.key === 'Escape') onClose(); }
      window.addEventListener('keydown', h);
      return () => window.removeEventListener('keydown', h);
    }, [open, onClose]);
    if (!open) return null;

    const groups = [
      { title: 'Global', items: [
        ['⌘K',  'Open search'],
        ['⌘J',  'Toggle AI chat drawer'],
        ['⌘N',  'New work item'],
        ['⌘/',  'Show shortcuts'],
        ['ESC', 'Close modal or palette'],
      ]},
      { title: 'Navigation', items: [
        ['1',   'Work items'],
        ['2',   'Repos & PRs'],
        ['3',   'Email'],
        ['4',   'Calendar'],
        ['5',   'Teams'],
      ]},
      { title: 'Chat', items: [
        ['↵',     'Send message'],
        ['⇧ ↵',   'New line'],
        ['⌘ ↑',   'Edit last message'],
        ['⌘ K',   'New conversation (in chat)'],
      ]},
    ];

    return (
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(3,14,26,0.55)',
        zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        animation: 'agpFadeIn 180ms var(--ease-out)',
      }}>
        <div onClick={(e) => e.stopPropagation()} style={{
          width: '100%', maxWidth: 640,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', background: 'var(--primary-soft)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="lightning" size={15} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Keyboard shortcuts</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>Same shortcuts work across all three layouts.</div>
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', color: 'var(--text-tertiary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="x" size={16} />
            </button>
          </div>
          <div style={{ padding: 22, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
            {groups.map((g) => (
              <div key={g.title}>
                <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.16em', color: 'var(--text-tertiary)', marginBottom: 10, fontWeight: 600 }}>
                  {g.title}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {g.items.map(([k, label]) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 600,
                        padding: '2px 8px',
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        borderBottom: '2px solid var(--border-strong)',
                        borderRadius: 4,
                        color: 'var(--text-primary)',
                        minWidth: 48, textAlign: 'center',
                      }}>{k}</span>
                      <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="secondary" size="sm">Customize…</Btn>
            <Btn variant="primary" size="sm" onClick={onClose}>Got it</Btn>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────── Shared label style ─────────────────────────── */
  const labelStyle = { fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 6 };

  /* Shared modal overlay shell — reused by all three new modals. */
  function ModalShell({ onClose, title, sub, icon = 'sparkle', width = 680, children, footer }) {
    useEffect(() => {
      function h(e) { if (e.key === 'Escape') onClose(); }
      window.addEventListener('keydown', h);
      return () => window.removeEventListener('keydown', h);
    }, [onClose]);
    return (
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(3,14,26,0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 80, zIndex: 40, animation: 'agpFadeIn 200ms var(--ease-out)' }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: width, maxHeight: '85vh', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Icon name={icon} size={16} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
              {sub && <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>{sub}</div>}
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', color: 'rgba(255,255,255,.9)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={16} /></button>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 22 }}>{children}</div>
          {footer && <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end', background: 'var(--surface-2)' }}>{footer}</div>}
        </div>
      </div>
    );
  }

  /* Loading skeleton strip — reused by all three modals. */
  function AiSkeleton() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16, animation: 'agpPulse 1.4s ease-in-out infinite' }}>
        <div style={{ height: 18, width: '60%', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }} />
        <div style={{ height: 80, background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }} />
        <div style={{ height: 14, width: '40%', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }} />
      </div>
    );
  }

  /* ─────────────────────────── New PR modal ─────────────────────────── */

  function NewPrModal({ onClose }) {
    const M = AGP_MOCK;
    const [repoId, setRepoId]   = useState(M.repos[0].id);
    const [source, setSource]   = useState((M.branches[M.repos[0].id] ?? [])[0] ?? '');
    const [title, setTitle]     = useState('');
    const [body, setBody]       = useState('');
    const [phase, setPhase]     = useState('idle');

    const selectedRepo  = M.repos.find((r) => r.id === repoId);
    const repoBranches  = M.branches[repoId] ?? [];

    const DRAFTS = {
      'feature/tool-use-loop':    { title: 'feat(chat): agentic tool-use loop for codebase Q&A',          body: '## Summary\n\n- Server-side tool loop in `AnthropicChatService`\n- Claude calls `search_code`, `get_file`, `list_directory`\n- Tool results streamed as `event: tool_call` SSE events\n\n## Test plan\n\n- [ ] Ask "where is JwtTokenService?" — verify tool calls fire\n- [ ] Verify 500-line truncation note\n- [ ] Verify error state when tool fails' },
      'feat/msal-boot':           { title: 'feat(auth): MSAL boot + Graph token cache',                    body: '## Summary\n\n- Adds `@azure/msal-browser` to the client\n- Microsoft sign-in popup flow\n- Caches Graph and DevOps tokens in sessionStorage\n\n## Test plan\n\n- [ ] Sign in → verify ID token exchanged for app JWT\n- [ ] Verify Graph token on `/api/graph/*` calls\n- [ ] Verify DevOps token on `/api/devops/*` calls' },
      'fix/dirty-state-cascade':  { title: 'fix(load-orders): preserve dirty state on partial cascade',    body: '## Summary\n\n- Guards `markAsPristineSafe` behind `if (changedVehicles.length > 0)`\n- Moves call after cascade completes\n- Adds regression test for multi-vehicle dirty state\n\n## Test plan\n\n- [ ] Seed two vehicles, mark A dirty, cascade B — assert A still dirty\n- [ ] Empty changed-vehicles → cascade is no-op\n- [ ] Run existing load-orders e2e suite' },
      'chore/db-migration':       { title: 'chore(api): EF Core migration for ApplicationUser fields',     body: '## Summary\n\n- Adds migration for `AnthropicApiKeyEncrypted`, `GitHubPatEncrypted`, `TeamsChannelsJson`, `BotPersonaMarkdownOverride`\n- All new columns are nullable — safe on existing data\n\n## Test plan\n\n- [ ] `dotnet ef database update` on clean DB\n- [ ] `dotnet ef database update` on DB with existing rows\n- [ ] Run integration test suite' },
    };

    function generate(err = false) {
      setPhase('loading'); setTitle(''); setBody('');
      setTimeout(() => {
        if (err) { setPhase('error'); return; }
        const d = DRAFTS[source] ?? { title: `feat(${source.split('/').pop().replace(/-/g, ' ')}): describe your changes`, body: '## Summary\n\n_Edit this description before opening the PR._\n\n## Test plan\n\n- [ ] Add tests\n- [ ] Smoke test on dev' };
        setTitle(d.title); setBody(d.body); setPhase('done');
      }, 1100);
    }

    return (
      <ModalShell onClose={onClose} title="Open a pull request" sub="AI can draft the title and description from your branch name" icon="pr" width={700}
        footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn variant="primary" icon="pr" disabled={!title || !source}>Open pull request</Btn></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Repo + branch row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[
              { label: 'Repository', content: (
                <select value={repoId} onChange={(e) => { setRepoId(e.target.value); setSource((M.branches[e.target.value] ?? [])[0] ?? ''); setPhase('idle'); setTitle(''); setBody(''); }}
                  style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '9px 12px', fontSize: 12.5, color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-mono)' }}>
                  {M.repos.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              )},
              { label: 'Source branch', content: (
                <select value={source} onChange={(e) => { setSource(e.target.value); setPhase('idle'); setTitle(''); setBody(''); }}
                  style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '9px 12px', fontSize: 12.5, color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-mono)' }}>
                  {repoBranches.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              )},
              { label: 'Into', content: (
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '9px 12px', fontSize: 12.5, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                  {selectedRepo?.defaultBranch ?? 'main'}
                </div>
              )},
            ].map(({ label, content }) => (
              <div key={label}>
                <div style={labelStyle}>{label}</div>
                {content}
              </div>
            ))}
          </div>

          {/* Draft button */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Btn icon="sparkle" onClick={() => generate(false)} disabled={phase === 'loading' || !source}>
              {phase === 'loading' ? 'Drafting…' : phase === 'done' ? 'Re-draft' : 'Draft with AI'}
            </Btn>
            {phase === 'done' && <span style={{ fontSize: 12, color: 'var(--agp-green-status)', display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="check" size={12} />Draft ready — edit before submitting</span>}
            <Btn variant="ghost" size="sm" onClick={() => generate(true)} disabled={phase === 'loading'} style={{ marginLeft: 'auto', opacity: 0.35 }}>Simulate error</Btn>
          </div>

          {phase === 'loading' && <AiSkeleton />}
          {phase === 'error' && <div style={{ marginTop: 4 }}><ErrorCard title="Couldn't generate draft" message="The Anthropic API returned an error. Check your key in Profile Settings or try again." onRetry={() => generate(false)} /></div>}

          {(phase === 'done') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'agpFadeIn 240ms var(--ease-out)' }}>
              <div>
                <div style={labelStyle}>Title</div>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Pull request title"
                  style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '10px 12px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-mono)' }} />
              </div>
              <div>
                <div style={labelStyle}>Description (Markdown)</div>
                <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={9}
                  style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 12, fontSize: 12.5, lineHeight: 1.65, resize: 'vertical', outline: 'none', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }} />
              </div>
            </div>
          )}
        </div>
      </ModalShell>
    );
  }

  /* ─────────────────────────── New Event modal ─────────────────────────── */

  function NewEventModal({ onClose }) {
    const today = new Date();
    const pad   = (n) => String(n).padStart(2, '0');
    const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const h = today.getHours();

    const [aiPrompt,   setAiPrompt]   = useState('');
    const [title,      setTitle]      = useState('');
    const [date,       setDate]       = useState(fmtDate(today));
    const [startTime,  setStart]      = useState(`${pad(h + 1)}:00`);
    const [endTime,    setEnd]        = useState(`${pad(h + 2)}:00`);
    const [attendees,  setAttendees]  = useState('');
    const [description,setDesc]       = useState('');
    const [teamsCall,  setTeams]      = useState(true);
    const [phase,      setPhase]      = useState('idle');

    function generate(err = false) {
      setPhase('loading');
      setTimeout(() => {
        if (err) { setPhase('error'); return; }
        setTitle('Command Station demo walk-through');
        setAttendees('maya.park@agp.com, aamir.khan@agp.com, brianna.reyes@agp.com, brandon.walls@agp.com');
        setDesc('Walk through the AGP Command Station v2 features with the ELO Platform team.\n\nAgenda:\n1. Microsoft sign-in + onboarding (5 min)\n2. AI chat with tool use — live codebase Q&A (10 min)\n3. Work Item Builder — all roles (5 min)\n4. Repos & PRs panel — ADO + GitHub (5 min)\n5. Notification bell + ⌘K search (5 min)\n6. Q&A (15 min)');
        setStart('10:00'); setEnd('10:45');
        setPhase('done');
      }, 1100);
    }

    const inputStyle = { width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '9px 12px', fontSize: 13.5, color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit' };

    return (
      <ModalShell onClose={onClose} title="New calendar event" sub="AI can draft the details from a plain-language description" icon="calendar" width={640}
        footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn variant="primary" icon="calendar" disabled={!title}>Create event</Btn></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* AI prompt */}
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 14 }}>
            <div style={labelStyle}>Describe the meeting (optional)</div>
            <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} rows={2} placeholder="e.g. 45-min demo of Command Station with the ELO team Friday morning"
              style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 13.5, lineHeight: 1.5, resize: 'none', fontFamily: 'inherit', color: 'var(--text-primary)' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
              <Btn icon="sparkle" onClick={() => generate(false)} disabled={phase === 'loading'}>
                {phase === 'loading' ? 'Drafting…' : phase === 'done' ? 'Re-draft' : 'Draft with AI'}
              </Btn>
              {phase === 'done' && <span style={{ fontSize: 12, color: 'var(--agp-green-status)', display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="check" size={12} />Fields filled — edit below</span>}
              <Btn variant="ghost" size="sm" onClick={() => generate(true)} disabled={phase === 'loading'} style={{ marginLeft: 'auto', opacity: 0.35 }}>Simulate error</Btn>
            </div>
          </div>

          {phase === 'loading' && <AiSkeleton />}
          {phase === 'error'   && <ErrorCard title="Couldn't draft event" message="The Anthropic API returned an error. Try again or fill in the details manually." onRetry={() => generate(false)} />}

          {/* Event fields — always shown; pre-filled after AI draft */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: phase === 'done' ? 'agpFadeIn 240ms var(--ease-out)' : 'none' }}>
            <div>
              <div style={labelStyle}>Title</div>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                { label: 'Date',       value: date,      onChange: setDate,  type: 'date' },
                { label: 'Start time', value: startTime, onChange: setStart, type: 'time' },
                { label: 'End time',   value: endTime,   onChange: setEnd,   type: 'time' },
              ].map(({ label, value, onChange, type }) => (
                <div key={label}>
                  <div style={labelStyle}>{label}</div>
                  <input type={type} value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: 13 }} />
                </div>
              ))}
            </div>
            <div>
              <div style={labelStyle}>Attendees (comma-separated emails)</div>
              <input value={attendees} onChange={(e) => setAttendees(e.target.value)} placeholder="maya.park@agp.com, aamir.khan@agp.com" style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: 12.5 }} />
            </div>
            <div>
              <div style={labelStyle}>Description</div>
              <textarea value={description} onChange={(e) => setDesc(e.target.value)} rows={5} placeholder="Agenda, meeting notes, context…"
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13.5 }}>
              <input type="checkbox" checked={teamsCall} onChange={(e) => setTeams(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
              <Icon name="teams" size={14} style={{ color: 'var(--primary)' }} />
              Add a Teams meeting link
            </label>
          </div>
        </div>
      </ModalShell>
    );
  }

  /* ─────────────────────────── Send to channel modal ─────────────────────────── */

  function SendToChannelModal({ onClose, channels, postingEnabled }) {
    const [channelId, setChannel] = useState(channels[0]?.id ?? '');
    const [message,   setMessage] = useState('');
    const [phase,     setPhase]   = useState('idle');

    const selected = channels.find((c) => c.id === channelId);

    function polish(err = false) {
      setPhase('loading');
      setTimeout(() => {
        if (err) { setPhase('error'); return; }
        setMessage('Hey team — heads-up that the Command Station demo is on Friday at 10 AM. I\'ll walk through the full feature set including AI chat with tool use, Work Item Builder, Repos & PRs, and the notification bell. Drop any questions in the thread before then and I\'ll make sure to cover them.');
        setPhase('done');
      }, 900);
    }

    return (
      <ModalShell onClose={onClose} title="Post to a Teams channel" sub={postingEnabled ? 'AI can polish your message before sending' : 'Posting requires IT admin approval for ChannelMessage.Send'} icon="teams" width={560}
        footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn variant="primary" icon="send" disabled={!postingEnabled || !message || !channelId}>Post to channel</Btn></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!postingEnabled && <ScopeWarning />}

          {/* Channel picker */}
          <div>
            <div style={labelStyle}>Channel</div>
            <select value={channelId} onChange={(e) => setChannel(e.target.value)} disabled={!postingEnabled}
              style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '9px 12px', fontSize: 13, color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-mono)', opacity: postingEnabled ? 1 : 0.5 }}>
              {channels.map((c) => <option key={c.id} value={c.id}>{c.team} · #{c.name}</option>)}
            </select>
          </div>

          {/* Message */}
          <div>
            <div style={labelStyle}>Message</div>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} disabled={!postingEnabled}
              placeholder={postingEnabled ? 'Write your message…' : 'Posting is disabled — contact IT to enable ChannelMessage.Send'}
              style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 12, fontSize: 13.5, lineHeight: 1.6, resize: 'vertical', outline: 'none', fontFamily: 'inherit', color: 'var(--text-primary)', opacity: postingEnabled ? 1 : 0.5 }} />
          </div>

          {/* Polish with AI */}
          {postingEnabled && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Btn variant="secondary" icon="sparkle" onClick={() => polish(false)} disabled={phase === 'loading'}>
                {phase === 'loading' ? 'Polishing…' : phase === 'done' ? 'Re-polish' : 'Polish with AI'}
              </Btn>
              {phase === 'done' && <span style={{ fontSize: 12, color: 'var(--agp-green-status)', display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="check" size={12} />Message polished — edit if needed</span>}
              <Btn variant="ghost" size="sm" onClick={() => polish(true)} disabled={phase === 'loading'} style={{ marginLeft: 'auto', opacity: 0.35 }}>Simulate error</Btn>
            </div>
          )}

          {phase === 'loading' && <AiSkeleton />}
          {phase === 'error'   && <ErrorCard title="Couldn't polish message" message="The Anthropic API returned an error. You can still post your message as-is." onRetry={() => polish(false)} />}

          {/* Preview */}
          {selected && message && (
            <div style={{ padding: '12px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              <Icon name="teams" size={11} style={{ marginRight: 6, verticalAlign: '-1px' }} />
              Posting as <strong style={{ color: 'var(--text-primary)' }}>Dillon Coleman</strong> to <strong style={{ color: 'var(--text-primary)' }}>{selected.team} · #{selected.name}</strong>
            </div>
          )}
        </div>
      </ModalShell>
    );
  }

  /* helper: human label for role */
  const ROLE_LABELS = { ProductOwner: 'Product Owner', SoftwareEngineer: 'Engineer', QA: 'QA' };
  function RolePill({ role, onClick, compact }) {
    return (
      <button
        onClick={onClick}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: compact ? '3px 8px' : '4px 10px 4px 7px',
          background: 'var(--accent-soft)',
          color: '#7a5a05',
          borderRadius: 999,
          fontSize: 11, fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase', letterSpacing: '.08em',
          border: '1px solid rgba(235,182,59,.32)',
        }}
        title="Your active role — changes the assistant's system prompt"
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
        {ROLE_LABELS[role] || role}
      </button>
    );
  }

  return {
    ConnField, validators,
    ErrorCard, EmptyState, CredErrorBanner,
    ScopeWarning, TeamsPicker,
    NotificationsBell, CommandPalette, ShortcutsOverlay,
    RolePill, ROLE_LABELS,
    NewPrModal, NewEventModal, SendToChannelModal,
  };
})();

window.OPTBX = OPTBX;
