import { supabase } from "@/lib/supabase";
import type { DeviceCategory, DeviceType, Guide, GuideProgress, GuideStep, Symptom } from "./types";

// Row level security decides what each user can read. Guides are filtered to
// published here as well so admins browsing as users do not see drafts.

export async function fetchDevices(): Promise<DeviceType[]> {
  const { data, error } = await supabase.from("device_types").select("id, name")
    .eq("status", "active")
    .order("name");
  if (error) throw error;
  return data;
}

export async function fetchSymptoms(deviceId: string): Promise<Symptom[]> {
  const { data, error } = await supabase
    .from("symptoms")
    .select("id, name")
    .eq("device_type_id", deviceId)
    .order("name");
  if (error) throw error;
  return data;
}

export async function fetchGuides(symptomId: string): Promise<Guide[]> {
  const { data, error } = await supabase
    .from("guides")
    .select("id, title, kind, difficulty, estimated_minutes, cover_image_path, description, guide_steps(count)")
    .eq("symptom_id", symptomId)
    .eq("status", "published")
    .order("kind")
    .order("title");
  if (error) throw error;
  type Row = Omit<Guide, "step_count"> & { guide_steps: { count: number }[] };
  return (data as unknown as Row[]).map(({ guide_steps, ...g }) => ({
    ...g,
    step_count: guide_steps[0]?.count ?? 0,
  }));
}

export async function fetchGuideSteps(guideId: string): Promise<GuideStep[]> {
  const { data, error } = await supabase
    .from("guide_steps")
    .select("id, position, title, instruction, image_path")
    .eq("guide_id", guideId)
    .order("position");
  if (error) throw error;
  return data;
}

export async function fetchProgress(guideId: string): Promise<GuideProgress | null> {
  const { data, error } = await supabase
    .from("guide_progress")
    .select("last_step_position, completed_at")
    .eq("guide_id", guideId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Saves the step the user is on. `completed` stamps completed_at; leaving it
// out keeps any earlier completion.
export async function saveProgress(
  userId: string,
  guideId: string,
  position: number,
  completed = false,
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase.from("guide_progress").upsert(
    {
      user_id: userId,
      guide_id: guideId,
      last_step_position: position,
      updated_at: now,
      ...(completed ? { completed_at: now } : {}),
    },
    { onConflict: "user_id,guide_id" },
  );
  if (error) throw error;
}

// Every published guide on an active device, for the browse screen. Each guide
// carries its device and symptom so the cards can name them and be filtered
// by device category.
export async function fetchAllGuides(): Promise<Guide[]> {
  const { data, error } = await supabase
    .from("guides")
    .select(
      "id, title, kind, difficulty, estimated_minutes, cover_image_path, description, guide_steps(count), symptoms(name, device_types(name, category, status))",
    )
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error) throw error;
  type Row = Omit<Guide, "step_count" | "device_name" | "device_category" | "symptom_name"> & {
    guide_steps: { count: number }[];
    symptoms: {
      name: string;
      device_types: { name: string; category: DeviceCategory | null; status: string } | null;
    } | null;
  };
  return (data as unknown as Row[])
    .filter((g) => g.symptoms?.device_types?.status === "active")
    .map(({ guide_steps, symptoms, ...g }) => ({
      ...g,
      step_count: guide_steps[0]?.count ?? 0,
      device_name: symptoms?.device_types?.name,
      device_category: symptoms?.device_types?.category ?? null,
      symptom_name: symptoms?.name,
    }));
}
