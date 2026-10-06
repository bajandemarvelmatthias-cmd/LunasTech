import { BookmarkSimple } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useSaved } from "./SavedProvider";

// Bookmark toggle for one guide. Phosphor BookmarkSimple, filled when saved.
export function SaveButton({ guideId, className }: Readonly<{ guideId: string; className?: string }>) {
  const { ids, toggle } = useSaved();
  const saved = ids.has(guideId);
  return (
    <button
      type="button"
      onClick={() => toggle(guideId)}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved guides" : "Save guide"}
      className={cn(
        "flex size-10 items-center justify-center rounded-md hover:bg-surface-secondary",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        saved ? "text-accent" : "text-text-muted",
        className,
      )}
    >
      <BookmarkSimple className="size-6" weight={saved ? "fill" : "regular"} aria-hidden="true" />
    </button>
  );
}
