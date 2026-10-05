import { AuthProvider, useAuth } from "@/features/auth/AuthProvider";
import { AuthFlow } from "@/features/auth/AuthFlow";
import { ResetPasswordScreen } from "@/features/auth/ResetPasswordScreen";
import { GuidesFlow } from "@/features/guides/GuidesFlow";
import { TextButton } from "@/components/ui/Button";
import { Shell } from "@/layout/Shell";
import { supabase } from "@/lib/supabase";

function Root() {
  const { session, loading, recovering, finishRecovery } = useAuth();

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

  // Arrived from a reset link: choose a new password before anything else.
  if (recovering) {
    return (
      <Shell>
        <ResetPasswordScreen onDone={finishRecovery} />
      </Shell>
    );
  }

  return (
    <Shell account={<TextButton onClick={() => supabase.auth.signOut()}>Log out</TextButton>}>
      <GuidesFlow />
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
