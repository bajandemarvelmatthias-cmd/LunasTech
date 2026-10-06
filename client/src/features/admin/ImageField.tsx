import { useRef, useState, type DragEvent } from "react";
import { Plus } from "@phosphor-icons/react";
import { TextButton } from "@/components/ui/Button";
import { GuideImage } from "@/components/ui/GuideImage";
import { IMAGE_ACCEPT, UnreadableImageError, uploadGuideImage } from "@/lib/guideImages";

type Props = {
  label: string;
  path: string | null;
  folder: "covers" | "steps";
  onChange: (path: string | null) => void;
};

// Optional photo for a guide or a step. An empty upload box with a "+" opens the
// file picker (images only); the chosen photo uploads straight away (shrunk
// first) and the path is saved with the guide when the admin presses Save.
// Clicking the photo replaces it.
export function ImageField({ label, path, folder, onChange }: Readonly<Props>) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  // Dropping a picture on the box uploads it. Without this the browser would
  // leave the app and open the file instead.
  function drop(e: DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setOver(false);
    const file = e.dataTransfer.files[0];
    if (file && !file.type.startsWith("image/")) {
      setError("Only images can be uploaded. Drop a JPG, PNG or WebP photo.");
      return;
    }
    void pick(file);
  }

  async function pick(file: File | undefined) {
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await uploadGuideImage(file, folder));
    } catch (err) {
      setError(
        err instanceof UnreadableImageError
          ? "That file could not be opened. Choose a JPG, PNG or WebP photo. If it is only stored on OneDrive, keep it on this device first."
          : "The photo could not be uploaded. Check your connection and try again.",
      );
      console.error("Photo upload failed:", err);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold">{label}</span>
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={drop}
        aria-label={path ? `Replace ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}
        className={`relative aspect-video w-full overflow-hidden rounded-lg border border-border hover:bg-surface-secondary ${over ? "bg-surface-secondary ring-2 ring-accent" : ""} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait`}
      >
        {path ? (
          <GuideImage path={path} placeholder className="size-full" />
        ) : (
          <span className="flex size-full items-center justify-center border-2 border-dashed border-border">
            <span className="flex size-16 items-center justify-center rounded-lg border-2 border-text-muted text-text-muted">
              <Plus className="size-8" aria-hidden="true" />
            </span>
          </span>
        )}
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center bg-surface/80 text-sm font-semibold">
            Uploading
          </span>
        )}
      </button>
      <input
        ref={input}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        aria-label={label}
        onChange={(e) => void pick(e.target.files?.[0])}
      />
      {path && !busy && (
        <div className="flex gap-6">
          <TextButton onClick={() => input.current?.click()}>Replace photo</TextButton>
          <TextButton onClick={() => onChange(null)}>Remove photo</TextButton>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
