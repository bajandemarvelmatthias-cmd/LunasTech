import type { ReactNode } from "react";
import type { Icon } from "@phosphor-icons/react";

// One number with its label. Used by both overview pages so they match.
export function StatCard({
  icon: Icon,
  label,
  value,
}: Readonly<{ icon: Icon; label: string; value: string | number }>) {
  return (
    <div className="flex items-center gap-4 rounded-md border border-border bg-surface p-6 shadow-card">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm text-text-muted">{label}</span>
        <span className="text-lg font-semibold">{value}</span>
      </span>
    </div>
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
