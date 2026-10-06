import { PageHeader } from "@/components/ui/PageHeader";
import { LoadError, Loading } from "@/components/ui/Status";
import { useAuth } from "@/features/auth/AuthProvider";
import { fetchProgress } from "@/features/progress/api";
import { useLoad } from "@/lib/useLoad";
import { cn } from "@/lib/utils";
import { fetchAllSimulations } from "./api";
import type { Simulation } from "./types";

// Every published simulation. Users see one only when its guide is published too (row level security).
export function SimulationsScreen({ onOpen }: Readonly<{ onOpen: (simulation: Simulation) => void }>) {
  const { session } = useAuth();
  const userId = session?.user.id ?? "";
  const { data, loading, error, retry } = useLoad(
    async () => {
      const [simulations, progress] = await Promise.all([fetchAllSimulations(), fetchProgress(userId)]);
      return { simulations, passed: new Set(progress.simulations.filter((s) => s.passed).map((s) => s.simulationId)) };
    },
    [userId],
  );

  let body;
  if (loading) body = <Loading />;
  else if (error || !data) {
    body = <LoadError message="Can't load the simulations. Check your connection and try again." onRetry={retry} />;
  } else if (data.simulations.length === 0) body = <p className="text-base text-text-muted">No simulations yet.</p>;
  else {
    body = (
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.simulations.map((s) => (
          <li key={s.id} className="flex flex-col">
            <button
              type="button"
              onClick={() => onOpen({ id: s.id, title: s.title })}
              className={cn(
                "flex min-h-32 flex-1 flex-col items-start gap-2 rounded-lg border border-border bg-surface p-6 text-left hover:bg-canvas",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              )}
            >
              {data.passed.has(s.id) && (
                <span className="rounded-full bg-surface-secondary px-3 py-1 text-xs font-semibold text-accent">
                  Passed
                </span>
              )}
              <span className="text-base font-semibold">{s.title}</span>
              <span className="text-sm text-text-muted">{s.guideTitle}</span>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <>
      <PageHeader title="Simulations" subtitle="Practice in a safe simulation before you pick up a tool." />
      {body}
    </>
  );
}
