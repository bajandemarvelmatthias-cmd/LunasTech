import { supabase } from "@/lib/supabase";
import type {
  DeviceType,
  Guide,
  GuideKind,
  GuideProgress,
  GuideStep,
  PublishedGuide,
  Symptom,
} from "./types";

// Row level security decides what each user can read. Guides are filtered to
// published here as well so admins browsing as users do not see drafts.

export async function fetchDevices(): Promise<DeviceType[]> {
  const { data, error } = await supabase.from("device_types").select("id, name").order("name");
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
    .select("id, title, kind")
    .eq("symptom_id", symptomId)
    .eq("status", "published")
    .order("kind")
    .order("title");
  if (error) throw error;
  return data as Guide[];
}

type PublishedGuideRow = {
  id: string;
  title: string;
  kind: GuideKind;
  symptoms: { name: string; device_types: { id: string; name: string } | null } | null;
};

// Every published guide with its symptom and device, newest first. One query
// feeds Overview, Repair Guides and Saved Guides.
export async function fetchPublishedGuides(): Promise<PublishedGuide[]> {
  const { data, error } = await supabase
    .from("guides")
    .select("id, title, kind, symptoms(name, device_types(id, name))")
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as PublishedGuideRow[]).map((g) => ({
    id: g.id,
    title: g.title,
    kind: g.kind,
    symptom: g.symptoms?.name ?? "",
    deviceId: g.symptoms?.device_types?.id ?? "",
    device: g.symptoms?.device_types?.name ?? "",
  }));
}

export async function fetchGuideSteps(guideId: string): Promise<GuideStep[]> {
  const { data, error } = await supabase
    .from("guide_steps")
    .select("id, position, title, instruction")
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
