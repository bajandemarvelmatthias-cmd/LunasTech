import type { GuideKind, GuideStep } from "@/features/guides/types";

export type Status = "draft" | "published";

export type AdminGuideRow = {
  id: string;
  title: string;
  kind: GuideKind;
  status: Status;
  device: string;
  symptom: string;
  createdAt: string;
};

// Status filter on the guides list. The overview opens it on "draft".
export type GuideFilter = "all" | Status;

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

// ---------- Dashboard pages (decision-log.md #20) ----------

// One row of the all-simulations list. `steps` and `attempts` are counts.
export type SimulationListRow = {
  id: string;
  title: string;
  status: Status;
  guideId: string;
  guideTitle: string;
  steps: number;
  attempts: number;
  createdAt: string;
};

export type SymptomSummary = { id: string; name: string; guides: number };

// A device type with its symptoms and guide counts (drafts included).
export type DeviceSummary = {
  id: string;
  name: string;
  symptoms: SymptomSummary[];
  guides: number;
  published: number;
};

export type CustomerRole = "user" | "admin";

export type CustomerRow = {
  id: string;
  name: string | null;
  role: CustomerRole;
  level: number;
  joined: string;
};

// Counts shown on the admin overview and written to the exported report.
export type AdminCounts = {
  devices: number;
  symptoms: number;
  simulations: number;
  publishedSimulations: number;
  customers: number;
  attemptsCompleted: number;
  attemptsPassed: number;
};

// Where an admin section opens. Sent by the overview; the section starts there.
// `filter` opens the guides list on one status. `editGuide` opens the guide
// editor (null starts a new guide).
export type AdminStart = { filter?: GuideFilter; editGuide?: string | null };
