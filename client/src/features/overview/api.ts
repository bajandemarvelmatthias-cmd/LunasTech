import { supabase } from "@/lib/supabase";
import type { DeviceType, Guide, GuideDifficulty, GuideKind } from "@/features/guides/types";

export type PublishedGuide = Guide & { device: DeviceType };

type Row = {
  id: string;
  title: string;
  kind: GuideKind;
  difficulty: GuideDifficulty | null;
  estimated_minutes: number | null;
  cover_image_path: string | null;
  description: string | null;
  symptoms: { device_types: DeviceType | null } | null;
};

// Every published guide with its device, newest first. One query feeds the
// guide count, the per-device counts and the "good place to start" cards.
export async function fetchPublishedGuides(): Promise<PublishedGuide[]> {
  const { data, error } = await supabase
    .from("guides")
    .select("id, title, kind, difficulty, estimated_minutes, cover_image_path, description, symptoms(device_types(id, name))")
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as Row[]).flatMap((g) => {
    const device = g.symptoms?.device_types;
    return device
      ? [
          {
            id: g.id,
            title: g.title,
            kind: g.kind,
            difficulty: g.difficulty,
            estimated_minutes: g.estimated_minutes,
            cover_image_path: g.cover_image_path,
            description: g.description,
            device,
          },
        ]
      : [];
  });
}
