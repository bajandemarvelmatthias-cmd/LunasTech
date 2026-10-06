import type { ReactNode } from "react";
import { ArrowRight, BookOpen, Cube, Pulse, Wrench } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export type AuthTab = "login" | "signup";
export type AuthHeading = { eyebrow: string; title: string; subtitle: string };

const FEATURES: { icon: Icon; title: string; note: string; featured?: boolean }[] = [
  { icon: BookOpen, title: "Step-by-step guides", note: "Clear instructions for every skill level", featured: true },
  { icon: Cube, title: "Safe simulations", note: "Practice before picking up a tool" },
  { icon: Pulse, title: "Smart diagnosis", note: "Start with symptoms, not guesses" },
];

const TABS: { id: AuthTab; label: string }[] = [
  { id: "login", label: "Log in" },
  { id: "signup", label: "Sign up" },
];

const eyebrow = "text-sm font-semibold uppercase tracking-widest";

function Brand({ dark }: Readonly<{ dark?: boolean }>) {
  return (
    <span className="flex items-center gap-2 text-lg font-semibold">
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-md",
          dark ? "bg-accent-soft text-accent" : "bg-accent text-accent-text",
        )}
      >
        <Wrench className="size-6" aria-hidden="true" />
      </span>
      LunasTech
    </span>
  );
}

// Split screen before sign-in. Left: brand story (md and up). Right: the form
// with an optional heading block and the Log in / Sign up switch.
export function AuthLayout({
  heading,
  tab,
  onTab,
  children,
}: Readonly<{
  heading?: AuthHeading;
  tab?: AuthTab;
  onTab?: (tab: AuthTab) => void;
  children: ReactNode;
}>) {
  return (
    <div className="grid min-h-dvh md:grid-cols-[1.08fr_0.92fr]">
      <section
        aria-label="About LunasTech"
        className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-brand-light to-brand p-12 text-white md:flex"
      >
        <div aria-hidden="true" className="absolute -right-44 -bottom-48 size-96 rounded-full border border-white/20" />
        <div className="relative">
          <Brand dark />
        </div>
        <div className="relative flex max-w-xl flex-col gap-6">
          <span className={cn(eyebrow, "text-brand-text")}>Learn it. Fix it. Keep it.</span>
          <h1 className="text-xl font-semibold">
            Repair confidence starts with <span className="text-brand-text">curiosity.</span>
          </h1>
          <p className="text-base text-brand-text">
            Explore guided repairs, practice safely, and make smarter decisions about the devices you
            use every day.
          </p>
        </div>
        <div className="relative flex flex-col gap-6">
          <ul className="grid max-w-2xl gap-3 lg:grid-cols-2">
            {FEATURES.map((f) => (
              <li
                key={f.title}
                className={cn(
                  "flex items-center gap-4 rounded-md border border-white/20 bg-white/10 p-4",
                  f.featured && "lg:col-span-2",
                )}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white/10 text-brand-text">
                  <f.icon className="size-6" aria-hidden="true" />
                </span>
                <span className="flex flex-col">
                  <span className="text-base font-semibold">{f.title}</span>
                  <span className="text-sm text-brand-text">{f.note}</span>
                </span>
                {f.featured && <ArrowRight className="ml-auto size-6 text-brand-text" aria-hidden="true" />}
              </li>
            ))}
          </ul>
          <p className="text-sm text-brand-text">Built for curious minds and a more repairable world.</p>
        </div>
      </section>

      <section className="flex flex-col px-4 py-8 md:px-12">
        <div className="md:hidden">
          <Brand />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 py-8">
          {heading && (
            <div className="flex flex-col gap-2">
              <span className={cn(eyebrow, "text-accent")}>{heading.eyebrow}</span>
              <h2 className="text-lg font-semibold">{heading.title}</h2>
              <p className="text-base text-text-muted">{heading.subtitle}</p>
            </div>
          )}
          {tab && onTab && (
            <div role="tablist" aria-label="Account access" className="grid grid-cols-2 border-b border-border">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => onTab(t.id)}
                  className={cn(
                    "-mb-px h-12 border-b-2 text-base font-semibold focus-visible:outline-2 focus-visible:outline-accent",
                    tab === t.id ? "border-accent text-accent" : "border-transparent text-text-muted",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
          {children}
        </div>
        <p className="mx-auto max-w-md text-center text-sm text-text-muted">
          By continuing, you agree to use LunasTech for educational purposes and follow all repair
          safety guidance.
        </p>
      </section>
    </div>
  );
}
