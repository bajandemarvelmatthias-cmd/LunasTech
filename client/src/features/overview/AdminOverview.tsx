import { BookOpen, Cube, DeviceMobile, DownloadSimple, Users } from "@phosphor-icons/react";
import { Button, OutlineButton } from "@/components/ui/Button";
import { fetchAdminCounts, fetchAdminGuides } from "@/features/admin/api";
import { downloadReport } from "@/features/admin/exportReport";
import { StatusBadge, SUBTITLE, TITLE } from "@/features/admin/parts";
import type { AdminCounts, AdminGuideRow, AdminStart } from "@/features/admin/types";
import { formatDate } from "@/lib/utils";
import { useLoad } from "@/lib/useLoad";
import { LoadError, PageHeader, StatCard } from "./parts";

const RING_RADIUS = 38;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;
const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

type Open = (tab: string, start?: AdminStart) => void;

type GuideSummary = { published: number; drafts: number; percent: number };

function summarizeGuides(guides: readonly AdminGuideRow[]): GuideSummary {
  const published = guides.filter((x) => x.status === "published").length;
  const percent = guides.length > 0 ? Math.round((published / guides.length) * 100) : 0;
  return { published, drafts: guides.length - published, percent };
}

// Share of completed simulation attempts that passed, or null before any attempt.
function passRateOf(c: AdminCounts): number | null {
  return c.attemptsCompleted > 0 ? Math.round((c.attemptsPassed / c.attemptsCompleted) * 100) : null;
}

function draftsMessage(drafts: number): string {
  if (drafts === 0) return "Every guide is published.";
  const verb = drafts === 1 ? "draft is" : "drafts are";
  return `${drafts} ${verb} waiting for review.`;
}

function exportReport(guides: readonly AdminGuideRow[], c: AdminCounts) {
  const { published, drafts } = summarizeGuides(guides);
  downloadReport([
    ["Guides", guides.length],
    ["Published guides", published],
    ["Draft guides", drafts],
    ["Devices", c.devices],
    ["Symptoms", c.symptoms],
    ["Simulations", c.simulations],
    ["Published simulations", c.publishedSimulations],
    ["Customers", c.customers],
    ["Simulation attempts completed", c.attemptsCompleted],
    ["Simulation attempts passed", c.attemptsPassed],
  ]);
}

// Admin landing page: counts that open their page, the latest guides, and how
// much of the guide library is published. Editing happens in the other tabs.
export function AdminOverview({ onOpen }: Readonly<{ onOpen: Open }>) {
  const guides = useLoad(fetchAdminGuides, []);
  const counts = useLoad(fetchAdminCounts, []);

  if (guides.error || counts.error) {
    return (
      <LoadError
        onRetry={() => {
          guides.retry();
          counts.retry();
        }}
      />
    );
  }

  const g = guides.data;
  const c = counts.data;
  const summary = g ? summarizeGuides(g) : null;

  return (
    <div className="flex flex-col gap-8 pb-12">
      <PageHeader
        title="Your workspace, at a glance"
        actions={
          <>
            <OutlineButton disabled={!g || !c} onClick={() => g && c && exportReport(g, c)}>
              <DownloadSimple className="size-6" aria-hidden="true" />
              Export report
            </OutlineButton>
            <Button className="w-auto" onClick={() => onOpen("guides", { editGuide: null })}>
              Create guide
            </Button>
          </>
        }
      />
      <Stats guides={g} summary={summary} counts={c} onOpen={onOpen} />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <LatestGuides guides={g} onOpen={onOpen} />
        <Readiness guides={g} summary={summary} passRate={c ? passRateOf(c) : null} onOpen={onOpen} />
      </div>
    </div>
  );
}

function Stats({
  guides,
  summary,
  counts,
  onOpen,
}: Readonly<{
  guides: AdminGuideRow[] | null;
  summary: GuideSummary | null;
  counts: AdminCounts | null;
  onOpen: Open;
}>) {
  const c = counts;
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={BookOpen}
        label="Guides"
        value={guides ? guides.length : "-"}
        note={summary ? `${summary.published} published · ${summary.drafts} draft` : undefined}
        onClick={() => onOpen("guides")}
      />
      <StatCard
        icon={DeviceMobile}
        label="Devices"
        value={c?.devices ?? "-"}
        note={c ? `${c.symptoms} symptoms` : undefined}
        onClick={() => onOpen("devices")}
      />
      <StatCard
        icon={Cube}
        label="Simulations"
        value={c?.simulations ?? "-"}
        note={c ? `${c.publishedSimulations} published · ${c.attemptsCompleted} attempts` : undefined}
        onClick={() => onOpen("simulations")}
      />
      <StatCard icon={Users} label="Customers" value={c?.customers ?? "-"} onClick={() => onOpen("customers")} />
    </section>
  );
}

// The five newest guides; a row opens that guide's editor.
function LatestGuides({ guides, onOpen }: Readonly<{ guides: AdminGuideRow[] | null; onOpen: Open }>) {
  let body;
  if (!guides) {
    body = <p className="text-base text-text-muted">Loading</p>;
  } else if (guides.length === 0) {
    body = <p className="text-base text-text-muted">No guides yet.</p>;
  } else {
    body = (
      <ul className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface shadow-card">
        {guides.slice(0, 5).map((x) => (
          <li key={x.id}>
            <button
              type="button"
              onClick={() => onOpen("guides", { editGuide: x.id })}
              className={`flex w-full items-center justify-between gap-4 px-6 py-4 text-left hover:bg-surface-secondary ${focus}`}
            >
              <span className="flex min-w-0 flex-col">
                <span className={TITLE}>{x.title}</span>
                <span className={SUBTITLE}>
                  {x.device} · {formatDate(x.createdAt)}
                </span>
              </span>
              <StatusBadge status={x.status} />
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold">Latest guides</h2>
        <button
          type="button"
          onClick={() => onOpen("guides")}
          className={`rounded-md font-semibold text-accent hover:text-accent-hover ${focus}`}
        >
          View all
        </button>
      </div>
      {body}
    </section>
  );
}

// Percent of guides published, with the simulation pass rate and one next step.
function Readiness({
  guides,
  summary,
  passRate,
  onOpen,
}: Readonly<{
  guides: AdminGuideRow[] | null;
  summary: GuideSummary | null;
  passRate: number | null;
  onOpen: Open;
}>) {
  const hasGuides = guides !== null && guides.length > 0;
  const percent = summary?.percent ?? 0;
  const drafts = summary?.drafts ?? 0;

  return (
    <section className="flex flex-col gap-4 self-start rounded-md border border-border bg-surface p-6 shadow-card">
      <h2 className="text-base font-semibold">Guide readiness</h2>
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 100 100" className="size-24 shrink-0 -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r={RING_RADIUS} fill="none" strokeWidth="10" stroke="currentColor" className="text-border" />
          <circle
            cx="50"
            cy="50"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            stroke="currentColor"
            className="text-accent"
            strokeDasharray={`${(percent / 100) * RING_LENGTH} ${RING_LENGTH}`}
          />
        </svg>
        <span className="flex min-w-0 flex-col">
          <span className="text-lg font-semibold">{summary ? `${percent}%` : "-"}</span>
          <span className="text-sm text-text-muted">published</span>
        </span>
      </div>
      {hasGuides && <p className="text-base text-text-muted">{draftsMessage(drafts)}</p>}
      {passRate !== null && <p className="text-base text-text-muted">{passRate}% of simulation attempts passed.</p>}
      {hasGuides && (
        <OutlineButton onClick={() => onOpen("guides", drafts > 0 ? { filter: "draft" } : undefined)}>
          {drafts > 0 ? "Review drafts" : "Manage guides"}
        </OutlineButton>
      )}
    </section>
  );
}
