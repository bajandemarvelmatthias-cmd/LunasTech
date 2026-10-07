import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  fetchGoogleBirthday,
  fetchProfile,
  saveBirthdayIfEmpty,
  saveProfile,
  type Profile,
} from "./api";

type AccountState = {
  profile: Profile | null;
  loading: boolean;
  error: boolean;
  // The name shown in menus: first and last name, else the part of the email before "@".
  name: string;
  save: (input: Profile) => Promise<void>;
  retry: () => void;
};

const AccountContext = createContext<AccountState | null>(null);

export function fullNameOf(profile: Profile | null, email: string): string {
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
  const triedGoogle = useRef(false);

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

  // Right after a Google sign-in the session carries a Google access token.
  // Use it once to read the birthday, only if the profile has none yet.
  const providerToken = session?.provider_token ?? null;
  const isGoogle = session?.user.app_metadata?.provider === "google";
  useEffect(() => {
    if (!profile || profile.birthday || !providerToken || !isGoogle || triedGoogle.current) return;
    triedGoogle.current = true;
    void fetchGoogleBirthday(providerToken).then(async (birthday) => {
      if (birthday && (await saveBirthdayIfEmpty(userId, birthday))) {
        setProfile((p) => (p ? { ...p, birthday } : p));
      }
    });
  }, [profile, providerToken, isGoogle, userId]);

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
      name: fullNameOf(profile, email),
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
