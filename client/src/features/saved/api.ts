import { supabase } from "@/lib/supabase";

export async function fetchSavedIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("saved_guides")
    .select("guide_id")
    .eq("user_id", userId);
  if (error) throw error;
  return data.map((r) => r.guide_id as string);
}

export async function saveGuide(userId: string, guideId: string): Promise<void> {
  const { error } = await supabase
    .from("saved_guides")
    .upsert({ user_id: userId, guide_id: guideId }, { onConflict: "user_id,guide_id", ignoreDuplicates: true });
  if (error) throw error;
}

export async function unsaveGuide(userId: string, guideId: string): Promise<void> {
  const { error } = await supabase
    .from("saved_guides")
    .delete()
    .eq("user_id", userId)
    .eq("guide_id", guideId);
  if (error) throw error;
}
