import { useCallback, useMemo, useState } from 'react';
import { ChatInput } from '../chat/ChatInput';
import { MessageList } from '../chat/MessageList';
import { PinnedFilesBar } from '../chat/PinnedFilesBar';
import { WorkItemList } from '../workitems/WorkItemList';
import { MailPanel } from '../outlook/MailPanel';
import { CalendarPanel } from '../calendar/CalendarPanel';
import { TeamsPanel } from '../teams/TeamsPanel';
import { RepoPanel } from '../repos/RepoPanel';
import { CommandPalette } from '../search/CommandPalette';
import { NotificationBell } from '../notifications/NotificationBell';
import { KeyboardShortcutsModal } from '../shortcuts/KeyboardShortcutsModal';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import '../../styles/command.css';
import '../../styles/chat.css';

type Tab = 'workitems' | 'repos' | 'email' | 'calendar' | 'teams';

const TABS: { id: Tab; label: string; key: string }[] = [
  { id: 'workitems', label: 'Work Items',  key: '1' },
  { id: 'repos',     label: 'Repos & PRs', key: '2' },
  { id: 'email',     label: 'Email',       key: '3' },
  { id: 'calendar',  label: 'Calendar',    key: '4' },
  { id: 'teams',     label: 'Teams',       key: '5' },
];

function roleAbbr(role: string) {
  if (role === 'ProductOwner')     return 'PO';
  if (role === 'SoftwareEngineer') return 'SE';
  if (role === 'QA')               return 'QA';
  return role.slice(0, 2).toUpperCase();
}

interface Props {
  onOpenProfile: () => void;
}

export function CommandStation({ onOpenProfile }: Props) {
  const { profile, signOut } = useAuth();
  const { activeConversation, streaming, sendMessage, pinnedFiles, unpinFile } = useChat();

  const [activeTab, setActiveTab]       = useState<Tab>('workitems');
  const [menuOpen, setMenuOpen]         = useState(false);
  const [paletteOpen, setPaletteOpen]   = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [chatHidden, setChatHidden]     = useState(false);
  const [newWorkItemTrigger, setNewWorkItemTrigger] = useState(0);

  const firstName = (profile?.displayName ?? '').split(' ')[0];
  const messages  = activeConversation?.messages ?? [];

  const kbHandlers = useMemo(() => ({
    onOpenSearch:    () => setPaletteOpen(true),
    onToggleChat:    () => setChatHidden(h => !h),
    onNewWorkItem:   () => { setActiveTab('workitems'); setNewWorkItemTrigger(n => n + 1); },
    onShowShortcuts: () => setShortcutsOpen(true),
    onSwitchTab:     (tab: Tab) => setActiveTab(tab),
    onEscape:        () => {
      if (paletteOpen)  { setPaletteOpen(false);   return; }
      if (shortcutsOpen){ setShortcutsOpen(false);  return; }
      if (menuOpen)     { setMenuOpen(false);       return; }
    },
  }), [paletteOpen, shortcutsOpen, menuOpen]);

  useKeyboardShortcuts(kbHandlers);

  const handleNavigate = useCallback((tab: Tab) => {
    setActiveTab(tab);
    setPaletteOpen(false);
  }, []);

  return (
    <div className="cs-root theme-light">
      {/* Nav */}
      <nav className="cs-nav">
        <div className="cs-nav-logo">
          <div className="cs-nav-logo-mark">
            <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
              <path d="M14 4L24 10V18L14 24L4 18V10L14 4Z" fill="white" opacity="0.9"/>
            </svg>
          </div>
          AGP Command Station
        </div>

        <div className="cs-nav-search">
          <input
            placeholder="⌘K Search…"
            readOnly
            onClick={() => setPaletteOpen(true)}
            style={{ cursor: 'pointer' }}
          />
        </div>

        <div className="cs-nav-right">
          <NotificationBell onNavigate={(tab) => setActiveTab(tab as Tab)} />

          {profile && (
            <div className="cs-nav-role-pill">
              {roleAbbr(profile.role)} · {firstName}
            </div>
          )}

          <div className="cs-nav-user-menu">
            <button type="button" className="cs-nav-user-btn" onClick={() => setMenuOpen(o => !o)}>
              {profile?.displayName ?? 'User'} ▾
            </button>
            {menuOpen && (
              <div className="cs-nav-dropdown">
                <button className="cs-nav-dropdown-item" type="button"
                  onClick={() => { setMenuOpen(false); onOpenProfile(); }}>
                  Profile Settings
                </button>
                <button className="cs-nav-dropdown-item" type="button"
                  onClick={() => { setMenuOpen(false); setShortcutsOpen(true); }}>
                  Keyboard shortcuts
                  <span style={{ marginLeft: 'auto', fontSize: '0.625rem', fontFamily: 'var(--font-mono)', color: 'var(--text-quaternary)' }}>Ctrl+/</span>
                </button>
                <div className="cs-nav-dropdown-divider" />
                <button className="cs-nav-dropdown-item danger" type="button"
                  onClick={() => { setMenuOpen(false); signOut(); }}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main */}
      <div className="cs-main" style={{ gridTemplateColumns: chatHidden ? '0 1fr' : '22rem 1fr' }}>
        {/* Left: AI Chat */}
        {!chatHidden && (
          <div className="cs-left">
            <div className="cs-left-header">
              AI Chat
              {profile?.model && <span className="cs-model-badge">{profile.model}</span>}
            </div>

            <MessageList messages={messages} streaming={streaming} />

            {pinnedFiles.length > 0 && (
              <PinnedFilesBar files={pinnedFiles} onUnpin={unpinFile} />
            )}

            <ChatInput onSend={sendMessage} disabled={streaming} />
          </div>
        )}

        {/* Right: Tabbed panels */}
        <div className="cs-right">
          <div className="cs-tabs" role="tablist">
            {TABS.map(t => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={activeTab === t.id}
                className={`cs-tab ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
                <span className="cs-tab-kbd">{t.key}</span>
              </button>
            ))}
          </div>

          <div className="cs-tab-content" role="tabpanel">
            {activeTab === 'workitems' && profile ? (
              <WorkItemList profile={profile} newItemTrigger={newWorkItemTrigger} />
            ) : activeTab === 'repos' && profile ? (
              <RepoPanel profile={profile} />
            ) : activeTab === 'email' ? (
              <MailPanel />
            ) : activeTab === 'calendar' ? (
              <CalendarPanel />
            ) : activeTab === 'teams' && profile ? (
              <TeamsPanel profile={profile} canPost={true} />
            ) : null}
          </div>
        </div>
      </div>

      {/* Overlays */}
      {paletteOpen && (
        <CommandPalette
          onClose={() => setPaletteOpen(false)}
          onNavigate={handleNavigate}
        />
      )}
      {shortcutsOpen && (
        <KeyboardShortcutsModal onClose={() => setShortcutsOpen(false)} />
      )}
    </div>
  );
}
