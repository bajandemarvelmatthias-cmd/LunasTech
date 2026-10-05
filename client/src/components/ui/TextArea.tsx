import { useId, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type TextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> & {
  label: string;
  error?: string;
};

// Labeled multi-line input. Same look as TextField.
export function TextArea({ label, error, rows = 5, ...rest }: TextAreaProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        className={cn(
          "w-full rounded-md border bg-surface px-4 py-3 text-base text-text",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          error ? "border-danger" : "border-border",
        )}
        {...rest}
      />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
