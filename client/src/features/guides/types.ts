// Hand-written to match supabase/migrations/20261005000000_initial_schema.sql.
// Replace with generated types when they are set up (decision-log.md #2).
export type DeviceType = { id: string; name: string };
export type Symptom = { id: string; name: string };
export type GuideKind = "small_fix" | "major_repair";
export type Guide = { id: string; title: string; kind: GuideKind };
// A published guide with where it belongs, for lists that show or filter by device and symptom.
export type PublishedGuide = Guide & { symptom: string; deviceId: string; device: string };
export type GuideStep = { id: string; position: number; title: string; instruction: string };
export type GuideProgress = { last_step_position: number; completed_at: string | null };

export const KIND_LABEL: Record<GuideKind, string> = {
  small_fix: "Small fix",
  major_repair: "Major repair",
};
