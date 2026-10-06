import { useState } from "react";
import { LoadError, PageHeader } from "@/features/overview/parts";
import { cn, formatDate } from "@/lib/utils";
import { useLoad } from "@/lib/useLoad";
import { CUSTOMER_LIMIT, fetchCustomers } from "./api";
import { DataList, EmptyNote, RoleBadge, SearchField, SECONDARY, TITLE } from "./parts";

const GRID = "grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_120px_120px_128px]";

function initials(name: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "-";
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

// Read-only list of accounts. Roles and levels are set by the database
// (decision #3), so there is nothing to edit here. Email addresses are not
// readable from the app, so rows show the display name only.
export function CustomersAdmin() {
  const { data, loading, error, retry } = useLoad(fetchCustomers, []);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const rows = (data?.rows ?? []).filter((c) => (c.name ?? "").toLowerCase().includes(q));

  let body;
  if (error) {
    body = <LoadError onRetry={retry} />;
  } else if (loading || !data) {
    body = <p className="text-base text-text-muted">Loading</p>;
  } else if (data.rows.length === 0) {
    body = <EmptyNote>No customers yet.</EmptyNote>;
  } else {
    body = (
      <>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-base text-text-muted">
            {data.total > CUSTOMER_LIMIT
              ? `Showing the newest ${CUSTOMER_LIMIT} of ${data.total}`
              : `${data.total} in total`}
          </p>
          <SearchField value={query} onChange={setQuery} label="Search customers" />
        </div>
        {rows.length === 0 ? (
          <EmptyNote>No customers match.</EmptyNote>
        ) : (
          <DataList columns={["Customer", "Role", "Learning level", "Joined"]} grid={GRID}>
            {rows.map((c) => (
              <li key={c.id} className={cn("grid items-center gap-4 px-6 py-4", GRID)}>
                <span className="flex min-w-0 items-center gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent-soft text-sm font-semibold text-accent">
                    {initials(c.name)}
                  </span>
                  <span className={cn(TITLE, !c.name && "font-normal text-text-muted")}>{c.name ?? "No name set"}</span>
                </span>
                <span className="hidden md:block">
                  <RoleBadge role={c.role} />
                </span>
                <span className={SECONDARY}>Level {c.level}</span>
                <span className="text-sm text-text-muted">{formatDate(c.joined)}</span>
              </li>
            ))}
          </DataList>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader title="All customers" />
      {body}
    </div>
  );
}
