import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchSavedIds, saveGuide, unsaveGuide } from "./api";

type SavedState = {
  ids: ReadonlySet<string>;
  // Set when the last save or remove failed; cleared by the next success.
  failed: boolean;
  toggle: (guideId: string) => Promise<void>;
};

const SavedContext = createContext<SavedState | null>(null);

// One shared set of saved guide ids, so a bookmark looks the same on every
// screen. Toggling updates at once and is undone if the database refuses.
export function SavedProvider({ userId, children }: Readonly<{ userId: string; children: ReactNode }>) {
  const [ids, setIds] = useState<ReadonlySet<string>>(new Set());
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetchSavedIds(userId)
      .then((list) => setIds(new Set(list)))
      .catch(() => setFailed(true));
  }, [userId]);

  const toggle = useCallback(
    async (guideId: string) => {
      const wasSaved = ids.has(guideId);
      const apply = (on: boolean) =>
        setIds((current) => {
          const next = new Set(current);
          if (on) next.add(guideId);
          else next.delete(guideId);
          return next;
        });
      apply(!wasSaved);
      try {
        await (wasSaved ? unsaveGuide(userId, guideId) : saveGuide(userId, guideId));
        setFailed(false);
      } catch {
        apply(wasSaved);
        setFailed(true);
      }
    },
    [ids, userId],
  );

  const value = useMemo(() => ({ ids, failed, toggle }), [ids, failed, toggle]);
  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved(): SavedState {
  const value = useContext(SavedContext);
  if (!value) throw new Error("useSaved must be used inside SavedProvider");
  return value;
}
