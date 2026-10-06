import { supabase } from "@/lib/supabase";

const BUCKET = "guide-images";
// Longest side of a stored photo. Phone photos are far larger than a screen needs.
const MAX_SIDE = 1600;

// What the file picker offers: any image. Every photo is decoded and re-saved
// as JPEG below, so the browser decides what it can read (JPG, PNG, WebP, GIF,
// BMP, AVIF and so on), not a fixed list that can grey out a normal picture.
export const IMAGE_ACCEPT = "image/*,.jpg,.jpeg,.jfif,.png,.webp,.gif,.bmp,.avif";

// The chosen file is not a picture this browser can read.
export class UnreadableImageError extends Error {}

// Public address of a stored photo.
export function guideImageUrl(path: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// Scales a photo down and re-encodes it as JPEG so uploads stay small and fast
// on a phone connection. Transparent areas become white.
async function shrink(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new UnreadableImageError("The photo could not be read.");
  }
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
  const blob = await shrink(file);
  const path = `${folder}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
  if (error) throw error;
  return path;
}
