import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthState = {
  session: Session | null;
  loading: boolean;
  // Set when the user opened an email link that failed or expired.
  linkError: string | null;
  // True while the user arrived from a password reset link and has not yet
  // chosen a new password. The session is already signed in at that point.
  recovering: boolean;
  finishRecovery: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

// Supabase puts a failed link in the URL hash (or query) as error_code.
function readLinkError(): string | null {
  const params = new URLSearchParams(
    window.location.hash.replace(/^#/, "") || window.location.search,
  );
  if (!params.get("error") && !params.get("error_code")) return null;
  window.history.replaceState(null, "", window.location.pathname);
  return "That link is invalid or has expired. Log in or reset your password to get a new one.";
}

// A valid reset link lands with type=recovery in the hash. Read it on first
// render, before Supabase clears the hash, so the reset screen shows at once.
function readRecoveryLink(): boolean {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return params.get("type") === "recovery";
}

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkError] = useState<string | null>(readLinkError);
  const [recovering, setRecovering] = useState(readRecoveryLink);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      setSession(next);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      session,
      loading,
      linkError,
      recovering,
      finishRecovery: () => setRecovering(false),
    }),
    [session, loading, linkError, recovering],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
