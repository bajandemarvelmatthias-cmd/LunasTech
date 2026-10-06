import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useSaved } from "@/features/saved/SavedProvider";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import type { PageId } from "./nav";

const DESKTOP = "(min-width: 768px)";

type Props = {
  page: PageId;
  isAdmin: boolean;
  onNavigate: (page: PageId) => void;
  onSearch: (query: string) => void;
  children: ReactNode;
};

// Layout shell for signed-in screens (ux-ui-guidelines.md, layout shell rules).
// The sidebar sits beside the content from md up and opens as a drawer on
// phones. Header and sidebar never change between pages; only children do.
export function WorkspaceShell({ page, isAdmin, onNavigate, onSearch, children }: Readonly<Props>) {
  const [open, setOpen] = useState(() => window.matchMedia(DESKTOP).matches);
  const { failed: saveFailed } = useSaved();
  const isDesktop = () => window.matchMedia(DESKTOP).matches;

  // Escape closes the drawer on phones.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDesktop()) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function closeOnPhone() {
    if (!isDesktop()) setOpen(false);
  }

  function go(next: PageId) {
    onNavigate(next);
    closeOnPhone();
  }

  return (
    <div className="flex min-h-dvh bg-canvas">
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-20 bg-text/40 md:hidden"
        />
      )}
      <aside
        aria-label="Sidebar"
        hidden={!open}
        className="fixed inset-y-0 left-0 z-30 h-dvh w-(--size-sidebar) overflow-y-auto border-r border-border bg-surface md:sticky md:top-0 md:z-auto md:shrink-0"
      >
        <Sidebar
          page={page}
          isAdmin={isAdmin}
          onSelect={go}
          onSignOut={() => supabase.auth.signOut()}
        />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          page={page}
          sidebarOpen={open}
          onToggleSidebar={() => setOpen((v) => !v)}
          onSearch={(q) => {
            onSearch(q);
            closeOnPhone();
          }}
          onOpenSettings={() => go("settings")}
        />
        <main className="mx-auto flex w-full max-w-(--size-content) flex-1 flex-col gap-8 px-4 py-8 md:px-6 md:py-12">
          {saveFailed && (
            <p role="alert" className="text-sm text-danger">
              Saved guides could not be updated. Check your connection and try again.
            </p>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
