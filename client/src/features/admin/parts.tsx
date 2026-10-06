import type { ReactNode } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { CustomerRole, GuideFilter, Status } from "./types";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

// Published and draft are told apart by surface and text, not by new colors.
export function StatusBadge({ status }: Readonly<{ status: Status }>) {
  const published = status === "published";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-2 py-1 text-sm font-semibold",
        published ? "bg-accent-soft text-accent" : "bg-surface-secondary text-text-muted",
      )}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}

export function RoleBadge({ role }: Readonly<{ role: CustomerRole }>) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-2 py-1 text-sm font-semibold",
        role === "admin" ? "bg-accent-soft text-accent" : "bg-surface-secondary text-text-muted",
      )}
    >
      {role === "admin" ? "Admin" : "Customer"}
    </span>
  );
}

export type FilterOption<T extends string> = { value: T; label: string; count: number };

// Segmented filter above a list. The selected option uses the soft accent surface.
export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
}: Readonly<{ options: FilterOption<T>[]; value: T; onChange: (value: T) => void }>) {
  return (
    <div role="group" aria-label="Filter" className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex h-10 items-center gap-2 rounded-md px-4 text-base font-semibold",
            o.value === value ? "bg-accent-soft text-accent" : "text-text-muted hover:text-text",
            focus,
          )}
        >
          {o.label}
          <span className="text-sm">{o.count}</span>
        </button>
      ))}
    </div>
  );
}

export function SearchField({
  value,
  onChange,
  label,
}: Readonly<{ value: string; onChange: (value: string) => void; label: string }>) {
  return (
    <label className="relative block w-full md:w-72">
      <span className="sr-only">{label}</span>
      <MagnifyingGlass
        className="pointer-events-none absolute left-4 top-1/2 size-6 -translate-y-1/2 text-text-muted"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search"
        className={cn(
          "h-(--size-control) w-full rounded-md border border-border bg-surface pl-12 pr-4 text-base text-text",
          focus,
        )}
      />
    </label>
  );
}

// Filters on the left, search on the right; stacked on phones.
export function ListToolbar({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">{children}</div>;
}

// A list that reads as a table from md up. The list is the container, so it is
// not wrapped in a card. `grid` sets the columns (a static class string) and
// is shared by the header and every row so they line up. On phones only the
// first cell and the last cell show; the rest are marked `hidden md:block`.
export function DataList({
  columns,
  grid,
  children,
}: Readonly<{ columns: string[]; grid: string; children: ReactNode }>) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface shadow-card">
      <div
        aria-hidden="true"
        className={cn("hidden items-center gap-4 bg-surface-secondary px-6 py-3 text-sm text-text-muted md:grid", grid)}
      >
        {columns.map((c) => (
          <span key={c || "end"}>{c}</span>
        ))}
      </div>
      <ul className="divide-y divide-border">{children}</ul>
    </div>
  );
}

// Cell text styles shared by every list.
export const TITLE = "truncate text-base font-semibold";
export const SUBTITLE = "truncate text-sm text-text-muted";
export const SECONDARY = "hidden truncate text-sm text-text-muted md:block";

export function EmptyNote({ children }: Readonly<{ children: ReactNode }>) {
  return <p className="text-base text-text-muted">{children}</p>;
}

// All / Published / Draft with counts, for guides and simulations.
export function statusOptions(items: readonly { status: Status }[]): FilterOption<GuideFilter>[] {
  const published = items.filter((i) => i.status === "published").length;
  return [
    { value: "all", label: "All", count: items.length },
    { value: "published", label: "Published", count: published },
    { value: "draft", label: "Draft", count: items.length - published },
  ];
}
