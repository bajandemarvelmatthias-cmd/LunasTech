import type { ReactNode } from "react";
import { ArrowRight, ChartBar, CheckCircle, Lightning, Wrench } from "@phosphor-icons/react";
import { useAuth } from "@/features/auth/AuthProvider";
import { StatCard } from "@/features/overview/parts";
import { Button } from "@/components/ui/Button";
import { useLoad } from "@/lib/useLoad";
import { fetchProgress } from "./api";

const eyebrow = "text-sm font-semibold uppercase tracking-widest text-accent";

function Section({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-semibold">{title}</h2>
      <ul className="divide-y divide-border">{children}</ul>
    </section>
  );
}

function Row({ label, note }: Readonly<{ label: string; note: string }>) {
  return (
    <li className="flex min-h-12 items-center justify-between gap-4 py-2">
      <span className="text-base">{label}</span>
      <span className="shrink-0 text-sm text-text-muted">{note}</span>
    </li>
  );
}

// Learning journey panel. The bar shows guides completed out of guides started,
// both read from the user's own rows. It does not show distance to the next
// level: those thresholds live only in the database (decision-log.md #4, #11).
function JourneyPanel({
  started,
  completed,
  onOpenGuides,
}: Readonly<{ started: number; completed: number; onOpenGuides: () => void }>) {
  const empty = started === 0;
  const percent = empty ? 0 : Math.round((completed / started) * 100);
  const guideWord = started === 1 ? "guide" : "guides";
  const summary = empty
    ? "Finish a guide to unlock its simulation. Practice is how confidence grows."
    : `${completed} of ${started} ${guideWord} completed. Practice is how confidence grows.`;
  return (
    <section className="flex flex-col items-start gap-6 rounded-lg border border-border bg-accent-soft p-8">
      <Lightning className="size-6 text-accent" aria-hidden="true" />
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">
          {empty ? "Your learning journey starts now." : "Your learning journey."}
        </h2>
        <p className="text-base text-text-muted">{summary}</p>
      </div>
      <progress
        aria-label="Guides completed"
        value={percent}
        max={100}
        className="h-2 w-full appearance-none overflow-hidden rounded-md bg-surface [&::-moz-progress-bar]:bg-accent [&::-webkit-progress-bar]:bg-surface [&::-webkit-progress-value]:rounded-md [&::-webkit-progress-value]:bg-accent"
      />
      <Button onClick={onOpenGuides} className="flex w-auto items-center gap-2">
        Keep practicing <ArrowRight className="size-6" aria-hidden="true" />
      </Button>
    </section>
  );
}

// Heading, three numbers, the learning journey panel, then the guides and
// simulations the user has touched. Nothing is calculated here; the level and
// results come from the database.
export function ProgressScreen({ onOpenGuides }: Readonly<{ onOpenGuides: () => void }>) {
  const { session } = useAuth();
  const userId = session?.user.id ?? "";
  const { data, loading, error, retry } = useLoad(() => fetchProgress(userId), [userId]);

  if (loading) return <p className="text-base text-text-muted">Loading</p>;

  if (error || !data) {
    return (
      <div className="flex flex-col gap-4">
        <p role="alert" className="text-sm text-danger">
          Can't load your progress. Check your connection and try again.
        </p>
        <Button onClick={retry}>Try again</Button>
      </div>
    );
  }

  const completed = data.guides.filter((g) => g.completed).length;
  const passed = data.simulations.filter((s) => s.passed).length;

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col gap-2">
        <span className={eyebrow}>Learn. Diagnose. Repair.</span>
        <h1 className="text-lg font-semibold">Every step is progress.</h1>
        <p className="text-base text-text-muted">
          Keep learning. Your next repair starts with what you know.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard stacked icon={CheckCircle} label="Simulations passed" value={passed} />
        <StatCard stacked icon={Wrench} label="Guides completed" value={completed} />
        <StatCard stacked icon={ChartBar} label="Learning level" value={data.level} />
      </section>

      <JourneyPanel
        started={data.guides.length}
        completed={completed}
        onOpenGuides={onOpenGuides}
      />

      {data.guides.length > 0 && (
        <Section title="Guides">
          {data.guides.map((g) => (
            <Row
              key={g.guideId}
              label={g.title}
              note={g.completed ? "Completed" : `Step ${g.lastStep}`}
            />
          ))}
        </Section>
      )}
      {data.simulations.length > 0 && (
        <Section title="Simulations">
          {data.simulations.map((s) => (
            <Row key={s.simulationId} label={s.title} note={s.passed ? "Passed" : "Not passed"} />
          ))}
        </Section>
      )}
    </div>
  );
}
