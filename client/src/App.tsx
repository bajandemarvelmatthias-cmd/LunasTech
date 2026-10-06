import { useEffect, useRef, useState } from "react";
import { AuthProvider, useAuth } from "@/features/auth/AuthProvider";
import { AuthFlow } from "@/features/auth/AuthFlow";
import { ResetPasswordScreen } from "@/features/auth/ResetPasswordScreen";
import { AdminFlow } from "@/features/admin/AdminFlow";
import { fetchIsAdmin } from "@/features/admin/api";
import { GuidesFlow, type LearnRoot } from "@/features/guides/GuidesFlow";
import type { Guide } from "@/features/guides/types";
import { OverviewScreen } from "@/features/overview/OverviewScreen";
import { ProfileProvider, useProfile } from "@/features/profile/ProfileProvider";
import { ProgressScreen } from "@/features/progress/ProgressScreen";
import { SavedProvider } from "@/features/saved/SavedProvider";
import { SavedScreen } from "@/features/saved/SavedScreen";
import { SettingsScreen } from "@/features/settings/SettingsScreen";
import { Shell } from "@/layout/Shell";
import { WorkspaceShell } from "@/layout/WorkspaceShell";
import type { PageId } from "@/layout/nav";
import { useLoad } from "@/lib/useLoad";

type NavigateOptions = { query?: string; deviceId?: string; guide?: Guide };

// Pages that live inside GuidesFlow. Its history stack is shared, so only one
// of them is mounted at a time (lib/useHistoryStack.ts).
const LEARN_PAGES: readonly PageId[] = ["guides", "simulations", "diagnose"];
const isLearn = (page: PageId): page is LearnRoot => LEARN_PAGES.includes(page);

type Learn = {
  root: LearnRoot | null;
  query: string;
  deviceId: string | null;
  guide: Guide | null;
  // Changing it starts the flow again from its root page.
  nonce: number;
};

function Workspace({ isAdmin }: Readonly<{ isAdmin: boolean }>) {
  const { refresh } = useProfile();
  const [page, setPage] = useState<PageId>("overview");
  const [learn, setLearn] = useState<Learn>({ root: null, query: "", deviceId: null, guide: null, nonce: 0 });

  // The learning level changes when a simulation is finished, so re-read the
  // profile when the user moves to another page (ProfileProvider did the first read).
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    refresh();
  }, [page, refresh]);

  function navigate(next: PageId, options?: NavigateOptions) {
    if (isLearn(next)) {
      // Keep the user's place when they come back to the same page. Start over
      // when they ask for something specific or press the page they are on.
      const fresh = options !== undefined || learn.root !== next || page === next;
      if (fresh) {
        setLearn((l) => ({
          root: next,
          query: options?.query ?? "",
          deviceId: options?.deviceId ?? null,
          guide: options?.guide ?? null,
          nonce: l.nonce + 1,
        }));
      }
    }
    setPage(next);
  }

  return (
    <WorkspaceShell
      page={page}
      isAdmin={isAdmin}
      onNavigate={navigate}
      onSearch={(query) => navigate("guides", { query })}
    >
      {page === "overview" && <OverviewScreen onNavigate={navigate} />}
      {learn.root && (
        <div hidden={!isLearn(page)} className="flex flex-col gap-8">
          <GuidesFlow
            key={learn.nonce}
            root={learn.root}
            initialQuery={learn.query}
            initialDeviceId={learn.deviceId}
            initialGuide={learn.guide}
          />
        </div>
      )}
      {page === "saved" && (
        <SavedScreen onOpen={(guide) => navigate("guides", { guide })} onBrowse={() => navigate("guides")} />
      )}
      {page === "progress" && <ProgressScreen />}
      {page === "settings" && <SettingsScreen />}
      {page === "admin" && isAdmin && (
        <div className="max-w-2xl">
          <AdminFlow />
        </div>
      )}
    </WorkspaceShell>
  );
}

function SignedIn() {
  const { session } = useAuth();
  const userId = session?.user.id ?? "";
  // The Admin item is only shown to admins. The database enforces what they may do.
  const { data: isAdmin } = useLoad(() => fetchIsAdmin(userId), [userId]);
  return (
    <ProfileProvider userId={userId} email={session?.user.email ?? ""}>
      <SavedProvider userId={userId}>
        <Workspace isAdmin={isAdmin === true} />
      </SavedProvider>
    </ProfileProvider>
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
