import type { ReactNode, Ref } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  // Optional hint on the right edge (the keyboard shortcut in the top bar).
  trailing?: ReactNode;
  className?: string;
  inputRef?: Ref<HTMLInputElement>;
};

// Search input with Phosphor MagnifyingGlass on the left.
export function SearchField({ label, value, onChange, placeholder, trailing, className, inputRef }: Readonly<Props>) {
  return (
    <div className={cn("relative", className)}>
      <MagnifyingGlass
        className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-text-muted"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="search"
        aria-label={label}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-(--size-control) w-full rounded-md border border-border bg-surface pr-4 pl-12 text-base text-text",
          "placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          trailing && "pr-20",
        )}
      />
      {trailing && <span className="absolute top-1/2 right-4 -translate-y-1/2">{trailing}</span>}
    </div>
  );
}
