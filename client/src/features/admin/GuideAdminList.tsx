import { useState } from "react";
import { PencilSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { KIND_LABEL } from "@/features/guides/types";
import { LoadError, PageHeader } from "@/features/overview/parts";
import { cn, formatDate } from "@/lib/utils";
import { useLoad } from "@/lib/useLoad";
import { fetchAdminGuides } from "./api";
import {
  DataList,
  EmptyNote,
  FilterTabs,
  ListToolbar,
  SearchField,
  SECONDARY,
  StatusBadge,
  SUBTITLE,
  TITLE,
  statusOptions,
} from "./parts";
import type { GuideFilter } from "./types";

const GRID = "grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_128px_120px_120px_24px]";
const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

// Every guide, drafts included, with a status filter and search. A row opens
// the guide editor. Guides are never deleted, only moved to drafts (decision #14).
export function GuideAdminList({
  initialFilter = "all",
  onOpen,
}: Readonly<{ initialFilter?: GuideFilter; onOpen: (guideId: string | null) => void }>) {
  const { data, loading, error, retry } = useLoad(fetchAdminGuides, []);
  const [filter, setFilter] = useState<GuideFilter>(initialFilter);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const rows = (data ?? []).filter(
    (g) =>
      (filter === "all" || g.status === filter) &&
      `${g.title} ${g.device} ${g.symptom}`.toLowerCase().includes(q),
  );

  let body;
  if (error) {
    body = <LoadError onRetry={retry} />;
  } else if (loading || !data) {
    body = <p className="text-base text-text-muted">Loading</p>;
  } else if (data.length === 0) {
    body = <EmptyNote>No guides yet.</EmptyNote>;
  } else {
    body = (
      <>
        <ListToolbar>
          <FilterTabs options={statusOptions(data)} value={filter} onChange={setFilter} />
          <SearchField value={query} onChange={setQuery} label="Search guides" />
        </ListToolbar>
        {rows.length === 0 ? (
          <EmptyNote>No guides match.</EmptyNote>
        ) : (
          <DataList columns={["Guide", "Type", "Status", "Created", ""]} grid={GRID}>
            {rows.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => onOpen(g.id)}
                  className={cn("grid w-full items-center gap-4 px-6 py-4 text-left hover:bg-surface-secondary", GRID, focus)}
                >
                  <span className="flex min-w-0 flex-col">
                    <span className={TITLE}>{g.title}</span>
                    <span className={SUBTITLE}>
                      {g.device} · {g.symptom}
                    </span>
                  </span>
                  <span className={SECONDARY}>{KIND_LABEL[g.kind]}</span>
                  <StatusBadge status={g.status} />
                  <span className={SECONDARY}>{formatDate(g.createdAt)}</span>
                  <PencilSimple className="hidden size-6 text-text-muted md:block" aria-hidden="true" />
                </button>
              </li>
            ))}
          </DataList>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader title="All guides" actions={<Button className="w-auto" onClick={() => onOpen(null)}>New guide</Button>} />
      {body}
    </div>
  );
}
