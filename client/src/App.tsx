import { useState } from "react";
import { BookOpen, ChartLineUp, SquaresFour } from "@phosphor-icons/react";
import { AuthProvider, useAuth } from "@/features/auth/AuthProvider";
import { AuthFlow } from "@/features/auth/AuthFlow";
import { ResetPasswordScreen } from "@/features/auth/ResetPasswordScreen";
import { AdminFlow } from "@/features/admin/AdminFlow";
import { fetchIsAdmin } from "@/features/admin/api";
import { GuidesFlow } from "@/features/guides/GuidesFlow";
import { AdminOverview } from "@/features/overview/AdminOverview";
import { CustomerOverview } from "@/features/overview/CustomerOverview";
import { ProgressScreen } from "@/features/progress/ProgressScreen";
import { TextButton } from "@/components/ui/Button";
import { Shell, type NavTab } from "@/layout/Shell";
import { supabase } from "@/lib/supabase";
import { useLoad } from "@/lib/useLoad";

const OVERVIEW: NavTab = { id: "overview", label: "Overview", icon: SquaresFour };
const CUSTOMER_TABS: NavTab[] = [
  OVERVIEW,
  { id: "guides", label: "Guides", icon: BookOpen },
  { id: "progress", label: "Progress", icon: ChartLineUp },
];
const ADMIN_TABS: NavTab[] = [OVERVIEW, { id: "guides", label: "Guides", icon: BookOpen }];

type Workspace = "customer" | "admin";

function SignedIn() {
  const { session } = useAuth();
  const userId = session?.user.id ?? "";
  // Admins open in the admin workspace; everyone else gets the customer one.
  // The database enforces what an admin may do.
  const [workspace, setWorkspace] = useState<Workspace>("admin");
  const [tab, setTab] = useState("overview");
  const { data: isAdmin } = useLoad(() => fetchIsAdmin(userId), [userId]);
  const current: Workspace = isAdmin && workspace === "admin" ? "admin" : "customer";

  function switchTo(next: Workspace) {
    setWorkspace(next);
    setTab("overview");
  }

  return (
    <Shell
      wide={tab === "overview"}
      workspace={current === "admin" ? "Admin workspace" : "Your workspace"}
      account={
        <div className="flex items-center gap-4">
          {isAdmin && (
            <TextButton onClick={() => switchTo(current === "admin" ? "customer" : "admin")}>
              {current === "admin" ? "Preview customer" : "Back to admin"}
            </TextButton>
          )}
          <TextButton onClick={() => supabase.auth.signOut()}>Log out</TextButton>
        </div>
      }
      nav={{ tabs: current === "admin" ? ADMIN_TABS : CUSTOMER_TABS, active: tab, onChange: setTab }}
    >
      {tab === "overview" &&
        (current === "admin" ? (
          <AdminOverview onOpenGuides={() => setTab("guides")} />
        ) : (
          <CustomerOverview onOpenGuides={() => setTab("guides")} />
        ))}
      {/* Customer Guides stays mounted so the person keeps their place; Progress reloads each visit. */}
      {current === "customer" && (
        <div hidden={tab !== "guides"}>
          <GuidesFlow />
        </div>
      )}
      {current === "customer" && tab === "progress" && <ProgressScreen />}
      {current === "admin" && tab === "guides" && <AdminFlow />}
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
    return <AuthFlow />;
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
