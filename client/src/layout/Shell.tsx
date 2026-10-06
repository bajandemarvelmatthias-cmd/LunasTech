import type { ReactNode } from "react";
import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export type NavTab = { id: string; label: string; icon: Icon };
type Nav = { tabs: NavTab[]; active: string; onChange: (id: string) => void };

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

// One tab button, drawn two ways: a pill in the top bar (md and up) or a
// stacked icon and label in the bottom bar (phones).
const TAB_STYLE = {
  top: {
    base: "flex h-10 items-center gap-2 rounded-md px-4 text-base font-semibold",
    active: "bg-surface-secondary text-accent",
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

// Layout shell. Header size and position are fixed (--size-header) and never
// change between screens. Only the content area changes.
// `account` is the top-right slot (log out, later profile).
// `nav` (signed in only): bottom tab bar on phones, top bar from md up
// (decision-log.md #6). Both render from the same tab list.
export function Shell({
  account,
  nav,
  children,
}: Readonly<{
  account?: ReactNode;
  nav?: Nav;
  children: ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-(--size-header) shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-8">
          <span className="text-base font-semibold">LunasTech</span>
          {nav && (
            <nav aria-label="Main" className="hidden items-center gap-2 md:flex">
              {nav.tabs.map((tab) => (
                <TabButton key={tab.id} tab={tab} nav={nav} variant="top" />
              ))}
            </nav>
          )}
        </div>
        {account}
      </header>
      <main
        className={cn(
          "mx-auto flex w-full max-w-sm flex-1 flex-col px-4 pt-12 md:pt-24",
          nav && "pb-(--size-tab-bar) md:pb-0",
        )}
      >
        {children}
      </main>
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
