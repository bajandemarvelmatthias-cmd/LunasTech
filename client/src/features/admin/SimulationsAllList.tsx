import { useState } from "react";
import { PencilSimple } from "@phosphor-icons/react";
import { Button, TextButton } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { LoadError, PageHeader } from "@/features/overview/parts";
import { cn, formatDate } from "@/lib/utils";
import { useLoad } from "@/lib/useLoad";
import { fetchAdminGuides, fetchAllSimulations } from "./api";
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

const GRID = "grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_72px_96px_120px_120px_24px]";
const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

// Every simulation across all guides. A row opens its editor. A new simulation
// belongs to a guide, so "New simulation" first asks which one.
export function SimulationsAllList({
  onOpen,
  onNew,
}: Readonly<{
  onOpen: (guideId: string, simulationId: string) => void;
  onNew: (guideId: string) => void;
}>) {
  const { data, loading, error, retry } = useLoad(fetchAllSimulations, []);
  const [filter, setFilter] = useState<GuideFilter>("all");
  const [query, setQuery] = useState("");
  const [picking, setPicking] = useState(false);

  const q = query.trim().toLowerCase();
  const rows = (data ?? []).filter(
    (s) => (filter === "all" || s.status === filter) && `${s.title} ${s.guideTitle}`.toLowerCase().includes(q),
  );

  let body;
  if (error) {
    body = <LoadError onRetry={retry} />;
  } else if (loading || !data) {
    body = <p className="text-base text-text-muted">Loading</p>;
  } else if (data.length === 0) {
    body = <EmptyNote>No simulations yet.</EmptyNote>;
  } else {
    body = (
      <>
        <ListToolbar>
          <FilterTabs options={statusOptions(data)} value={filter} onChange={setFilter} />
          <SearchField value={query} onChange={setQuery} label="Search simulations" />
        </ListToolbar>
        {rows.length === 0 ? (
          <EmptyNote>No simulations match.</EmptyNote>
        ) : (
          <DataList columns={["Simulation", "Steps", "Attempts", "Status", "Created", ""]} grid={GRID}>
            {rows.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onOpen(s.guideId, s.id)}
                  className={cn("grid w-full items-center gap-4 px-6 py-4 text-left hover:bg-surface-secondary", GRID, focus)}
                >
                  <span className="flex min-w-0 flex-col">
                    <span className={TITLE}>{s.title}</span>
                    <span className={SUBTITLE}>{s.guideTitle}</span>
                  </span>
                  <span className={SECONDARY}>{s.steps}</span>
                  <span className={SECONDARY}>{s.attempts}</span>
                  <StatusBadge status={s.status} />
                  <span className={SECONDARY}>{formatDate(s.createdAt)}</span>
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
      <PageHeader
        title="All simulations"
        actions={
          <Button className="w-auto" onClick={() => setPicking(true)}>
            New simulation
          </Button>
        }
      />
      {body}
      <Modal open={picking} title="New simulation" onClose={() => setPicking(false)}>
        <GuidePicker
          onCancel={() => setPicking(false)}
          onContinue={(guideId) => {
            setPicking(false);
            onNew(guideId);
          }}
        />
      </Modal>
    </div>
  );
}

// Asks which guide the simulation belongs to. Drafts are included.
function GuidePicker({
  onContinue,
  onCancel,
}: Readonly<{ onContinue: (guideId: string) => void; onCancel: () => void }>) {
  const { data, loading, error, retry } = useLoad(fetchAdminGuides, []);
  const [guideId, setGuideId] = useState("");

  if (loading) return <p className="text-base text-text-muted">Loading</p>;
  if (error || !data) return <LoadError onRetry={retry} />;
  if (data.length === 0) return <EmptyNote>Create a guide first.</EmptyNote>;

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (guideId) onContinue(guideId);
      }}
    >
      <Select
        label="Guide"
        placeholder="Choose a guide"
        value={guideId}
        onChange={(e) => setGuideId(e.target.value)}
        options={data.map((g) => ({ value: g.id, label: `${g.title} · ${g.device}` }))}
      />
      <Button type="submit" disabled={!guideId}>
        Continue
      </Button>
      <p className="text-center text-base">
        <TextButton onClick={onCancel}>Cancel</TextButton>
      </p>
    </form>
  );
}
