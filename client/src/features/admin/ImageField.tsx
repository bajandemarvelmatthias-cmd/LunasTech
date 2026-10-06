import { useRef, useState } from "react";
import { TextButton } from "@/components/ui/Button";
import { GuideImage } from "@/components/ui/GuideImage";
import { IMAGE_TYPES, uploadGuideImage } from "@/lib/guideImages";

type Props = {
  label: string;
  path: string | null;
  folder: "covers" | "steps";
  onChange: (path: string | null) => void;
};

// Optional photo for a guide or a step. Picking a file uploads it straight away
// (shrunk first); the path is saved with the guide when the admin presses Save.
// Phosphor Wrench tile shows while there is no photo.
export function ImageField({ label, path, folder, onChange }: Readonly<Props>) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await uploadGuideImage(file, folder));
    } catch {
      setError("Could not upload the photo. Use a JPG, PNG or WebP photo and try again.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold">{label}</span>
      <GuideImage path={path} placeholder className="aspect-video w-full rounded-lg border border-border" />
      <input
        ref={input}
        type="file"
        accept={IMAGE_TYPES.join(",")}
        className="hidden"
        aria-label={label}
        onChange={(e) => void pick(e.target.files?.[0])}
      />
      <div className="flex gap-6">
        <TextButton onClick={() => input.current?.click()} disabled={busy}>
          {busy ? "Uploading" : path ? "Replace photo" : "Add photo"}
        </TextButton>
        {path && !busy && <TextButton onClick={() => onChange(null)}>Remove photo</TextButton>}
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
