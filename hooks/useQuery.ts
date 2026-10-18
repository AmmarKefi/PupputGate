import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/lib/api';

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

/**
 * Minimal data hook giving every screen a consistent loading/error/data shape,
 * with manual refetch and optional polling (honest demo refresh, not push).
 */
export function useQuery<T>(
  fetcher: () => Promise<T>,
  opts: { deps?: unknown[]; pollMs?: number; enabled?: boolean } = {},
) {
  const { deps = [], pollMs, enabled = true } = opts;
  const [state, setState] = useState<QueryState<T>>({ data: null, loading: enabled, error: null });
  const mounted = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async (silent = false) => {
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetcherRef.current();
      if (mounted.current) setState({ data, loading: false, error: null });
    } catch (e) {
      if (mounted.current)
        setState((s) => ({ ...s, loading: false, error: e instanceof ApiError ? e : new ApiError(0, 'UNKNOWN') }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    mounted.current = true;
    if (enabled) run();
    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  useEffect(() => {
    if (!enabled || !pollMs) return;
    const id = setInterval(() => run(true), pollMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, pollMs, ...deps]);

  return { ...state, refetch: () => run(false) };
}
