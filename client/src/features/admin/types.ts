import type { GuideKind, GuideStep } from "@/features/guides/types";

export type Status = "draft" | "published";

export type AdminGuideRow = {
  id: string;
  title: string;
  kind: GuideKind;
  status: Status;
  device: string;
  symptom: string;
};

export type SymptomOption = { id: string; label: string };

export type GuideDetail = {
  id: string | null;
  title: string;
  kind: GuideKind;
  status: Status;
  symptomId: string;
  steps: GuideStep[];
};

// A step being edited. `id` is null until it has been saved.
export type StepDraft = { id: string | null; title: string; instruction: string };

export const STATUS_LABEL: Record<Status, string> = { draft: "Draft", published: "Published" };

export type SimulationRow = { id: string; title: string; status: Status };

// A stored simulation step as an admin sees it (answer and feedback included).
export type SimStepFull = {
  id: string;
  position: number;
  prompt: string;
  options: string[];
  correct_option: number;
  feedback: string;
};

export type SimulationDetail = {
  id: string | null;
  title: string;
  status: Status;
  steps: SimStepFull[];
};

// A simulation step being edited. `id` is null until saved; `correct` is
// null until the admin chooses the right option.
export type SimStepDraft = {
  id: string | null;
  prompt: string;
  options: string[];
  correct: number | null;
  feedback: string;
};

// Database limits (check constraint on simulation_steps.options).
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 6;
