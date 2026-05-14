// Single source of truth for where the JWT lives.
// Remember-me checked → localStorage (persists past tab close).
// Remember-me unchecked → sessionStorage (clears with the tab).
// On read we check localStorage first so the "remembered" token always wins if both somehow exist
// (e.g. an older app version leaked into the wrong store).

const KEY = 'devobsessed.auth.token';

function safeStorage(getter: () => Storage): Storage | null {
  try {
    return getter();
  } catch {
    return null;
  }
}

export const tokenStorage = {
  get(): string | null {
    const local = safeStorage(() => window.localStorage)?.getItem(KEY);
    if (local) return local;
    return safeStorage(() => window.sessionStorage)?.getItem(KEY) ?? null;
  },

  set(token: string, remember: boolean) {
    const local = safeStorage(() => window.localStorage);
    const session = safeStorage(() => window.sessionStorage);
    if (remember) {
      local?.setItem(KEY, token);
      session?.removeItem(KEY);
    } else {
      session?.setItem(KEY, token);
      local?.removeItem(KEY);
    }
  },

  clear() {
    safeStorage(() => window.localStorage)?.removeItem(KEY);
    safeStorage(() => window.sessionStorage)?.removeItem(KEY);
  },
};
