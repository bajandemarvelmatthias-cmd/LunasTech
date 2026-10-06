import type { ReactNode } from "react";
import { BookOpen, Cube, Pulse, Wrench } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export type AuthTab = "login" | "signup";

const FEATURES = [
  { icon: BookOpen, title: "Step-by-step guides", note: "Clear instructions for every skill level" },
  { icon: Cube, title: "Safe simulations", note: "Practice before picking up a tool" },
  { icon: Pulse, title: "Smart diagnosis", note: "Start with symptoms, not guesses" },
] as const;

const TABS: { id: AuthTab; label: string }[] = [
  { id: "login", label: "Log in" },
  { id: "signup", label: "Sign up" },
];

// Split screen before sign-in: brand panel on the left (large screens only),
// form on the right. `tab` and `onTab` add the Log in / Sign up switch.
export function AuthLayout({
  tab,
  onTab,
  children,
}: Readonly<{ tab?: AuthTab; onTab?: (tab: AuthTab) => void; children: ReactNode }>) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="hidden flex-col justify-between bg-linear-to-br from-brand-light to-brand p-12 text-white lg:flex">
        <span className="flex items-center gap-2 text-lg font-semibold">
          <Wrench className="size-6" aria-hidden="true" />
          LunasTech
        </span>
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-semibold">
            Repair confidence starts with <span className="text-brand-text">curiosity</span>.
          </h2>
          <ul className="grid max-w-md gap-4">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex items-center gap-4 rounded-md border border-white/20 p-4">
                <f.icon className="size-6 shrink-0" aria-hidden="true" />
                <span className="flex flex-col">
                  <span className="text-base font-semibold">{f.title}</span>
                  <span className="text-sm text-brand-text">{f.note}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <span className="text-sm text-brand-text">Built for curious minds and a more repairable world.</span>
      </section>
      <section className="flex flex-col">
        <header className="flex h-(--size-header) items-center px-4 lg:hidden">
          <span className="text-base font-semibold">LunasTech</span>
        </header>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-4 py-12">
          {tab && onTab && (
            <div role="tablist" className="grid grid-cols-2 border-b border-border">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => onTab(t.id)}
                  className={cn(
                    "-mb-px h-12 border-b-2 text-base font-semibold focus-visible:outline-2 focus-visible:outline-accent",
                    tab === t.id ? "border-accent text-text" : "border-transparent text-text-muted",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
          {children}
        </div>
      </section>
    </div>
  );
}
