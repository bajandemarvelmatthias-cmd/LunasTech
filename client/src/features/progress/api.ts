import { supabase } from "@/lib/supabase";

export type GuideRow = {
  guideId: string;
  title: string;
  lastStep: number;
  completed: boolean;
};

export type SimulationRow = { simulationId: string; title: string; passed: boolean };

export type ProgressData = {
  level: number;
  guides: GuideRow[];
  simulations: SimulationRow[];
};

type GuideProgressQuery = {
  guide_id: string;
  last_step_position: number;
  completed_at: string | null;
  guides: { title: string } | null;
};

type AttemptQuery = {
  simulation_id: string;
  passed: boolean | null;
  simulations: { title: string } | null;
};

// Everything here is read-only. The learning level is calculated by the
// database (recalculate_learning_level); the app only displays it.
// Queries filter by user id because admins can read every row.
export async function fetchProgress(userId: string): Promise<ProgressData> {
  const [profile, guideRows, attemptRows] = await Promise.all([
    supabase.from("profiles").select("learning_level").eq("id", userId).single(),
    supabase
      .from("guide_progress")
      .select("guide_id, last_step_position, completed_at, guides(title)")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("simulation_attempts")
      .select("simulation_id, passed, simulations(title)")
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false }),
  ]);
  if (profile.error) throw profile.error;
  if (guideRows.error) throw guideRows.error;
  if (attemptRows.error) throw attemptRows.error;

  const guides = (guideRows.data as unknown as GuideProgressQuery[]).map((r) => ({
    guideId: r.guide_id,
    title: r.guides?.title ?? "Guide",
    lastStep: r.last_step_position,
    completed: r.completed_at !== null,
  }));

  // One row per simulation: passed if any finished attempt passed.
  const bySimulation = new Map<string, SimulationRow>();
  for (const a of attemptRows.data as unknown as AttemptQuery[]) {
    const existing = bySimulation.get(a.simulation_id);
    const passed = a.passed === true;
    if (existing) existing.passed ||= passed;
    else {
      bySimulation.set(a.simulation_id, {
        simulationId: a.simulation_id,
        title: a.simulations?.title ?? "Simulation",
        passed,
      });
    }
  }

  return {
    level: profile.data.learning_level as number,
    guides,
    simulations: [...bySimulation.values()],
  };
}
