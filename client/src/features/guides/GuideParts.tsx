import { Clock, ListNumbers } from "@phosphor-icons/react";
import { GuideImage } from "@/components/ui/GuideImage";
import { cn } from "@/lib/utils";
import { DIFFICULTY_LABEL, KIND_LABEL, type Guide } from "./types";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

// Difficulty, time and step count. Shows only what the admin filled in.
// Phosphor Clock (time) and ListNumbers (steps), each beside its text.
export function GuideMeta({ guide, className }: Readonly<{ guide: Guide; className?: string }>) {
  const { difficulty, estimated_minutes: minutes, step_count: steps } = guide;
  if (!difficulty && !minutes && !steps) return null;
  return (
    <span className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-muted", className)}>
      {difficulty && (
        <span className="rounded-md bg-accent-soft px-2 py-1 font-semibold text-accent">
          {DIFFICULTY_LABEL[difficulty]}
        </span>
      )}
      {minutes ? (
        <span className="flex items-center gap-1">
          <Clock className="size-4" aria-hidden="true" />
          {minutes} min
        </span>
      ) : null}
      {steps ? (
        <span className="flex items-center gap-1">
          <ListNumbers className="size-4" aria-hidden="true" />
          {steps} {steps === 1 ? "step" : "steps"}
        </span>
      ) : null}
    </span>
  );
}

// The matching guides as photo cards: cover photo on top, then kind, title and details.
export function GuideCards({
  guides,
  onSelect,
}: Readonly<{ guides: Guide[]; onSelect: (guide: Guide) => void }>) {
  return (
    <ul className="flex flex-col gap-4">
      {guides.map((g) => (
        <li key={g.id}>
          <button
            type="button"
            onClick={() => onSelect(g)}
            className={cn(
              "flex w-full flex-col overflow-hidden rounded-lg border border-border bg-surface text-left shadow-card hover:border-accent",
              focus,
            )}
          >
            <GuideImage path={g.cover_image_path} placeholder className="aspect-video w-full" />
            <span className="flex flex-col gap-2 p-4">
              <span className="text-sm text-text-muted">{KIND_LABEL[g.kind]}</span>
              <span className="text-base font-semibold">{g.title}</span>
              <GuideMeta guide={g} />
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
