import type { ReactNode } from "react";
import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

// One number with its label. Used by both overview pages so they match.
// `note` is a short line under the number. With `onClick` the card is a button
// that opens the page the number comes from.
export function StatCard({
  icon: Icon,
  label,
  value,
  note,
  onClick,
}: Readonly<{
  icon: Icon;
  label: string;
  value: string | number;
  note?: string;
  onClick?: () => void;
}>) {
  const body = (
    <>
      <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm text-text-muted">{label}</span>
        <span className="text-lg font-semibold">{value}</span>
        {note && <span className="truncate text-sm text-text-muted">{note}</span>}
      </span>
    </>
  );
  const card = "flex items-center gap-4 rounded-md border border-border bg-surface p-6 text-left shadow-card";
  if (!onClick) return <div className={card}>{body}</div>;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        card,
        "hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
      )}
    >
      {body}
    </button>
  );
}

export function PageHeader({
  title,
  actions,
}: Readonly<{ title: string; actions?: ReactNode }>) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-lg font-semibold">{title}</h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function LoadError({ onRetry }: Readonly<{ onRetry: () => void }>) {
  return (
    <div className="flex flex-col items-start gap-4">
      <p role="alert" className="text-sm text-danger">
        Can't load this page. Check your connection and try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="h-(--size-control) rounded-md border border-border px-4 text-base font-semibold text-accent focus-visible:outline-2 focus-visible:outline-accent"
      >
        Try again
      </button>
    </div>
  );
}
