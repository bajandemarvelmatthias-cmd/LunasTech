import { ArrowRight, ChartBar, CheckCircle, DeviceMobile, DeviceTablet, GameController, Laptop, Play, Wrench } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { useAuth } from "@/features/auth/AuthProvider";
import { fetchDevices } from "@/features/guides/api";
import { fetchProgress } from "@/features/progress/api";
import { useLoad } from "@/lib/useLoad";
import { LoadError, PageHeader, StatCard } from "./parts";

function deviceIcon(name: string): Icon {
  const n = name.toLowerCase();
  if (/laptop|computer|desktop/.test(n)) return Laptop;
  if (n.includes("tablet")) return DeviceTablet;
  if (n.includes("console")) return GameController;
  return DeviceMobile;
}

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

// Customer landing page. Numbers come from the progress the database already
// keeps; nothing here needs input except choosing where to go next.
export function CustomerOverview({ onOpenGuides }: Readonly<{ onOpenGuides: () => void }>) {
  const { session } = useAuth();
  const userId = session?.user.id ?? "";
  const name = session?.user.email?.split("@")[0] ?? "";
  const progress = useLoad(() => fetchProgress(userId), [userId]);
  const devices = useLoad(fetchDevices, []);

  if (progress.error || devices.error) {
    return <LoadError onRetry={() => { progress.retry(); devices.retry(); }} />;
  }
  const p = progress.data;
  const done = p ? p.simulations.filter((s) => s.passed).length : "-";

  return (
    <div className="flex flex-col gap-8 pb-12">
      <PageHeader title={name ? `Welcome, ${name}` : "Welcome"} />
      <section className="grid overflow-hidden rounded-lg bg-linear-to-br from-brand-light to-brand text-white md:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col items-start gap-6 p-8">
          <h2 className="text-xl font-semibold">Don't just replace it. Learn to repair it.</h2>
          <p className="text-base text-brand-text">Follow a guide, then practice the repair in a safe simulation.</p>
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" onClick={onOpenGuides} className={`flex h-(--size-control) items-center gap-2 rounded-md bg-white px-4 text-base font-semibold text-brand ${focus}`}>
              Explore repair guides <ArrowRight className="size-6" aria-hidden="true" />
            </button>
            <button type="button" onClick={onOpenGuides} className={`flex h-(--size-control) items-center gap-2 rounded-md px-2 text-base font-semibold ${focus}`}>
              <Play className="size-6" aria-hidden="true" /> Try a simulation
            </button>
          </div>
        </div>
        <div className="hidden items-center justify-center bg-white/10 md:flex">
          <Wrench className="size-24 text-brand-text" aria-hidden="true" />
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={CheckCircle} label="Simulations passed" value={done} />
        <StatCard icon={ChartBar} label="Learning level" value={p ? p.level : "-"} />
        <StatCard icon={Wrench} label="Guides started" value={p ? p.guides.length : "-"} />
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">What are you working on?</h2>
        {devices.data?.length === 0 ? (
          <p className="text-base text-text-muted">No devices yet.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {devices.data?.map((d) => {
              const I = deviceIcon(d.name);
              return (
                <li key={d.id}>
                  <button type="button" onClick={onOpenGuides} className={`flex h-20 w-full items-center gap-4 rounded-md border border-border bg-surface px-6 text-left text-base font-semibold shadow-card ${focus}`}>
                    <I className="size-6 text-accent" aria-hidden="true" />
                    <span className="flex-1">{d.name}</span>
                    <ArrowRight className="size-6 text-text-muted" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
