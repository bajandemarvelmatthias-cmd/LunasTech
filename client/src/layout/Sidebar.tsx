import { Lightning, SignOut } from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { initialsOf, useProfile } from "@/features/profile/ProfileProvider";
import { levelName } from "@/features/profile/levels";
import { Brand } from "./Brand";
import { ADMIN_NAV, MAIN_NAV, SETTINGS_NAV, type NavItem, type PageId } from "./nav";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function NavButton({
  item,
  active,
  onSelect,
}: Readonly<{ item: NavItem; active: boolean; onSelect: (id: PageId) => void }>) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-12 w-full items-center gap-3 rounded-md px-4 text-base",
        active
          ? "bg-surface-secondary font-semibold text-accent"
          : "text-text-muted hover:bg-canvas hover:text-text",
        focus,
      )}
    >
      <item.icon className="size-6 shrink-0" aria-hidden="true" />
      <span className="flex-1 text-left">{item.label}</span>
      {active && <span className="size-2 rounded-full bg-accent" aria-hidden="true" />}
    </button>
  );
}

type Props = {
  page: PageId;
  isAdmin: boolean;
  onSelect: (id: PageId) => void;
  onSignOut: () => void;
};

// Persistent navigation. Lives in WorkspaceShell, so it never re-renders per page.
export function Sidebar({ page, isAdmin, onSelect, onSignOut }: Readonly<Props>) {
  const { displayName, email, level } = useProfile();
  return (
    <div className="flex h-full flex-col gap-6 px-4 py-6">
      <div className="px-2">
        <Brand />
      </div>
      <nav aria-label="Main" className="flex flex-col gap-2">
        <p className="px-4 text-xs font-semibold tracking-label text-text-muted uppercase">
          Your repair workspace
        </p>
        {MAIN_NAV.map((item) => (
          <NavButton key={item.id} item={item} active={page === item.id} onSelect={onSelect} />
        ))}
        {isAdmin && <NavButton item={ADMIN_NAV} active={page === "admin"} onSelect={onSelect} />}
      </nav>

      <div className="mt-auto flex flex-col gap-4">
        <section className="flex flex-col gap-2 rounded-lg bg-surface-secondary p-4">
          <Lightning className="size-6 text-accent" aria-hidden="true" />
          <h2 className="text-base font-semibold">A little practice.</h2>
          <p className="text-sm text-text-muted">
            A few minutes in a simulation builds real repair confidence.
          </p>
          <button
            type="button"
            onClick={() => onSelect("simulations")}
            className={cn("self-start rounded-md text-sm font-semibold text-accent hover:text-accent-hover", focus)}
          >
            Try a simulation
          </button>
        </section>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <NavButton item={SETTINGS_NAV} active={page === "settings"} onSelect={onSelect} />
          <div className="flex items-center gap-3 px-2">
            <Avatar initials={initialsOf(displayName, email)} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{displayName ?? email}</p>
              <p className="text-xs text-text-muted">{levelName(level)}</p>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              aria-label="Log out"
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-canvas hover:text-text",
                focus,
              )}
            >
              <SignOut className="size-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
