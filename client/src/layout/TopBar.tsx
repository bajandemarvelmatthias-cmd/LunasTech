import { useEffect, useRef, useState, type FormEvent } from "react";
import { CaretRight, Sidebar as SidebarIcon } from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/Avatar";
import { SearchField } from "@/components/ui/SearchField";
import { cn } from "@/lib/utils";
import { initialsOf, useProfile } from "@/features/profile/ProfileProvider";
import { PAGE_LABEL, type PageId } from "./nav";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

type Props = {
  page: PageId;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onSearch: (query: string) => void;
  onOpenSettings: () => void;
};

// Fixed-height header: sidebar toggle, breadcrumb, search, account.
// Search submits to Repair Guides. Ctrl K (or Cmd K) focuses it.
export function TopBar({ page, sidebarOpen, onToggleSidebar, onSearch, onOpenSettings }: Readonly<Props>) {
  const { displayName, email } = useProfile();
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        input.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    onSearch(query.trim());
    input.current?.blur();
  }

  return (
    <header className="sticky top-0 z-10 flex h-(--size-header) shrink-0 items-center gap-4 border-b border-border bg-surface px-4 md:px-6">
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label={sidebarOpen ? "Hide navigation" : "Show navigation"}
        aria-expanded={sidebarOpen}
        className={cn("flex size-10 shrink-0 items-center justify-center rounded-md text-text-muted hover:text-text", focus)}
      >
        <SidebarIcon className="size-6" aria-hidden="true" />
      </button>
      <nav aria-label="Breadcrumb" className="hidden items-center gap-2 text-base lg:flex">
        <span className="text-text-muted">Workspace</span>
        <CaretRight className="size-4 text-text-muted" aria-hidden="true" />
        <span aria-current="page" className="font-semibold">
          {PAGE_LABEL[page]}
        </span>
      </nav>
      <form role="search" onSubmit={submit} className="ml-auto w-full max-w-sm">
        <SearchField
          label="Search guides and devices"
          placeholder="Search guides, devices…"
          value={query}
          onChange={setQuery}
          inputRef={input}
          trailing={
            <kbd className="hidden rounded-md border border-border px-2 py-1 text-xs text-text-muted sm:inline">
              Ctrl K
            </kbd>
          }
        />
      </form>
      <button
        type="button"
        onClick={onOpenSettings}
        aria-label="Account settings"
        className={cn("shrink-0 rounded-full", focus)}
      >
        <Avatar initials={initialsOf(displayName, email)} className="size-12" />
      </button>
    </header>
  );
}
