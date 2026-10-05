import { supabase } from "@/lib/supabase";
import { fetchGuideSteps } from "@/features/guides/api";
import type { GuideKind, GuideStep } from "@/features/guides/types";
import type {
  AdminGuideRow,
  GuideDetail,
  SimStepDraft,
  SimStepFull,
  SimulationDetail,
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
  symptoms: { name: string; device_types: { name: string } | null } | null;
};

// Unlike the user list, this includes drafts.
export async function fetchAdminGuides(): Promise<AdminGuideRow[]> {
  const { data, error } = await supabase
    .from("guides")
    .select("id, title, kind, status, symptoms(name, device_types(name))")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as GuideQuery[]).map((g) => ({
    id: g.id,
    title: g.title,
    kind: g.kind,
    status: g.status,
    device: g.symptoms?.device_types?.name ?? "",
    symptom: g.symptoms?.name ?? "",
  }));
}

type SymptomQuery = { id: string; name: string; device_types: { name: string } | null };

export async function fetchSymptomOptions(): Promise<SymptomOption[]> {
  const { data, error } = await supabase.from("symptoms").select("id, name, device_types(name)");
  if (error) throw error;
  return (data as unknown as SymptomQuery[])
    .map((s) => ({ id: s.id, label: `${s.device_types?.name ?? ""} · ${s.name}` }))
    .sort((a, b) => a.label.localeCompare(b.label));
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
    supabase.from("guides").select("id, title, kind, status, symptom_id").eq("id", guideId).single(),
    fetchGuideSteps(guideId),
  ]);
  if (guide.error) throw guide.error;
  return {
    id: guide.data.id,
    title: guide.data.title,
    kind: guide.data.kind,
    status: guide.data.status,
    symptomId: guide.data.symptom_id,
    steps,
  };
}

type SaveInput = {
  guideId: string | null;
  userId: string;
  title: string;
  symptomId: string;
  kind: GuideKind;
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
  const { userId, title, symptomId, kind, drafts, original } = input;
  let id = input.guideId;

  if (id) {
    const { error } = await supabase
      .from("guides")
      .update({ title, symptom_id: symptomId, kind })
      .eq("id", id);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from("guides")
      .insert({ title, symptom_id: symptomId, kind, created_by: userId })
      .select("id")
      .single();
    if (error) throw error;
    id = data.id as string;
  }

  const kept = new Set(drafts.filter((d) => d.id).map((d) => d.id));
  const removed = original.filter((o) => !kept.has(o.id)).map((o) => o.id);
  if (removed.length > 0) {
    const { error } = await supabase.from("guide_steps").delete().in("id", removed);
    if (error) throw error;
  }

  const byId = new Map(original.map((o) => [o.id, o]));
  for (const d of drafts) {
    const before = d.id ? byId.get(d.id) : undefined;
    if (!d.id || !before) continue;
    if (before.title === d.title && before.instruction === d.instruction) continue;
    const { error } = await supabase
      .from("guide_steps")
      .update({ title: d.title, instruction: d.instruction })
      .eq("id", d.id);
    if (error) throw error;
  }

  const lastKept = Math.max(0, ...original.filter((o) => kept.has(o.id)).map((o) => o.position));
  const added = drafts
    .filter((d) => !d.id)
    .map((d, i) => ({ guide_id: id, position: lastKept + 1 + i, title: d.title, instruction: d.instruction }));
  if (added.length > 0) {
    const { error } = await supabase.from("guide_steps").insert(added);
    if (error) throw error;
  }

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

  const kept = new Set(drafts.filter((d) => d.id).map((d) => d.id));
  const removed = original.filter((o) => !kept.has(o.id)).map((o) => o.id);
  if (removed.length > 0) {
    const { error } = await supabase.from("simulation_steps").delete().in("id", removed);
    if (error) throw error;
  }

  const byId = new Map(original.map((o) => [o.id, o]));
  for (const d of drafts) {
    const before = d.id ? byId.get(d.id) : undefined;
    if (!d.id || !before || d.correct === null) continue;
    const same =
      before.prompt === d.prompt &&
      before.feedback === d.feedback &&
      before.correct_option === d.correct &&
      JSON.stringify(before.options) === JSON.stringify(d.options);
    if (same) continue;
    const { error } = await supabase
      .from("simulation_steps")
      .update({ prompt: d.prompt, options: d.options, correct_option: d.correct, feedback: d.feedback })
      .eq("id", d.id);
    if (error) throw error;
  }

  const lastKept = Math.max(0, ...original.filter((o) => kept.has(o.id)).map((o) => o.position));
  const added = drafts
    .filter((d) => !d.id && d.correct !== null)
    .map((d, i) => ({
      simulation_id: id,
      position: lastKept + 1 + i,
      prompt: d.prompt,
      options: d.options,
      correct_option: d.correct,
      feedback: d.feedback,
    }));
  if (added.length > 0) {
    const { error } = await supabase.from("simulation_steps").insert(added);
    if (error) throw error;
  }

  return { id, steps: await fetchAdminSimSteps(id) };
}

export async function setSimulationStatus(simulationId: string, status: Status): Promise<void> {
  const { error } = await supabase.from("simulations").update({ status }).eq("id", simulationId);
  if (error) throw error;
}
