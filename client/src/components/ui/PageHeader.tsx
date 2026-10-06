import type { ReactNode } from "react";

// Title and one line under it. Every workspace page starts with this.
export function PageHeader({
  title,
  subtitle,
  action,
}: Readonly<{ title: string; subtitle?: string; action?: ReactNode }>) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && <p className="text-base text-text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
