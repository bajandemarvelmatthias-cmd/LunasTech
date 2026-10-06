import { cn } from "@/lib/utils";

// Filter pill. Selected state uses the accent border and tint.
export function Chip({
  label,
  selected,
  onClick,
}: Readonly<{ label: string; selected: boolean; onClick: () => void }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "h-10 rounded-full border px-4 text-sm font-semibold",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        selected
          ? "border-accent bg-surface-secondary text-accent"
          : "border-border bg-surface text-text-muted hover:text-text",
      )}
    >
      {label}
    </button>
  );
}
