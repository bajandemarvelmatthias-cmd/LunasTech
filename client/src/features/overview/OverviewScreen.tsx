import {
  ArrowRight,
  BookmarkSimple,
  BookOpen,
  ChartBar,
  Cube,
  DeviceMobile,
  DeviceTablet,
  Devices,
  Laptop,
  Play,
  Wrench,
  type Icon,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { LoadError, Loading } from "@/components/ui/Status";
import { useAuth } from "@/features/auth/AuthProvider";
import { fetchPublishedGuides } from "@/features/guides/api";
import { GuideGrid } from "@/features/guides/GuideCard";
import type { Guide } from "@/features/guides/types";
import { firstName, useProfile } from "@/features/profile/ProfileProvider";
import { levelName } from "@/features/profile/levels";
import { fetchProgress } from "@/features/progress/api";
import { useSaved } from "@/features/saved/SavedProvider";
import type { PageId } from "@/layout/nav";
import { useLoad } from "@/lib/useLoad";
import { cn } from "@/lib/utils";
import { HeroIllustration } from "./HeroIllustration";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

type Props = {
  onNavigate: (page: PageId, options?: { deviceId?: string; guide?: Guide }) => void;
};

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// Phosphor icon per device type name. Unknown names get the generic Devices icon.
function deviceIcon(name: string): Icon {
  const n = name.toLowerCase();
  if (n.includes("phone")) return DeviceMobile;
  if (n.includes("tablet")) return DeviceTablet;
  if (n.includes("computer") || n.includes("laptop")) return Laptop;
  return Devices;
}

function LinkButton({ children, onClick }: Readonly<{ children: ReactNode; onClick: () => void }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("flex items-center gap-2 rounded-md text-base font-semibold text-accent hover:text-accent-hover", focus)}
    >
      {children}
      <ArrowRight className="size-5" aria-hidden="true" />
    </button>
  );
}

function SectionHeading({
  title,
  subtitle,
  action,
  tag,
}: Readonly<{ title: string; subtitle: string; action: ReactNode; tag?: string }>) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          {tag && (
            <span className="rounded-full bg-surface-secondary px-3 py-1 text-xs font-semibold tracking-label text-accent uppercase">
              {tag}
            </span>
          )}
        </div>
        <p className="text-base text-text-muted">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

type StatProps = {
  icon: Icon;
  tile: string;
  iconColor: string;
  label: string;
  value: string;
  note: string;
  onClick: () => void;
};

function Stat({ icon: StatIcon, tile, iconColor, label, value, note, onClick }: Readonly<StatProps>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 rounded-lg border border-border bg-surface p-6 text-left hover:bg-canvas",
        focus,
      )}
    >
      <span className={cn("flex size-14 shrink-0 items-center justify-center rounded-md", tile)}>
        <StatIcon className={cn("size-6", iconColor)} aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-sm text-text-muted">{label}</span>
        <span className="flex items-baseline gap-2">
          <span className="text-lg font-semibold">{value}</span>
          <span className="truncate text-sm text-text-muted">{note}</span>
        </span>
      </span>
    </button>
  );
}

// Greeting, hero, four counts, device shortcuts and the newest guides.
export function OverviewScreen({ onNavigate }: Readonly<Props>) {
  const { session } = useAuth();
  const userId = session?.user.id ?? "";
  const { displayName } = useProfile();
  const { ids: savedIds } = useSaved();
  const { data, loading, error, retry } = useLoad(
    async () => {
      const [guides, progress] = await Promise.all([fetchPublishedGuides(), fetchProgress(userId)]);
      return { guides, progress };
    },
    [userId],
  );

  const name = firstName(displayName);
  const guides = data?.guides ?? [];
  const devices = new Map<string, { name: string; count: number }>();
  for (const g of guides) {
    if (!g.deviceId) continue;
    const entry = devices.get(g.deviceId) ?? { name: g.device, count: 0 };
    entry.count += 1;
    devices.set(g.deviceId, entry);
  }
  const savedCount = guides.filter((g) => savedIds.has(g.id)).length;
  const stat = (value: number | string | undefined) => (data ? String(value) : "–");

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-label text-text-muted uppercase">Learn. Diagnose. Repair.</p>
          <h1 className="text-display font-semibold">
            {greeting()}
            {name ? `, ${name}` : ""}
            <span className="text-accent">.</span>
          </h1>
          <p className="text-base text-text-muted">A little curiosity is all it takes. What will you fix today?</p>
        </div>
        <span className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-accent">
          <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
          Customer workspace
        </span>
      </header>

      <Card className="grid overflow-hidden bg-surface-secondary p-0 lg:grid-cols-2">
        <div className="flex flex-col items-start gap-6 p-8 md:p-12">
          <span className="flex items-center gap-2 text-xs font-semibold tracking-label text-accent uppercase">
            <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
            Built for hands-on learners
          </span>
          <h2 className="text-display font-semibold">
            Don't just replace it. Learn to <span className="text-accent">repair it.</span>
          </h2>
          <p className="max-w-md text-base text-text-muted">
            Explore step-by-step guides, practice in a safe simulation, and make smarter decisions about your devices.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={() => onNavigate("guides")}
              className={cn(
                "flex h-(--size-control) items-center gap-3 rounded-md bg-accent px-6 text-base font-semibold text-accent-text hover:bg-accent-hover",
                focus,
              )}
            >
              Explore repair guides
              <ArrowRight className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate("simulations")}
              className={cn("flex items-center gap-2 rounded-md text-base font-semibold text-text hover:text-accent", focus)}
            >
              <Play className="size-5" aria-hidden="true" />
              Try a simulation
            </button>
          </div>
        </div>
        <div className="relative hidden min-h-80 lg:block">
          <HeroIllustration />
          <div className="absolute right-6 bottom-6 left-6 flex items-center gap-4 rounded-lg bg-surface-inverse p-4 text-accent-text">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-surface/15">
              <Wrench className="size-6" aria-hidden="true" />
            </span>
            <span className="flex flex-col">
              <span className="text-base font-semibold">Small fixes. Big impact.</span>
              <span className="text-sm">Better for your device. Better for the planet.</span>
            </span>
          </div>
        </div>
      </Card>

      {error && (
        <LoadError message="Can't load your overview. Check your connection and try again." onRetry={retry} />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={BookOpen}
          tile="bg-tile-green"
          iconColor="text-accent"
          label="Repair guides"
          value={stat(guides.length)}
          note="ready to explore"
          onClick={() => onNavigate("guides")}
        />
        <Stat
          icon={Cube}
          tile="bg-tile-blue"
          iconColor="text-tile-blue-icon"
          label="Simulations completed"
          value={stat(data?.progress.simulations.length)}
          note="keep it going"
          onClick={() => onNavigate("simulations")}
        />
        <Stat
          icon={BookmarkSimple}
          tile="bg-tile-amber"
          iconColor="text-tile-amber-icon"
          label="Saved guides"
          value={stat(savedCount)}
          note="in your collection"
          onClick={() => onNavigate("saved")}
        />
        <Stat
          icon={ChartBar}
          tile="bg-tile-violet"
          iconColor="text-tile-violet-icon"
          label="Your learning level"
          value={stat(data ? levelName(data.progress.level) : undefined)}
          note=""
          onClick={() => onNavigate("progress")}
        />
      </div>

      <section className="flex flex-col gap-6">
        <SectionHeading
          title="What are you working on?"
          subtitle="Pick a device and find your starting point."
          action={<LinkButton onClick={() => onNavigate("guides")}>Browse all devices</LinkButton>}
        />
        {loading && <Loading />}
        {data && devices.size === 0 && <p className="text-base text-text-muted">No devices have guides yet.</p>}
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...devices].map(([id, device]) => {
            const DeviceIcon = deviceIcon(device.name);
            return (
              <li key={id} className="flex flex-col">
                <button
                  type="button"
                  onClick={() => onNavigate("guides", { deviceId: id })}
                  className={cn(
                    "flex flex-1 items-center gap-4 rounded-lg border border-border bg-surface p-6 text-left hover:bg-canvas",
                    focus,
                  )}
                >
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-md bg-surface-secondary">
                    <DeviceIcon className="size-6 text-accent" aria-hidden="true" />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-base font-semibold">{device.name}</span>
                    <span className="text-sm text-text-muted">
                      {device.count} {device.count === 1 ? "guide" : "guides"}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeading
          title="A good place to start"
          tag="Newest guides"
          subtitle="Practical repairs. Clear steps. Real confidence."
          action={<LinkButton onClick={() => onNavigate("guides")}>View all guides</LinkButton>}
        />
        {data && guides.length === 0 && <p className="text-base text-text-muted">No guides yet.</p>}
        {guides.length > 0 && (
          <GuideGrid guides={guides.slice(0, 3)} onOpen={(guide) => onNavigate("guides", { guide })} />
        )}
      </section>
    </>
  );
}

