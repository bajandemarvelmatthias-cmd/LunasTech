import { supabase } from "@/lib/supabase";

const BUCKET = "guide-images";
// Longest side of a stored photo. Phone photos are far larger than a screen needs.
const MAX_SIDE = 1600;

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Public address of a stored photo.
export function guideImageUrl(path: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// Scales a photo down and re-encodes it as JPEG so uploads stay small and fast
// on a phone connection. Transparent areas become white.
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob) throw new Error("The photo could not be converted.");
  return blob;
}

// Uploads a photo and returns its storage path. Only admins are allowed to
// write; the database policy refuses everyone else.
export async function uploadGuideImage(file: File, folder: "covers" | "steps"): Promise<string> {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error("Use a JPG, PNG or WebP photo.");
  const blob = await shrink(file);
  const path = `${folder}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
  if (error) throw error;
  return path;
}
