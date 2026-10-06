import type { GuideDifficulty, GuideKind, GuideStep } from "@/features/guides/types";

export type Status = "draft" | "published";

export type AdminGuideRow = {
  id: string;
  title: string;
  kind: GuideKind;
  status: Status;
  device: string;
  symptom: string;
  createdAt: string;
  coverImagePath: string | null;
  difficulty: GuideDifficulty | null;
};

// Status filter on the guides list. The overview opens it on "draft".
export type GuideFilter = "all" | Status;

export type SymptomOption = { id: string; label: string; name: string; deviceId: string };

// A device as the guide editor offers it. Archived devices stay selectable so
// an existing guide on one can still be edited.
export type DeviceOption = { id: string; name: string; category: DeviceCategory | null; archived: boolean };

export type GuideDetail = {
  id: string | null;
  title: string;
  description: string;
  kind: GuideKind;
  status: Status;
  symptomId: string;
  difficulty: GuideDifficulty | null;
  estimatedMinutes: number | null;
  coverImagePath: string | null;
  steps: GuideStep[];
};

// A step being edited. `id` is null until it has been saved.
export type StepDraft = {
  id: string | null;
  title: string;
  instruction: string;
  imagePath: string | null;
};

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
export type DeviceCategory = "smartphones" | "laptops" | "tablets" | "game_consoles";
export type DeviceStatus = "active" | "archived";

export const CATEGORY_LABEL: Record<DeviceCategory, string> = {
  smartphones: "Smartphones",
  // Stored as "laptops"; shown as Desktops so one type covers laptops and computers.
  laptops: "Desktops",
  tablets: "Tablets",
  game_consoles: "Game consoles",
};

// What an admin can set on a device (the form and the save call).
export type DeviceFields = {
  name: string;
  manufacturer: string;
  category: DeviceCategory | null;
  notes: string;
  status: DeviceStatus;
};

export type DeviceSummary = DeviceFields & {
  id: string;
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
