import { cn } from "@/lib/utils";

// Initials in a tinted circle.
export function Avatar({ initials, className }: Readonly<{ initials: string; className?: string }>) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-sm font-semibold text-accent",
        className,
      )}
    >
      {initials}
    </span>
  );
}
