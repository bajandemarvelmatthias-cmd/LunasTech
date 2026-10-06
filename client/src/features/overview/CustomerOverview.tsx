import { ArrowRight, BookOpen, ChartBar, CheckCircle, DeviceMobile, DeviceTablet, GameController, Laptop, Pulse, Wrench } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { useAuth } from "@/features/auth/AuthProvider";
import { fetchDevices } from "@/features/guides/api";
import type { GuidesStart } from "@/features/guides/GuidesFlow";
import { KIND_LABEL } from "@/features/guides/types";
import { fetchProgress } from "@/features/progress/api";
import { useLoad } from "@/lib/useLoad";
import { fetchPublishedGuides } from "./api";
import { LoadError, StatCard } from "./parts";

function deviceIcon(name: string): Icon {
  const n = name.toLowerCase();
  if (/laptop|computer|desktop/.test(n)) return Laptop;
  if (n.includes("tablet")) return DeviceTablet;
  if (n.includes("console")) return GameController;
  return DeviceMobile;
}

// "3 guides", "1 guide", or nothing while the counts are still loading.
function guideCountLabel(count: number | null): string {
  if (count === null) return "";
  return `${count} ${count === 1 ? "guide" : "guides"}`;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  return hour < 18 ? "Good afternoon" : "Good evening";
}

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const eyebrow = "text-sm font-semibold uppercase tracking-widest text-accent";
const card = "rounded-md border border-border bg-surface shadow-card";

// Customer landing page. Every number and card comes from the database;
// nothing here needs input except choosing where to go next.
// `onOpen()` opens Repair Guides at the device list; with a start it goes straight to
// that device's symptoms or to one guide.
export function CustomerOverview({ onOpen }: Readonly<{ onOpen: (start?: GuidesStart) => void }>) {
  const { session } = useAuth();
  const userId = session?.user.id ?? "";
  const name = session?.user.email?.split("@")[0] ?? "";
  const progress = useLoad(() => fetchProgress(userId), [userId]);
  const devices = useLoad(fetchDevices, []);
  const guides = useLoad(fetchPublishedGuides, []);

  if (progress.error || devices.error || guides.error) {
    return <LoadError onRetry={() => { progress.retry(); devices.retry(); guides.retry(); }} />;
  }
  const p = progress.data;
  const g = guides.data;

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col gap-2">
        <span className={eyebrow}>Learn. Diagnose. Repair.</span>
        <h1 className="text-lg font-semibold">{name ? `${greeting()}, ${name}` : greeting()}</h1>
        <p className="text-base text-text-muted">A little curiosity is all it takes. What will you fix today?</p>
      </div>

      <section className="grid overflow-hidden rounded-lg border border-border bg-accent-soft md:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col items-start gap-6 p-8">
          <span className={eyebrow}>Built for hands-on learners</span>
          <h2 className="text-xl font-semibold">
            Don't just replace it. Learn to <span className="text-accent">repair it.</span>
          </h2>
          <p className="max-w-md text-base text-text-muted">
            Explore step-by-step guides, practice in a safe simulation, and make smarter decisions
            about your devices.
          </p>
          <button
            type="button"
            onClick={() => onOpen()}
            className={`flex h-(--size-control) items-center gap-2 rounded-md bg-accent px-4 text-base font-semibold text-accent-text hover:bg-accent-hover ${focus}`}
          >
            Explore repair guides <ArrowRight className="size-6" aria-hidden="true" />
          </button>
        </div>
        <div className="relative hidden min-h-64 items-end overflow-hidden bg-linear-to-br from-brand-light to-brand p-6 md:flex">
          <Wrench className="absolute -top-6 -right-6 size-48 text-white/10" aria-hidden="true" />
          <div className="relative flex w-full items-center gap-4 rounded-md border border-white/20 bg-white/10 p-4 text-white">
            <Wrench className="size-6 shrink-0" aria-hidden="true" />
            <span className="flex flex-col">
              <span className="text-base font-semibold">Small fixes. Big impact.</span>
              <span className="text-sm text-brand-text">Better for your device. Better for the planet.</span>
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="Repair guides" value={g ? g.length : "-"} />
        <StatCard icon={CheckCircle} label="Simulations passed" value={p ? p.simulations.filter((s) => s.passed).length : "-"} />
        <StatCard icon={Wrench} label="Guides completed" value={p ? p.guides.filter((x) => x.completed).length : "-"} />
        <StatCard icon={ChartBar} label="Learning level" value={p ? p.level : "-"} />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold">What are you working on?</h2>
            <p className="text-sm text-text-muted">Pick a device and find your starting point.</p>
          </div>
          <button type="button" onClick={() => onOpen()} className={`flex items-center gap-2 rounded-md text-sm font-semibold text-accent hover:text-accent-hover ${focus}`}>
            Browse all devices <ArrowRight className="size-6" aria-hidden="true" />
          </button>
        </div>
        {devices.data?.length === 0 ? (
          <p className="text-base text-text-muted">No devices yet.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {devices.data?.map((d) => {
              const I = deviceIcon(d.name);
              const n = g ? g.filter((x) => x.device.id === d.id).length : null;
              return (
                <li key={d.id}>
                  <button type="button" onClick={() => onOpen({ name: "symptoms", device: d })} className={`${card} flex w-full items-center gap-4 p-6 text-left hover:border-accent ${focus}`}>
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
                      <I className="size-6" aria-hidden="true" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-base font-semibold">{d.name}</span>
                      <span className="text-sm text-text-muted">{guideCountLabel(n)}</span>
                    </span>
                    <ArrowRight className="size-6 shrink-0 text-text-muted" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {g && g.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold">A good place to start</h2>
              <p className="text-sm text-text-muted">The latest guides, ready to follow.</p>
            </div>
            <button type="button" onClick={() => onOpen()} className={`flex items-center gap-2 rounded-md text-sm font-semibold text-accent hover:text-accent-hover ${focus}`}>
              View all guides <ArrowRight className="size-6" aria-hidden="true" />
            </button>
          </div>
          <ul className="grid gap-4 md:grid-cols-3">
            {g.slice(0, 3).map((x) => {
              const I = deviceIcon(x.device.name);
              return (
                <li key={x.id}>
                  <button type="button" onClick={() => onOpen({ name: "guide", guide: { id: x.id, title: x.title, kind: x.kind } })} className={`${card} flex w-full flex-col overflow-hidden text-left hover:border-accent ${focus}`}>
                    <span className="relative flex h-32 items-center justify-center bg-accent-soft text-accent">
                      <I className="size-12" aria-hidden="true" />
                      <span className="absolute bottom-4 left-4 rounded-md bg-surface px-2 py-1 text-sm font-semibold">{KIND_LABEL[x.kind]}</span>
                    </span>
                    <span className="flex flex-col gap-1 p-6">
                      <span className="text-sm text-text-muted">{x.device.name}</span>
                      <span className="flex items-center justify-between gap-4 text-base font-semibold">
                        {x.title}
                        <ArrowRight className="size-6 shrink-0 text-text-muted" aria-hidden="true" />
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="flex flex-wrap items-center gap-4 rounded-md border border-border bg-accent-soft p-6">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-surface text-accent">
          <Pulse className="size-6" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-base font-semibold">Not sure what's wrong? Start with a diagnosis.</span>
          <span className="text-sm text-text-muted">Pick your device and symptom. We'll find the matching guides.</span>
        </span>
        <button type="button" onClick={() => onOpen()} className={`flex h-(--size-control) items-center gap-2 rounded-md border border-border bg-surface px-4 text-base font-semibold text-accent ${focus}`}>
          Diagnose my device <ArrowRight className="size-6" aria-hidden="true" />
        </button>
      </section>
    </div>
  );
}
