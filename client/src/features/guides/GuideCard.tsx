import { cn } from "@/lib/utils";
import { SaveButton } from "@/features/saved/SaveButton";
import { KIND_LABEL, type PublishedGuide } from "./types";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

// One guide: kind, title, device and symptom. The card opens the guide; the
// bookmark is a sibling control, never nested inside the open button.
export function GuideCard({ guide, onOpen }: Readonly<{ guide: PublishedGuide; onOpen: (guide: PublishedGuide) => void }>) {
  return (
    <div className="relative flex rounded-lg border border-border bg-surface hover:bg-canvas">
      <button
        type="button"
        onClick={() => onOpen(guide)}
        className={cn("flex min-h-32 flex-1 flex-col items-start gap-2 rounded-lg p-6 pr-16 text-left", focus)}
      >
        <span className="rounded-full bg-surface-secondary px-3 py-1 text-xs font-semibold text-accent">
          {KIND_LABEL[guide.kind]}
        </span>
        <span className="text-base font-semibold">{guide.title}</span>
        <span className="text-sm text-text-muted">
          {[guide.device, guide.symptom].filter(Boolean).join(", ")}
        </span>
      </button>
      <SaveButton guideId={guide.id} className="absolute top-4 right-4" />
    </div>
  );
}

export function GuideGrid({ guides, onOpen }: Readonly<{ guides: PublishedGuide[]; onOpen: (guide: PublishedGuide) => void }>) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {guides.map((g) => (
        <li key={g.id} className="flex flex-col">
          <GuideCard guide={g} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  );
}
