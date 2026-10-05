import { AuthProvider, useAuth } from "@/features/auth/AuthProvider";
import { AuthFlow } from "@/features/auth/AuthFlow";
import { TextButton } from "@/components/ui/Button";
import { Shell } from "@/layout/Shell";
import { supabase } from "@/lib/supabase";

function Root() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <Shell>
        <p className="text-base text-text-muted">Loading</p>
      </Shell>
    );
  }

  if (!session) {
    return (
      <Shell>
        <AuthFlow />
      </Shell>
    );
  }

  // Placeholder until the guides screen exists (next milestone).
  return (
    <Shell account={<TextButton onClick={() => supabase.auth.signOut()}>Log out</TextButton>}>
      <h1 className="text-lg font-semibold">Signed in</h1>
      <p className="text-base text-text-muted">{session.user.email}</p>
    </Shell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
