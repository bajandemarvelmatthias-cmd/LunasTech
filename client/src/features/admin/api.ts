import { supabase } from "@/lib/supabase";
import { fetchGuideSteps } from "@/features/guides/api";
import type { GuideDifficulty, GuideKind, GuideStep } from "@/features/guides/types";
import type {
  AdminCounts,
  AdminGuideRow,
  CustomerRow,
  DeviceFields,
  DeviceOption,
  DeviceSummary,
  GuideDetail,
  SimStepDraft,
  SimStepFull,
  SimulationDetail,
  SimulationListRow,
  SimulationRow,
  Status,
  StepDraft,
  SymptomOption,
} from "./types";

// The app only decides whether to show the Admin tab. What an admin may
// actually read or write is enforced by row level security in the database.
export async function fetchIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).single();
  if (error) throw error;
  return data.role === "admin";
}

type GuideQuery = {
  id: string;
  title: string;
  kind: GuideKind;
  status: Status;
  created_at: string;
  cover_image_path: string | null;
  difficulty: GuideDifficulty | null;
  symptoms: { name: string; device_types: { name: string } | null } | null;
};

// Unlike the user list, this includes drafts.
export async function fetchAdminGuides(): Promise<AdminGuideRow[]> {
  const { data, error } = await supabase
    .from("guides")
    .select("id, title, kind, status, created_at, cover_image_path, difficulty, symptoms(name, device_types(name))")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as GuideQuery[]).map((g) => ({
    id: g.id,
    title: g.title,
    kind: g.kind,
    status: g.status,
    device: g.symptoms?.device_types?.name ?? "",
    symptom: g.symptoms?.name ?? "",
    createdAt: g.created_at,
    coverImagePath: g.cover_image_path,
    difficulty: g.difficulty,
  }));
}

type SymptomQuery = { id: string; name: string; device_type_id: string; device_types: { name: string } | null };

export async function fetchSymptomOptions(): Promise<SymptomOption[]> {
  const { data, error } = await supabase.from("symptoms").select("id, name, device_type_id, device_types(name)");
  if (error) throw error;
  return (data as unknown as SymptomQuery[])
    .map((s) => ({
      id: s.id,
      label: `${s.device_types?.name ?? ""} · ${s.name}`,
      name: s.name,
      deviceId: s.device_type_id,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export async function fetchDeviceOptions(): Promise<DeviceOption[]> {
  const { data, error } = await supabase
    .from("device_types")
    .select("id, name, category, status")
    .order("name");
  if (error) throw error;
  return (data as unknown as { id: string; name: string; category: DeviceOption["category"]; status: string }[]).map(
    (d) => ({ id: d.id, name: d.name, category: d.category, archived: d.status === "archived" }),
  );
}

export async function createSymptom(deviceId: string, name: string): Promise<string> {
  const { data, error } = await supabase
    .from("symptoms")
    .insert({ device_type_id: deviceId, name })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function fetchGuideDetail(guideId: string): Promise<GuideDetail> {
  const [guide, steps] = await Promise.all([
    supabase
      .from("guides")
      .select("id, title, description, kind, status, symptom_id, difficulty, estimated_minutes, cover_image_path")
      .eq("id", guideId)
      .single(),
    fetchGuideSteps(guideId),
  ]);
  if (guide.error) throw guide.error;
  return {
    id: guide.data.id,
    title: guide.data.title,
    description: guide.data.description ?? "",
    kind: guide.data.kind,
    status: guide.data.status,
    symptomId: guide.data.symptom_id,
    difficulty: guide.data.difficulty as GuideDifficulty | null,
    estimatedMinutes: guide.data.estimated_minutes,
    coverImagePath: guide.data.cover_image_path,
    steps,
  };
}

type StepTable = "guide_steps" | "simulation_steps";

type SyncSteps<O extends { id: string; position: number }, D extends { id: string | null }> = {
  table: StepTable;
  original: O[];
  drafts: D[];
  // Drafts that cannot be written yet (for example no answer chosen) are left alone.
  skip?: (draft: D) => boolean;
  changed: (before: O, draft: D) => boolean;
  toUpdate: (draft: D) => Record<string, unknown>;
  toInsert: (draft: D, position: number) => Record<string, unknown>;
};

// Shared by guides and simulations. Steps can be edited in place, added at the
// end, or removed from the end. Order of writes: delete, update, insert.
async function syncSteps<O extends { id: string; position: number }, D extends { id: string | null }>(
  opts: SyncSteps<O, D>,
): Promise<void> {
  const { table, original, drafts, skip = () => false } = opts;

  const kept = new Set(drafts.filter((d) => d.id).map((d) => d.id));
  const removed = original.filter((o) => !kept.has(o.id)).map((o) => o.id);
  if (removed.length > 0) {
    const { error } = await supabase.from(table).delete().in("id", removed);
    if (error) throw error;
  }

  const byId = new Map(original.map((o) => [o.id, o]));
  // Each update touches a different row (position is never changed), so they can run together.
  const updates = drafts.flatMap((d) => {
    const before = d.id ? byId.get(d.id) : undefined;
    return d.id && before && !skip(d) && opts.changed(before, d)
      ? [{ id: d.id, row: opts.toUpdate(d) }]
      : [];
  });
  const results = await Promise.all(
    updates.map((u) => supabase.from(table).update(u.row).eq("id", u.id)),
  );
  for (const { error } of results) {
    if (error) throw error;
  }

  const lastKept = Math.max(0, ...original.filter((o) => kept.has(o.id)).map((o) => o.position));
  const added = drafts
    .filter((d) => !d.id && !skip(d))
    .map((d, i) => opts.toInsert(d, lastKept + 1 + i));
  if (added.length > 0) {
    const { error } = await supabase.from(table).insert(added);
    if (error) throw error;
  }
}

type SaveInput = {
  guideId: string | null;
  userId: string;
  title: string;
  description: string;
  symptomId: string;
  kind: GuideKind;
  difficulty: GuideDifficulty | null;
  estimatedMinutes: number | null;
  coverImagePath: string | null;
  drafts: StepDraft[];
  original: GuideStep[];
};

// Saves the guide and its steps, then returns what is stored.
// Steps can be edited in place, added at the end, or removed from the end.
// That keeps (guide_id, position) unique without moving rows around; moving
// steps would need a database function (schema change, needs approval).
// Order of writes: delete, update, insert. A failure part way leaves earlier
// writes in place; saving again repeats only what still differs.
export async function saveGuide(input: SaveInput): Promise<{ id: string; steps: GuideStep[] }> {
  const { userId, title, description, symptomId, kind, difficulty, estimatedMinutes, coverImagePath, drafts, original } = input;
  const fields = {
    title,
    description: description || null,
    symptom_id: symptomId,
    kind,
    difficulty,
    estimated_minutes: estimatedMinutes,
    cover_image_path: coverImagePath,
  };
  let id = input.guideId;

  if (id) {
    const { error } = await supabase
      .from("guides")
      .update(fields)
      .eq("id", id);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from("guides")
      .insert({ ...fields, created_by: userId })
      .select("id")
      .single();
    if (error) throw error;
    id = data.id as string;
  }

  await syncSteps({
    table: "guide_steps",
    original,
    drafts,
    changed: (before, d) =>
      before.title !== d.title || before.instruction !== d.instruction || before.image_path !== d.imagePath,
    toUpdate: (d) => ({ title: d.title, instruction: d.instruction, image_path: d.imagePath }),
    toInsert: (d, position) => ({
      guide_id: id,
      position,
      title: d.title,
      instruction: d.instruction,
      image_path: d.imagePath,
    }),
  });

  return { id, steps: await fetchGuideSteps(id) };
}

export async function setGuideStatus(guideId: string, status: Status): Promise<void> {
  const { error } = await supabase.from("guides").update({ status }).eq("id", guideId);
  if (error) throw error;
}

// ---------- Simulations (decision-log.md #15) ----------

export async function fetchAdminSimulations(guideId: string): Promise<SimulationRow[]> {
  const { data, error } = await supabase
    .from("simulations")
    .select("id, title, status")
    .eq("guide_id", guideId)
    .order("created_at");
  if (error) throw error;
  return data as SimulationRow[];
}

// correct_option and feedback are hidden from the table for signed-in users,
// so admins read steps through admin_simulation_steps() (decision #3).
async function fetchAdminSimSteps(simulationId: string): Promise<SimStepFull[]> {
  const { data, error } = await supabase.rpc("admin_simulation_steps", {
    p_simulation_id: simulationId,
  });
  if (error) throw error;
  return data as SimStepFull[];
}

export async function fetchSimulationDetail(simulationId: string): Promise<SimulationDetail> {
  const [sim, steps] = await Promise.all([
    supabase.from("simulations").select("id, title, status").eq("id", simulationId).single(),
    fetchAdminSimSteps(simulationId),
  ]);
  if (sim.error) throw sim.error;
  return { id: sim.data.id, title: sim.data.title, status: sim.data.status, steps };
}

type SaveSimInput = {
  simulationId: string | null;
  guideId: string;
  title: string;
  drafts: SimStepDraft[];
  original: SimStepFull[];
};

// Same rules as saveGuide: edit in place, add at the end, remove from the end.
// Inserts and updates on simulation_steps must not ask for the row back
// (the hidden columns cannot be returned); the stored steps are re-read after.
export async function saveSimulation(
  input: SaveSimInput,
): Promise<{ id: string; steps: SimStepFull[] }> {
  const { guideId, title, drafts, original } = input;
  let id = input.simulationId;

  if (id) {
    const { error } = await supabase.from("simulations").update({ title }).eq("id", id);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from("simulations")
      .insert({ guide_id: guideId, title })
      .select("id")
      .single();
    if (error) throw error;
    id = data.id as string;
  }

  await syncSteps({
    table: "simulation_steps",
    original,
    drafts,
    skip: (d) => d.correct === null,
    changed: (before, d) =>
      before.prompt !== d.prompt ||
      before.feedback !== d.feedback ||
      before.correct_option !== d.correct ||
      JSON.stringify(before.options) !== JSON.stringify(d.options),
    toUpdate: (d) => ({
      prompt: d.prompt,
      options: d.options,
      correct_option: d.correct,
      feedback: d.feedback,
    }),
    toInsert: (d, position) => ({
      simulation_id: id,
      position,
      prompt: d.prompt,
      options: d.options,
      correct_option: d.correct,
      feedback: d.feedback,
    }),
  });

  return { id, steps: await fetchAdminSimSteps(id) };
}

export async function setSimulationStatus(simulationId: string, status: Status): Promise<void> {
  const { error } = await supabase.from("simulations").update({ status }).eq("id", simulationId);
  if (error) throw error;
}

// ---------- Dashboard pages (decision-log.md #20) ----------
// Read-only except createDevice. Row level security decides what an admin may
// read or write; nothing here needs a schema change.

const HEAD = { count: "exact", head: true } as const;

// Counts for the overview and the exported report. Guide counts come from
// fetchAdminGuides, which the overview already loads.
export async function fetchAdminCounts(): Promise<AdminCounts> {
  const [devices, symptoms, sims, simsPublished, customers, completed, passed] = await Promise.all([
    supabase.from("device_types").select("id", HEAD),
    supabase.from("symptoms").select("id", HEAD),
    supabase.from("simulations").select("id", HEAD),
    supabase.from("simulations").select("id", HEAD).eq("status", "published"),
    supabase.from("profiles").select("id", HEAD),
    supabase.from("simulation_attempts").select("id", HEAD).not("completed_at", "is", null),
    supabase.from("simulation_attempts").select("id", HEAD).eq("passed", true),
  ]);
  for (const r of [devices, symptoms, sims, simsPublished, customers, completed, passed]) {
    if (r.error) throw r.error;
  }
  return {
    devices: devices.count ?? 0,
    symptoms: symptoms.count ?? 0,
    simulations: sims.count ?? 0,
    publishedSimulations: simsPublished.count ?? 0,
    customers: customers.count ?? 0,
    attemptsCompleted: completed.count ?? 0,
    attemptsPassed: passed.count ?? 0,
  };
}

type SimListQuery = {
  id: string;
  title: string;
  status: Status;
  guide_id: string;
  created_at: string;
  guides: { title: string } | null;
  simulation_steps: { id: string }[];
  simulation_attempts: { count: number }[];
};

// Every simulation with its guide. Steps are counted from their ids because
// only id, position, prompt and options are readable columns (decision #3).
export async function fetchAllSimulations(): Promise<SimulationListRow[]> {
  const { data, error } = await supabase
    .from("simulations")
    .select(
      "id, title, status, guide_id, created_at, guides(title), simulation_steps(id), simulation_attempts(count)",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as SimListQuery[]).map((s) => ({
    id: s.id,
    title: s.title,
    status: s.status,
    guideId: s.guide_id,
    guideTitle: s.guides?.title ?? "",
    steps: s.simulation_steps.length,
    attempts: s.simulation_attempts[0]?.count ?? 0,
    createdAt: s.created_at,
  }));
}

type DeviceQuery = {
  id: string;
  name: string;
  manufacturer: string | null;
  category: DeviceFields["category"];
  notes: string | null;
  status: DeviceFields["status"];
  symptoms: { id: string; name: string; guides: { id: string; status: Status }[] }[];
};

export async function fetchDeviceSummaries(): Promise<DeviceSummary[]> {
  const { data, error } = await supabase
    .from("device_types")
    .select("id, name, manufacturer, category, notes, status, symptoms(id, name, guides(id, status))")
    .order("name");
  if (error) throw error;
  return (data as unknown as DeviceQuery[]).map((d) => {
    const all = d.symptoms.flatMap((s) => s.guides);
    return {
      id: d.id,
      name: d.name,
      manufacturer: d.manufacturer ?? "",
      category: d.category,
      notes: d.notes ?? "",
      status: d.status,
      guides: all.length,
      published: all.filter((g) => g.status === "published").length,
      symptoms: d.symptoms
        .map((s) => ({ id: s.id, name: s.name, guides: s.guides.length }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  });
}

// Empty text becomes null so the database holds no blank strings.
function deviceRow(f: DeviceFields) {
  return {
    name: f.name,
    manufacturer: f.manufacturer || null,
    category: f.category,
    notes: f.notes || null,
    status: f.status,
  };
}

export async function createDevice(fields: DeviceFields): Promise<string> {
  const { data, error } = await supabase.from("device_types").insert(deviceRow(fields)).select("id").single();
  if (error) throw error;
  return data.id as string;
}

// Guides link to a device by id, so renaming or archiving never breaks them.
export async function updateDevice(id: string, fields: DeviceFields): Promise<void> {
  const { error } = await supabase.from("device_types").update(deviceRow(fields)).eq("id", id);
  if (error) throw error;
}

// Permanently deletes a device and, with it, its symptoms. Only allowed while
// no guide uses the device: guides point at symptoms with on delete restrict,
// so the database refuses otherwise and nothing is removed. Returns "blocked"
// in that case so the screen can say why.
export async function deleteDevice(id: string): Promise<"deleted" | "blocked"> {
  const { data, error } = await supabase.from("device_types").delete().eq("id", id).select("id");
  if (error) {
    if ((error as { code?: string }).code === "23503") return "blocked";
    throw error;
  }
  // No row back means nothing was deleted (it is gone already, or not allowed).
  if (!data || data.length === 0) throw new Error("Device was not deleted");
  return "deleted";
}

// Permanently deletes an archived device together with every guide that uses
// it. Deleting a guide also deletes its steps, its simulations and every
// customer's progress, attempts and saved marks for it (foreign keys cascade).
// Guides go first because the database refuses to delete a device that still
// has guides. If the device cannot be deleted after that, this throws.
export async function deleteDeviceAndGuides(id: string, symptomIds: string[]): Promise<void> {
  if (symptomIds.length > 0) {
    const { error } = await supabase.from("guides").delete().in("symptom_id", symptomIds);
    if (error) throw error;
  }
  if ((await deleteDevice(id)) === "blocked") throw new Error("Device still has guides");
}

// Postgres unique violation: the same name already exists.
export function isDuplicate(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "23505";
}

type ProfileQuery = {
  id: string;
  display_name: string | null;
  role: CustomerRow["role"];
  learning_level: number;
  created_at: string;
};

export const CUSTOMER_LIMIT = 1000;

// Admins can read every profile. Email addresses live in auth.users, which the
// app cannot read, so only the profile fields are shown. `total` is the full
// count; `rows` holds the newest CUSTOMER_LIMIT.
export async function fetchCustomers(): Promise<{ rows: CustomerRow[]; total: number }> {
  const { data, error, count } = await supabase
    .from("profiles")
    .select("id, display_name, role, learning_level, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(0, CUSTOMER_LIMIT - 1);
  if (error) throw error;
  return {
    total: count ?? data.length,
    rows: (data as ProfileQuery[]).map((p) => ({
      id: p.id,
      name: p.display_name,
      role: p.role,
      level: p.learning_level,
      joined: p.created_at,
    })),
  };
}
