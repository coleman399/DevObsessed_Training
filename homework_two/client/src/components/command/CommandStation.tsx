import { useState } from 'react';
import { ChatInput } from '../chat/ChatInput';
import { MessageList } from '../chat/MessageList';
import { PinnedFilesBar } from '../chat/PinnedFilesBar';
import { WorkItemList } from '../workitems/WorkItemList';
import { MailPanel } from '../outlook/MailPanel';
import { CalendarPanel } from '../calendar/CalendarPanel';
import { TeamsPanel } from '../teams/TeamsPanel';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import '../../styles/command.css';
import '../../styles/chat.css';

type Tab = 'workitems' | 'repos' | 'email' | 'calendar' | 'teams';

const TABS: { id: Tab; label: string; key: string }[] = [
  { id: 'workitems', label: 'Work Items', key: '1' },
  { id: 'repos', label: 'Repos & PRs', key: '2' },
  { id: 'email', label: 'Email', key: '3' },
  { id: 'calendar', label: 'Calendar', key: '4' },
  { id: 'teams', label: 'Teams', key: '5' },
];

function roleAbbr(role: string) {
  if (role === 'ProductOwner') return 'PO';
  if (role === 'SoftwareEngineer') return 'SE';
  if (role === 'QA') return 'QA';
  return role.slice(0, 2).toUpperCase();
}

interface Props {
  onOpenProfile: () => void;
}

export function CommandStation({ onOpenProfile }: Props) {
  const { profile, signOut } = useAuth();
  const { activeConversation, streaming, sendMessage, pinnedFiles, unpinFile } = useChat();
  const [activeTab, setActiveTab] = useState<Tab>('workitems');
  const [menuOpen, setMenuOpen] = useState(false);
  const firstName = (profile?.displayName ?? '').split(' ')[0];

  const messages = activeConversation?.messages ?? [];

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
          <input placeholder="⌘K Search…" readOnly />
        </div>

        <div className="cs-nav-right">
          <button className="cs-nav-bell" type="button" aria-label="Notifications">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M8 1a5 5 0 0 1 5 5v2l1.5 2.5h-13L3 8V6a5 5 0 0 1 5-5z"/>
              <path d="M6.5 13.5a1.5 1.5 0 0 0 3 0"/>
            </svg>
          </button>

          {profile && (
            <div className="cs-nav-role-pill">
              {roleAbbr(profile.role)} · {firstName}
            </div>
          )}

          <div className="cs-nav-user-menu">
            <button type="button" className="cs-nav-user-btn" onClick={() => setMenuOpen((o) => !o)}>
              {profile?.displayName ?? 'User'} ▾
            </button>
            {menuOpen && (
              <div className="cs-nav-dropdown">
                <button className="cs-nav-dropdown-item" type="button" onClick={() => { setMenuOpen(false); onOpenProfile(); }}>
                  Profile Settings
                </button>
                <div className="cs-nav-dropdown-divider" />
                <button className="cs-nav-dropdown-item danger" type="button" onClick={() => { setMenuOpen(false); signOut(); }}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main */}
      <div className="cs-main">
        {/* Left: AI Chat */}
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

        {/* Right: Tabbed panels */}
        <div className="cs-right">
          <div className="cs-tabs" role="tablist">
            {TABS.map((t) => (
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
              <WorkItemList profile={profile} />
            ) : activeTab === 'email' ? (
              <MailPanel />
            ) : activeTab === 'calendar' ? (
              <CalendarPanel />
            ) : activeTab === 'teams' && profile ? (
              <TeamsPanel profile={profile} canPost={false} />
            ) : (
              <TabStub tab={activeTab} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabStub({ tab }: { tab: Tab }) {
  const LABELS: Record<Tab, { icon: string; title: string; desc: string }> = {
    workitems: {
      icon: '◻',
      title: 'Work Items',
      desc: '',
    },
    repos: {
      icon: '⌥',
      title: 'Repos & PRs',
      desc: 'Azure DevOps and GitHub repositories and pull requests. Coming in Phase D.',
    },
    email: {
      icon: '✉',
      title: 'Email',
      desc: 'Unread Outlook emails and compose. Requires Mail.Read scope. Coming in Phase C.',
    },
    calendar: {
      icon: '◷',
      title: 'Calendar',
      desc: 'Week view and Teams join links. Requires Calendars.ReadWrite scope. Coming in Phase C.',
    },
    teams: {
      icon: '⊞',
      title: 'Teams',
      desc: 'Mentions, channels, and send. Requires Chat.Read scope. Coming in Phase C.',
    },
  };
  const info = LABELS[tab];
  return (
    <div className="cs-stub">
      <div className="cs-stub-icon">{info.icon}</div>
      <div className="cs-stub-title">{info.title}</div>
      <div className="cs-stub-desc">{info.desc}</div>
    </div>
  );
}
