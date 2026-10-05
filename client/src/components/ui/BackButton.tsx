import { ArrowLeft } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

// Back action, top left of a screen's content (ux-ui-guidelines.md, placement).
// Phosphor ArrowLeft to the left of the visible label.
export function BackButton({ onClick }: Readonly<{ onClick: () => void }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "-ml-2 flex h-10 items-center gap-1 self-start rounded-md px-2 text-base font-semibold text-text-muted",
        "hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
      )}
    >
      <ArrowLeft className="size-6" aria-hidden="true" />
      Back
    </button>
  );
}
