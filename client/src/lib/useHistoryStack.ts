import { useCallback, useEffect, useRef, useState } from "react";

const KEY = "stackDepth";

// A stack of screens that follows the browser's back button.
// Each push adds one browser history entry; going back removes one screen.
// The URL never changes and a reload starts again from the first screen.
export function useHistoryStack<T>(initial: T) {
  const [stack, setStack] = useState<T[]>([initial]);
  const length = useRef(1);

  useEffect(() => {
    history.replaceState({ ...history.state, [KEY]: 1 }, "");

    function onPopState(event: PopStateEvent) {
      const depth: unknown = event.state?.[KEY];
      if (typeof depth !== "number") return; // left the app's entries: normal browser behavior
      if (depth < length.current) {
        length.current = depth;
        setStack((s) => s.slice(0, depth));
      } else if (depth > length.current) {
        // Forward to an entry whose screen no longer exists: step back to where the stack is.
        history.go(length.current - depth);
      }
    }

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const push = useCallback((next: T) => {
    length.current += 1;
    history.pushState({ [KEY]: length.current }, "");
    setStack((s) => [...s, next]);
  }, []);

  // The browser's own back runs the popstate handler above, which removes the screen.
  const pop = useCallback(() => {
    if (length.current > 1) history.back();
  }, []);

  // Swaps the current screen without adding a history entry.
  const replace = useCallback((next: T) => {
    setStack((s) => [...s.slice(0, -1), next]);
  }, []);

  // Back to the first screen in one step.
  const reset = useCallback(() => {
    if (length.current > 1) history.go(1 - length.current);
  }, []);

  return { current: stack[stack.length - 1], push, pop, replace, reset };
}
