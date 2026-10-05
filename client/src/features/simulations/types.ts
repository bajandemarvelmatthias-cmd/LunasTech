// Hand-written to match supabase/migrations/20261005000000_initial_schema.sql.
// correct_option and feedback are hidden from signed-in users (column
// privileges), so they only arrive through submit_answer().
export type Simulation = { id: string; title: string };

// options is jsonb in the database. Plain text strings are assumed (open-questions.md #16).
export type SimulationStep = { id: string; position: number; prompt: string; options: string[] };

export type StepResult = {
  simulation_step_id: string;
  points: number | null;
  resolved_at: string | null;
};

// Shape returned by submit_answer().
export type SubmitResult = {
  correct: boolean;
  resolved: boolean;
  points: number | null;
  feedback: string;
  correct_option: number | null;
  attempt_completed: boolean;
  passed: boolean | null;
  learning_level: number | null;
};
