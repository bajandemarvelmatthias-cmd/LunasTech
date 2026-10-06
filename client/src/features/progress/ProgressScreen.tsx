import type { ReactNode } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { useLoad } from "@/lib/useLoad";
import { fetchProgress } from "./api";

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

// Learning level first, then guides and simulations the user has touched.
// The tab already says "Progress", so the screen has no title of its own.
export function ProgressScreen() {
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

  const empty = data.guides.length === 0 && data.simulations.length === 0;

  return (
    <div className="flex flex-col gap-6 pb-12">
      <h1 className="text-lg font-semibold">Learning level {data.level}</h1>
      {empty && <p className="text-base text-text-muted">Nothing yet.</p>}
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
