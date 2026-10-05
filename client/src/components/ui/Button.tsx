import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

// Primary action. Full width, one per screen. Disabled and loading states
// use the secondary surface so the accent stays reserved for actions that work.
export function Button({
  loading,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        "h-(--size-control) w-full rounded-md bg-accent px-4 text-base font-semibold text-accent-text",
        "hover:bg-accent-hover",
        "disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-text-muted",
        focus,
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

// Inline text action, used for switching screens and logging out.
export function TextButton({
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-md font-semibold text-accent hover:text-accent-hover",
        focus,
        className,
      )}
      {...rest}
    />
  );
}
