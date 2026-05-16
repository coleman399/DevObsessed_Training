import '../../styles/overlay.css';

interface Props {
  onClose: () => void;
}

const SHORTCUTS = [
  { label: 'Global search',      keys: ['Ctrl', 'K'] },
  { label: 'Toggle chat panel',  keys: ['Ctrl', 'J'] },
  { label: 'New work item',      keys: ['Ctrl', 'N'] },
  { label: 'Keyboard shortcuts', keys: ['Ctrl', '/'] },
  { label: 'Work Items tab',     keys: ['1'] },
  { label: 'Repos & PRs tab',    keys: ['2'] },
  { label: 'Email tab',          keys: ['3'] },
  { label: 'Calendar tab',       keys: ['4'] },
  { label: 'Teams tab',          keys: ['5'] },
  { label: 'Close / cancel',     keys: ['Esc'] },
  { label: 'Navigate results',   keys: ['↑', '↓'] },
  { label: 'Select result',      keys: ['Enter'] },
];

export function KeyboardShortcutsModal({ onClose }: Props) {
  return (
    <div className="ks-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ks-modal">
        <div className="ks-title">Keyboard Shortcuts</div>
        <div className="ks-grid">
          {SHORTCUTS.map(s => (
            <div key={s.label} className="ks-row">
              <span className="ks-label">{s.label}</span>
              <div className="ks-keys">
                {s.keys.map((k, i) => (
                  <span key={i} className="ks-key">{k}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="ks-close-row">
          <button className="btn btn-ghost" type="button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
