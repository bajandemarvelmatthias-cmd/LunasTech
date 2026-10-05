import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthState = {
  session: Session | null;
  loading: boolean;
  // Set when the user opened a confirmation link that failed or expired.
  linkError: string | null;
};

const AuthContext = createContext<AuthState | null>(null);

// Supabase puts a failed link in the URL hash (or query) as error_code.
function readLinkError(): string | null {
  const params = new URLSearchParams(
    window.location.hash.replace(/^#/, "") || window.location.search,
  );
  if (!params.get("error") && !params.get("error_code")) return null;
  window.history.replaceState(null, "", window.location.pathname);
  return "That confirmation link is invalid or has expired. Log in to get a new one.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkError] = useState<string | null>(readLinkError);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, linkError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
