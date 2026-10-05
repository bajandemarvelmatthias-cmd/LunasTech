import { useId, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string };

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "className" | "children"> & {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
};

// Labeled native select. Same look as TextField. `placeholder` adds an
// unselectable first row shown while value is "".
export function Select({ label, options, placeholder, error, ...rest }: SelectProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        className={cn(
          "h-(--size-control) w-full rounded-md border bg-surface px-4 text-base text-text",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          error ? "border-danger" : "border-border",
        )}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
