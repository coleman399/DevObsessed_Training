import { useEffect } from 'react';

type Tab = 'workitems' | 'repos' | 'email' | 'calendar' | 'teams';

const TAB_KEYS: Record<string, Tab> = {
  '1': 'workitems', '2': 'repos', '3': 'email', '4': 'calendar', '5': 'teams',
};

interface Handlers {
  onOpenSearch: () => void;
  onToggleChat: () => void;
  onNewWorkItem: () => void;
  onShowShortcuts: () => void;
  onSwitchTab: (tab: Tab) => void;
  onEscape: () => void;
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || (el as HTMLElement).isContentEditable;
}

export function useKeyboardShortcuts(handlers: Handlers) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Ctrl+K — global search
      if (e.ctrlKey && e.key === 'k') { e.preventDefault(); handlers.onOpenSearch(); return; }
      // Ctrl+J — toggle chat
      if (e.ctrlKey && e.key === 'j') { e.preventDefault(); handlers.onToggleChat(); return; }
      // Ctrl+N — new work item
      if (e.ctrlKey && e.key === 'n') { e.preventDefault(); handlers.onNewWorkItem(); return; }
      // Ctrl+/ — show shortcuts
      if (e.ctrlKey && e.key === '/') { e.preventDefault(); handlers.onShowShortcuts(); return; }
      // Esc — close active overlay
      if (e.key === 'Escape') { handlers.onEscape(); return; }
      // 1–5 — switch tabs (only when no input focused)
      if (!isInputFocused() && TAB_KEYS[e.key]) {
        handlers.onSwitchTab(TAB_KEYS[e.key]);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlers]);
}
