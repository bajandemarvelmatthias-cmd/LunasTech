import { useState } from "react";
import { BookOpen, ChartLineUp, ShieldCheck } from "@phosphor-icons/react";
import { AuthProvider, useAuth } from "@/features/auth/AuthProvider";
import { AuthFlow } from "@/features/auth/AuthFlow";
import { ResetPasswordScreen } from "@/features/auth/ResetPasswordScreen";
import { AdminFlow } from "@/features/admin/AdminFlow";
import { fetchIsAdmin } from "@/features/admin/api";
import { GuidesFlow } from "@/features/guides/GuidesFlow";
import { ProgressScreen } from "@/features/progress/ProgressScreen";
import { TextButton } from "@/components/ui/Button";
import { Shell, type NavTab } from "@/layout/Shell";
import { supabase } from "@/lib/supabase";
import { useLoad } from "@/lib/useLoad";

const TABS: NavTab[] = [
  { id: "guides", label: "Guides", icon: BookOpen },
  { id: "progress", label: "Progress", icon: ChartLineUp },
];
const ADMIN_TAB: NavTab = { id: "admin", label: "Admin", icon: ShieldCheck };

function SignedIn() {
  const { session } = useAuth();
  const userId = session?.user.id ?? "";
  const [tab, setTab] = useState("guides");
  // The tab is only shown to admins. The database enforces what they may do.
  const { data: isAdmin } = useLoad(() => fetchIsAdmin(userId), [userId]);
  return (
    <Shell
      account={<TextButton onClick={() => supabase.auth.signOut()}>Log out</TextButton>}
      nav={{ tabs: isAdmin ? [...TABS, ADMIN_TAB] : TABS, active: tab, onChange: setTab }}
    >
      {/* Guides stays mounted so the user keeps their place; Progress reloads each visit. */}
      <div hidden={tab !== "guides"}>
        <GuidesFlow />
      </div>
      {tab === "progress" && <ProgressScreen />}
      {tab === "admin" && isAdmin && <AdminFlow />}
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
