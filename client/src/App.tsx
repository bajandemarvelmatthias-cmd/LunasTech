import { useState } from "react";
import { BookOpen, ChartLineUp } from "@phosphor-icons/react";
import { AuthProvider, useAuth } from "@/features/auth/AuthProvider";
import { AuthFlow } from "@/features/auth/AuthFlow";
import { ResetPasswordScreen } from "@/features/auth/ResetPasswordScreen";
import { GuidesFlow } from "@/features/guides/GuidesFlow";
import { ProgressScreen } from "@/features/progress/ProgressScreen";
import { TextButton } from "@/components/ui/Button";
import { Shell, type NavTab } from "@/layout/Shell";
import { supabase } from "@/lib/supabase";

const TABS: NavTab[] = [
  { id: "guides", label: "Guides", icon: BookOpen },
  { id: "progress", label: "Progress", icon: ChartLineUp },
];

function SignedIn() {
  const [tab, setTab] = useState("guides");
  return (
    <Shell
      account={<TextButton onClick={() => supabase.auth.signOut()}>Log out</TextButton>}
      nav={{ tabs: TABS, active: tab, onChange: setTab }}
    >
      {/* Guides stays mounted so the user keeps their place; Progress reloads each visit. */}
      <div hidden={tab !== "guides"}>
        <GuidesFlow />
      </div>
      {tab === "progress" && <ProgressScreen />}
    </Shell>
  );
}

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

  return <SignedIn />;
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
