import { useEffect, useRef, useState } from 'react';
import { useSearch } from '../../hooks/useSearch';
import type { PanelTarget, SearchResultType } from '../../lib/types';
import '../../styles/overlay.css';

const TYPE_ICON: Record<SearchResultType, string> = {
  workitem: '◻', pr: '⌥', code: '{ }', email: '✉', teams: '💬', calendar: '◷',
};

const GROUP_ORDER: SearchResultType[] = ['workitem', 'pr', 'code', 'email', 'teams', 'calendar'];
const GROUP_LABEL: Record<SearchResultType, string> = {
  workitem: 'Work Items', pr: 'Pull Requests', code: 'Code', email: 'Email', teams: 'Teams', calendar: 'Calendar',
};

interface Props {
  onClose: () => void;
  onNavigate: (panelTarget: PanelTarget) => void;
}

export function CommandPalette({ onClose, onNavigate }: Props) {
  const [query, setQuery] = useState('');
  const [focusIdx, setFocusIdx] = useState(0);
  const { results, loading, search, clear } = useSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    search(query);
    setFocusIdx(0);
  }, [query, search]);

  // Group results
  const grouped: Partial<Record<SearchResultType, typeof results>> = {};
  for (const r of results) {
    (grouped[r.type] ??= []).push(r);
  }

  const flatList = GROUP_ORDER.flatMap(t => grouped[t] ?? []);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); clear(); onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx(i => Math.min(i + 1, flatList.length - 1)); return; }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setFocusIdx(i => Math.max(i - 1, 0)); return; }
    if (e.key === 'Enter' && flatList[focusIdx]) {
      const r = flatList[focusIdx];
      if (r.url) window.open(r.url, '_blank');
      else onNavigate(r.panelTarget);
      clear(); onClose();
    }
  }

  return (
    <div className="cp-backdrop" onClick={e => e.target === e.currentTarget && (clear(), onClose())}>
      <div className="cp-modal" role="dialog" aria-label="Global search">
        <div className="cp-input-row">
          <span className="cp-search-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="6.5" cy="6.5" r="4.5"/><path d="M10.5 10.5l3 3"/>
            </svg>
          </span>
          <input
            ref={inputRef}
            className="cp-input"
            placeholder="Search work items, code, email, Teams…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            autoComplete="off"
          />
          <span className="cp-kbd">Esc</span>
        </div>

        <div className="cp-results" role="listbox">
          {loading && (
            <div className="cp-loading">
              <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s ease-in-out infinite', display: 'inline-block' }} />
              Searching…
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="cp-empty">No results for "{query}"</div>
          )}

          {!loading && results.length > 0 && GROUP_ORDER.map(type => {
            const group = grouped[type];
            if (!group?.length) return null;
            const startIdx = flatList.indexOf(group[0]);
            return (
              <div key={type}>
                <div className="cp-group-label">{GROUP_LABEL[type]}</div>
                {group.map((r, i) => {
                  const idx = startIdx + i;
                  return (
                    <div
                      key={`${r.type}-${r.id ?? i}`}
                      className={`cp-result ${idx === focusIdx ? 'focused' : ''}`}
                      role="option"
                      aria-selected={idx === focusIdx}
                      onClick={() => {
                        if (r.url) window.open(r.url, '_blank');
                        else onNavigate(r.panelTarget);
                        clear(); onClose();
                      }}
                      onMouseEnter={() => setFocusIdx(idx)}
                    >
                      <div className="cp-result-icon">{TYPE_ICON[r.type]}</div>
                      <div className="cp-result-text">
                        <div className="cp-result-title">{r.title}</div>
                        <div className="cp-result-sub">{r.subtitle}</div>
                      </div>
                      <span className="cp-result-arrow">→</span>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {!query && (
            <div className="cp-empty" style={{ padding: '1.5rem 1rem' }}>
              Start typing to search across work items, code, email, Teams, and calendar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
