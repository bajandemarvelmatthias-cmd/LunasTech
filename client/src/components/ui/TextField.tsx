import { useId, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  label: string;
  error?: string;
  help?: string;
};

// Labeled input. type="password" adds a show/hide toggle on the right edge
// (Phosphor Eye / EyeSlash). An error replaces the help text.
export function TextField({
  label,
  error,
  help,
  type = "text",
  ...rest
}: TextFieldProps) {
  const id = useId();
  const noteId = `${id}-note`;
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const note = error ?? help;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && visible ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={note ? noteId : undefined}
          className={cn(
            "h-(--size-control) w-full rounded-md border bg-surface px-4 text-base text-text",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
            error ? "border-danger" : "border-border",
            isPassword && "pr-12",
          )}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 flex w-(--size-control) items-center justify-center rounded-md text-text-muted focus-visible:outline-2 focus-visible:outline-accent"
          >
            {visible ? <EyeSlash className="size-6" /> : <Eye className="size-6" />}
          </button>
        )}
      </div>
      {note && (
        <p
          id={noteId}
          role={error ? "alert" : undefined}
          className={cn("text-sm", error ? "text-danger" : "text-text-muted")}
        >
          {note}
        </p>
      )}
    </div>
  );
}
