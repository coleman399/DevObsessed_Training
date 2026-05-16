import { useCallback, useRef, useState } from 'react';
import { apiFetch } from '../lib/api';
import { getDevOpsToken, getGraphToken } from '../lib/auth';
import type { SearchResult } from '../lib/types';

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const [devOpsToken, graphToken] = await Promise.all([getDevOpsToken(), getGraphToken()]);
        const headers: Record<string, string> = {};
        if (devOpsToken) headers['X-DevOps-Token'] = devOpsToken;
        if (graphToken)  headers['X-Graph-Token']  = graphToken;

        const data = await apiFetch<SearchResult[]>(
          `/api/search?q=${encodeURIComponent(query)}`,
          { headers }
        );
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const clear = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setResults([]);
    setLoading(false);
  }, []);

  return { results, loading, search, clear };
}
