// Hand-written to match supabase/migrations/20261005000000_initial_schema.sql.
// Replace with generated types when they are set up (decision-log.md #2).
export type DeviceType = { id: string; name: string };
export type Symptom = { id: string; name: string };
export type GuideKind = "small_fix" | "major_repair";
export type GuideDifficulty = "easy" | "moderate" | "hard";
// The picture, difficulty, time and step count are optional so a guide without
// them still shows (admins fill them in; older guides have none).
export type Guide = {
  id: string;
  title: string;
  kind: GuideKind;
  difficulty?: GuideDifficulty | null;
  estimated_minutes?: number | null;
  cover_image_path?: string | null;
  description?: string | null;
  step_count?: number;
};
export type GuideStep = {
  id: string;
  position: number;
  title: string;
  instruction: string;
  image_path: string | null;
};
export type GuideProgress = { last_step_position: number; completed_at: string | null };

export const DIFFICULTY_LABEL: Record<GuideDifficulty, string> = {
  easy: "Easy",
  moderate: "Moderate",
  hard: "Hard",
};

export const KIND_LABEL: Record<GuideKind, string> = {
  small_fix: "Small fix",
  major_repair: "Major repair",
};
