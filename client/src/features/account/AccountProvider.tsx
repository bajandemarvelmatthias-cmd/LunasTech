import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  fetchProfile,
  saveProfile,
  type Profile,
} from "./api";

type AccountState = {
  profile: Profile | null;
  loading: boolean;
  error: boolean;
  // The name shown in menus: nickname, else first and last name, else the part of the email before "@".
  name: string;
  save: (input: Profile) => Promise<void>;
  retry: () => void;
};

const AccountContext = createContext<AccountState | null>(null);

export function shownNameOf(profile: Profile | null, email: string): string {
  const nickname = profile?.nickname.trim() ?? "";
  if (nickname) return nickname;
  const full = `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim();
  return full || email.split("@")[0];
}

// Loads the signed-in user's profile once and shares it, so a change on the
// Profile page shows at once in the sidebar. It never blocks the screen: until
// the profile arrives, menus show the email name.
export function AccountProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { session } = useAuth();
  const userId = session?.user.id ?? "";
  const email = session?.user.email ?? "";
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetchProfile(userId)
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, attempt]);

  const save = useCallback(
    async (input: Profile) => {
      setProfile(await saveProfile(userId, input));
    },
    [userId],
  );

  const value = useMemo<AccountState>(
    () => ({
      profile,
      loading,
      error,
      name: shownNameOf(profile, email),
      save,
      retry: () => setAttempt((n) => n + 1),
    }),
    [profile, loading, error, email, save],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount(): AccountState {
  const value = useContext(AccountContext);
  if (!value) throw new Error("useAccount must be used inside AccountProvider");
  return value;
}
