import { BookOpen, DeviceMobile, NotePencil, Users } from "@phosphor-icons/react";
import { fetchDevices } from "@/features/guides/api";
import { fetchAdminGuides, fetchUserCount } from "@/features/admin/api";
import { STATUS_LABEL } from "@/features/admin/types";
import { useLoad } from "@/lib/useLoad";
import { LoadError, PageHeader, StatCard } from "./parts";

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

// Admin landing page: counts and the latest guides. Editing happens in Guides.
export function AdminOverview({ onOpenGuides }: Readonly<{ onOpenGuides: () => void }>) {
  const guides = useLoad(fetchAdminGuides, []);
  const devices = useLoad(fetchDevices, []);
  const users = useLoad(fetchUserCount, []);

  if (guides.error || devices.error || users.error) {
    return <LoadError onRetry={() => { guides.retry(); devices.retry(); users.retry(); }} />;
  }
  const g = guides.data;
  const published = g ? g.filter((x) => x.status === "published").length : "-";
  const drafts = g ? g.length - Number(published) : "-";

  return (
    <div className="flex flex-col gap-8 pb-12">
      <PageHeader
        title="Overview"
        actions={
          <button type="button" onClick={onOpenGuides} className={`h-(--size-control) rounded-md bg-accent px-4 text-base font-semibold text-accent-text hover:bg-accent-hover ${focus}`}>
            Create guide
          </button>
        }
      />
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="Published guides" value={published} />
        <StatCard icon={NotePencil} label="Draft guides" value={drafts} />
        <StatCard icon={DeviceMobile} label="Device types" value={devices.data?.length ?? "-"} />
        <StatCard icon={Users} label="Users" value={users.data ?? "-"} />
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">Latest guides</h2>
        {g?.length === 0 && <p className="text-base text-text-muted">No guides yet.</p>}
        <ul className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface shadow-card">
          {g?.slice(0, 5).map((x) => (
            <li key={x.id} className="flex items-center justify-between gap-4 px-6 py-4">
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-base font-semibold">{x.title}</span>
                <span className="truncate text-sm text-text-muted">{x.device}</span>
              </span>
              <span className="shrink-0 rounded-md bg-accent-soft px-2 py-1 text-sm font-semibold text-accent">{STATUS_LABEL[x.status]}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
