import { useState } from "react";
import { BookOpen, ChartLineUp, Cube, DeviceMobile, SquaresFour, Users } from "@phosphor-icons/react";
import { AuthProvider, useAuth } from "@/features/auth/AuthProvider";
import { AuthFlow } from "@/features/auth/AuthFlow";
import { ResetPasswordScreen } from "@/features/auth/ResetPasswordScreen";
import { AdminFlow } from "@/features/admin/AdminFlow";
import { fetchIsAdmin } from "@/features/admin/api";
import { CustomersAdmin } from "@/features/admin/CustomersAdmin";
import { DevicesAdmin } from "@/features/admin/DevicesAdmin";
import type { AdminStart } from "@/features/admin/types";
import { GuidesFlow, type GuidesStart } from "@/features/guides/GuidesFlow";
import { AdminOverview } from "@/features/overview/AdminOverview";
import { CustomerOverview } from "@/features/overview/CustomerOverview";
import { SidebarFooter } from "@/features/overview/SidebarFooter";
import { ProgressScreen } from "@/features/progress/ProgressScreen";
import { TextButton } from "@/components/ui/Button";
import { Shell, type NavTab } from "@/layout/Shell";
import { supabase } from "@/lib/supabase";
import { useLoad } from "@/lib/useLoad";

const OVERVIEW: NavTab = { id: "overview", label: "Overview", icon: SquaresFour };
const CUSTOMER_TABS: NavTab[] = [
  OVERVIEW,
  { id: "guides", label: "Repair Guides", icon: BookOpen },
  { id: "progress", label: "My Progress", icon: ChartLineUp },
];
const ADMIN_TABS: NavTab[] = [
  OVERVIEW,
  { id: "guides", label: "Guides", icon: BookOpen },
  { id: "simulations", label: "Simulations", icon: Cube },
  { id: "devices", label: "Devices", icon: DeviceMobile },
  { id: "customers", label: "Customers", icon: Users },
];

type Workspace = "customer" | "admin";

function SignedIn() {
  const { session } = useAuth();
  const userId = session?.user.id ?? "";
  // Admins open in the admin workspace; everyone else gets the customer one.
  // The database enforces what an admin may do.
  const [workspace, setWorkspace] = useState<Workspace>("admin");
  const [tab, setTab] = useState("overview");
  // Opening guides from the dashboard remounts the flow so it can start at a device or a guide.
  const [guidesTarget, setGuidesTarget] = useState<{ id: number; start?: GuidesStart }>({ id: 0 });
  // Same idea for the admin sections: the overview can open one at a given spot.
  const [adminTarget, setAdminTarget] = useState<{ id: number; start?: AdminStart }>({ id: 0 });
  const { data: isAdmin } = useLoad(() => fetchIsAdmin(userId), [userId]);
  const current: Workspace = isAdmin && workspace === "admin" ? "admin" : "customer";

  function openGuides(start?: GuidesStart) {
    setGuidesTarget((t) => ({ id: t.id + 1, start }));
    setTab("guides");
  }

  function openAdmin(next: string, start?: AdminStart) {
    setAdminTarget((t) => ({ id: t.id + 1, start }));
    setTab(next);
  }

  function switchTo(next: Workspace) {
    setWorkspace(next);
    setTab("overview");
  }

  return (
    <Shell
      wide={tab === "overview" || current === "admin"}
      sidebarFooter={
        <SidebarFooter email={session?.user.email ?? ""} admin={current === "admin"} onStart={() => openGuides()} />
      }
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
      nav={{
        tabs: current === "admin" ? ADMIN_TABS : CUSTOMER_TABS,
        active: tab,
        // Admin tabs clear any spot the overview chose, so a tab always opens on its list.
        onChange: current === "admin" ? (id) => openAdmin(id) : setTab,
      }}
    >
      {tab === "overview" &&
        (current === "admin" ? (
          <AdminOverview onOpen={openAdmin} />
        ) : (
          <CustomerOverview onOpen={openGuides} />
        ))}
      {/* Customer Guides stays mounted so the person keeps their place; Progress reloads each visit. */}
      {current === "customer" && (
        <div hidden={tab !== "guides"}>
          <GuidesFlow key={guidesTarget.id} start={guidesTarget.start} />
        </div>
      )}
      {current === "customer" && tab === "progress" && <ProgressScreen />}
      {/* Admin sections reload on every visit; the key restarts a section at the spot the overview chose. */}
      {current === "admin" && (tab === "guides" || tab === "simulations") && (
        <AdminFlow key={`${tab}-${adminTarget.id}`} section={tab} start={adminTarget.start} />
      )}
      {current === "admin" && tab === "devices" && <DevicesAdmin />}
      {current === "admin" && tab === "customers" && <CustomersAdmin />}
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
