import { supabase } from "@/lib/supabase";

export type Profile = { displayName: string | null; level: number };

export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, learning_level")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return { displayName: data.display_name as string | null, level: data.learning_level as number };
}

// Users may change display_name only (column privileges, decision-log.md #3).
export async function updateDisplayName(userId: string, name: string): Promise<void> {
  const { error } = await supabase.from("profiles").update({ display_name: name }).eq("id", userId);
  if (error) throw error;
}
