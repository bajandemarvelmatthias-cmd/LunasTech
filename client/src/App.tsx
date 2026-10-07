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
import { OutlineButton } from "@/components/ui/Button";
import { avatarUrlOf } from "@/components/ui/Avatar";
import { AccountMenu } from "@/components/ui/AccountMenu";
import { AccountProvider, useAccount } from "@/features/account/AccountProvider";
import { ProfileScreen } from "@/features/account/ProfileScreen";
import { SettingsScreen } from "@/features/account/SettingsScreen";
import { Shell, type NavTab } from "@/layout/Shell";
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

const PAGE_LABELS: Record<string, string> = { profile: "Profile", settings: "Settings" };

// Wide screens open the account menu from the sidebar chip. Phones have no
// sidebar, so they keep the picture button in the header.
function PhoneProfile({
  email,
  avatarUrl,
  onNavigate,
}: Readonly<{ email: string; avatarUrl: string | null; onNavigate: (id: string) => void }>) {
  const { name } = useAccount();
  return (
    <div className="md:hidden">
      <AccountMenu
        variant="avatar"
        name={name}
        email={email}
        avatarUrl={avatarUrl}
        onProfile={() => onNavigate("profile")}
        onSettings={() => onNavigate("settings")}
        onHome={() => onNavigate("overview")}
      />
    </div>
  );
}

// Admin workspace. Admins see only this; there is no way into the customer
// screens (decision-log.md #21).
function AdminWorkspace({ email, avatarUrl }: Readonly<{ email: string; avatarUrl: string | null }>) {
  const { name } = useAccount();
  const [tab, setTab] = useState("overview");
  // The overview can open a section at a given spot; the key restarts the section there.
  const [target, setTarget] = useState<{ id: number; start?: AdminStart }>({ id: 0 });

  // Every admin tab change clears any spot the overview chose, so a tab always opens on its list.
  function open(next: string, start?: AdminStart) {
    setTarget((t) => ({ id: t.id + 1, start }));
    setTab(next);
  }

  return (
    <Shell
      wide={!(tab in PAGE_LABELS)}
      sidebarFooter={
        <SidebarFooter
          admin
          name={name}
          email={email}
          avatarUrl={avatarUrl}
          onProfile={() => open("profile")}
          onSettings={() => open("settings")}
          onHome={() => open("overview")}
        />
      }
      workspace="Admin workspace"
      account={<PhoneProfile email={email} avatarUrl={avatarUrl} onNavigate={(id) => open(id)} />}
      nav={{ tabs: ADMIN_TABS, active: tab, onChange: (id) => open(id), label: PAGE_LABELS[tab] }}
    >
      {tab === "overview" && <AdminOverview onOpen={open} />}
      {(tab === "guides" || tab === "simulations") && (
        <AdminFlow key={`${tab}-${target.id}`} section={tab} start={target.start} />
      )}
      {tab === "devices" && <DevicesAdmin />}
      {tab === "customers" && <CustomersAdmin />}
      {tab === "profile" && <ProfileScreen email={email} role="Admin account" avatarUrl={avatarUrl} />}
      {tab === "settings" && <SettingsScreen email={email} />}
    </Shell>
  );
}

// Customer workspace. Customers see only this.
function CustomerWorkspace({ email, avatarUrl }: Readonly<{ email: string; avatarUrl: string | null }>) {
  const { name } = useAccount();
  const [tab, setTab] = useState("overview");
  // Opening guides from the dashboard remounts the flow so it can start at a device or a guide.
  const [guidesTarget, setGuidesTarget] = useState<{ id: number; start?: GuidesStart }>({ id: 0 });
  // The guide cards screen is wide; the steps after it are a narrow column.
  const [guidesWide, setGuidesWide] = useState(true);

  function openGuides(start?: GuidesStart) {
    setGuidesTarget((t) => ({ id: t.id + 1, start }));
    setTab("guides");
  }

  return (
    <Shell
      wide={tab === "overview" || tab === "progress" || (tab === "guides" && guidesWide)}
      sidebarFooter={
        <SidebarFooter
          admin={false}
          name={name}
          email={email}
          avatarUrl={avatarUrl}
          onStart={() => openGuides()}
          onProfile={() => setTab("profile")}
          onSettings={() => setTab("settings")}
          onHome={() => setTab("overview")}
        />
      }
      workspace="Your workspace"
      account={<PhoneProfile email={email} avatarUrl={avatarUrl} onNavigate={setTab} />}
      nav={{ tabs: CUSTOMER_TABS, active: tab, onChange: setTab, label: PAGE_LABELS[tab] }}
    >
      {tab === "overview" && <CustomerOverview onOpen={openGuides} />}
      {/* Guides stays mounted so the person keeps their place; Progress reloads each visit. */}
      <div hidden={tab !== "guides"}>
        <GuidesFlow key={guidesTarget.id} start={guidesTarget.start} onWide={setGuidesWide} />
      </div>
      {tab === "progress" && <ProgressScreen onOpenGuides={() => openGuides()} />}
      {tab === "profile" && <ProfileScreen email={email} role="Customer account" avatarUrl={avatarUrl} />}
      {tab === "settings" && <SettingsScreen email={email} />}
    </Shell>
  );
}

// Reads the role first and opens the one workspace it allows. Nothing is shown
// until the role is known, so an admin never sees the customer screens even
// for a moment. If the role cannot be read, neither workspace opens.
// The app only decides what to show; the database enforces what each role may
// read or write (decision-log.md #3).
function SignedIn() {
  const { session } = useAuth();
  const userId = session?.user.id ?? "";
  const email = session?.user.email ?? "";
  const avatarUrl = avatarUrlOf(session?.user);
  const { data: isAdmin, loading, error, retry } = useLoad(() => fetchIsAdmin(userId), [userId]);

  if (error) {
    return (
      <Shell
        account={
          <AccountMenu variant="avatar" name={email.split("@")[0]} email={email} avatarUrl={avatarUrl} />
        }
      >
        <div className="flex flex-col items-start gap-4">
          <p role="alert" className="text-sm text-danger">
            Can't load your account. Check your connection and try again.
          </p>
          <OutlineButton onClick={retry}>Try again</OutlineButton>
        </div>
      </Shell>
    );
  }
  if (loading || isAdmin === null) {
    return (
      <Shell>
        <p className="text-base text-text-muted">Loading</p>
      </Shell>
    );
  }
  return isAdmin ? <AdminWorkspace email={email} avatarUrl={avatarUrl} /> : <CustomerWorkspace email={email} avatarUrl={avatarUrl} />;
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

  return (
    <AccountProvider>
      <SignedIn />
    </AccountProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
