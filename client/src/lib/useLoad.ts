import { useEffect, useState } from "react";

type LoadState<T> = { data: T | null; error: boolean; loading: boolean };

// Runs an async loader when `deps` change. `retry` runs it again.
// Errors become a flag; screens show one fixed message with a retry action.
export function useLoad<T>(load: () => Promise<T>, deps: readonly unknown[]) {
  const [state, setState] = useState<LoadState<T>>({ data: null, error: false, loading: true });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, error: false, loading: true }));
    load()
      .then((data) => {
        if (!cancelled) setState({ data, error: false, loading: false });
      })
      .catch(() => {
        if (!cancelled) setState({ data: null, error: true, loading: false });
      });
    return () => {
      cancelled = true;
    };
    // `load` is a new closure every render; `deps` are the real inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  return { ...state, retry: () => setAttempt((n) => n + 1) };
}
