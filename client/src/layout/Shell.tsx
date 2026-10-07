import type { ReactNode } from "react";
import type { Icon } from "@phosphor-icons/react";
import { Wrench } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export type NavTab = { id: string; label: string; icon: Icon };
type Nav = { tabs: NavTab[]; active: string; onChange: (id: string) => void };

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

// One tab button, drawn two ways: a row in the left sidebar (md and up) or a
// stacked icon and label in the bottom bar (phones).
const TAB_STYLE = {
  side: {
    base: "flex h-12 w-full items-center gap-3 rounded-md px-4 text-base font-semibold",
    active: "bg-accent-soft text-accent",
    idle: "text-text-muted hover:text-text",
  },
  bottom: {
    base: "flex flex-col items-center justify-center gap-1 text-sm font-semibold",
    active: "text-accent",
    idle: "text-text-muted",
  },
} as const;

function TabButton({
  tab,
  nav,
  variant,
}: Readonly<{ tab: NavTab; nav: Nav; variant: keyof typeof TAB_STYLE }>) {
  const style = TAB_STYLE[variant];
  const active = tab.id === nav.active;
  return (
    <button
      type="button"
      onClick={() => nav.onChange(tab.id)}
      aria-current={active ? "page" : undefined}
      className={cn(style.base, active ? style.active : style.idle, focus)}
    >
      <tab.icon className="size-6" aria-hidden="true" />
      {tab.label}
    </button>
  );
}

// Layout shell. Header and sidebar sizes are fixed (--size-header, --size-sidebar)
// and never change between screens. Only the content area changes.
// `account` is the top-right slot (the profile button).
// `workspace` names the area in the sidebar and breadcrumb.
// `nav` (signed in only): bottom tab bar on phones, left sidebar from md up
// (decision-log.md #17). Both render from the same tab list.
// `wide` gives dashboard pages room; other screens keep the narrow column.
// `sidebarFooter` sits at the bottom of the sidebar (md and up).
export function Shell({
  account,
  nav,
  workspace,
  wide,
  sidebarFooter,
  children,
}: Readonly<{
  account?: ReactNode;
  nav?: Nav;
  workspace?: string;
  wide?: boolean;
  sidebarFooter?: ReactNode;
  children: ReactNode;
}>) {
  const activeLabel = nav?.tabs.find((t) => t.id === nav.active)?.label;
  return (
    <div className={cn("min-h-dvh", nav && "md:grid md:grid-cols-[var(--size-sidebar)_1fr]")}>
      {nav && (
        <aside className="sticky top-0 hidden h-dvh flex-col gap-2 border-r border-border bg-surface p-4 md:flex">
          <span className="flex h-12 items-center gap-2 px-4 text-base font-semibold">
            <Wrench className="size-6 text-accent" aria-hidden="true" />
            LunasTech
          </span>
          <nav aria-label="Main" className="flex flex-col gap-2">
            {nav.tabs.map((tab) => (
              <TabButton key={tab.id} tab={tab} nav={nav} variant="side" />
            ))}
          </nav>
          {sidebarFooter && <div className="mt-auto">{sidebarFooter}</div>}
        </aside>
      )}
      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="flex h-(--size-header) shrink-0 items-center justify-between border-b border-border px-4 md:px-8">
          <span className="text-base font-semibold md:hidden">LunasTech</span>
          {nav && workspace && (
            <span className="hidden text-base text-text-muted md:block">
              {workspace} / <span className="font-semibold text-text">{activeLabel}</span>
            </span>
          )}
          {account}
        </header>
        <main
          className={cn(
            "mx-auto flex w-full flex-1 flex-col px-4 pt-8 md:px-8 md:pt-12",
            wide ? "max-w-6xl" : "max-w-sm md:max-w-md",
            nav ? "pb-(--size-tab-bar) md:pb-12" : "",
          )}
        >
          {children}
        </main>
      </div>
      {nav && (
        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-10 grid h-(--size-tab-bar) auto-cols-fr grid-flow-col border-t border-border bg-surface md:hidden"
        >
          {nav.tabs.map((tab) => (
            <TabButton key={tab.id} tab={tab} nav={nav} variant="bottom" />
          ))}
        </nav>
      )}
    </div>
  );
}
