import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { LoadError, Loading } from "@/components/ui/Status";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/features/auth/AuthProvider";
import { levelName } from "@/features/profile/levels";
import { useLoad } from "@/lib/useLoad";
import { fetchProgress } from "./api";

function Figure({ value, label }: Readonly<{ value: string; label: string }>) {
  return (
    <Card className="flex flex-col gap-1">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-sm text-text-muted">{label}</p>
    </Card>
  );
}

function Section({ title, empty, children }: Readonly<{ title: string; empty: string; children: ReactNode[] }>) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-base font-semibold">{title}</h2>
      <Card className="py-2">
        {children.length === 0 ? (
          <p className="py-4 text-sm text-text-muted">{empty}</p>
        ) : (
          <ul className="divide-y divide-border">{children}</ul>
        )}
      </Card>
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

// Learning level and counts first, then simulation records and guide history.
// Points are not shown: the database owns the scoring rules (decision-log.md #11).
export function ProgressScreen() {
  const { session } = useAuth();
  const userId = session?.user.id ?? "";
  const { data, loading, error, retry } = useLoad(() => fetchProgress(userId), [userId]);

  if (loading) return <Loading />;
  if (error || !data) {
    return <LoadError message="Can't load your progress. Check your connection and try again." onRetry={retry} />;
  }

  const completedGuides = data.guides.filter((g) => g.completed).length;

  return (
    <>
      <PageHeader title="My progress" subtitle="Your learning level, simulation records and guide history." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Figure value={levelName(data.level)} label={`Level ${data.level}`} />
        <Figure value={String(data.simulations.length)} label="simulations completed" />
        <Figure value={String(completedGuides)} label="guides completed" />
      </div>
      <Section title="Simulation records" empty="No attempts yet.">
        {data.simulations.map((s) => (
          <Row key={s.simulationId} label={s.title} note={s.passed ? "Passed" : "Not passed"} />
        ))}
      </Section>
      <Section title="Guide history" empty="No guides started yet.">
        {data.guides.map((g) => (
          <Row key={g.guideId} label={g.title} note={g.completed ? "Completed" : `Step ${g.lastStep}`} />
        ))}
      </Section>
    </>
  );
}
