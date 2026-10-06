import { useMemo, useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { LoadError, Loading } from "@/components/ui/Status";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchField } from "@/components/ui/SearchField";
import { useLoad } from "@/lib/useLoad";
import { fetchPublishedGuides } from "./api";
import { GuideGrid } from "./GuideCard";
import type { Guide } from "./types";

type Props = { initialQuery: string; initialDeviceId: string | null; onOpen: (guide: Guide) => void };

// Every published guide, filtered by search text and device type.
// Search matches the guide title, device and symptom.
export function GuideBrowser({ initialQuery, initialDeviceId, onOpen }: Readonly<Props>) {
  const { data, loading, error, retry } = useLoad(fetchPublishedGuides, []);
  const [query, setQuery] = useState(initialQuery);
  const [deviceId, setDeviceId] = useState<string | null>(initialDeviceId);

  const devices = useMemo(() => {
    const byId = new Map<string, string>();
    for (const g of data ?? []) if (g.deviceId) byId.set(g.deviceId, g.device);
    return [...byId].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter(
      (g) =>
        (!deviceId || g.deviceId === deviceId) &&
        (!q || [g.title, g.device, g.symptom].some((text) => text.toLowerCase().includes(q))),
    );
  }, [data, query, deviceId]);

  let body;
  if (loading) body = <Loading />;
  else if (error || !data) {
    body = <LoadError message="Can't load the guides. Check your connection and try again." onRetry={retry} />;
  } else if (data.length === 0) body = <p className="text-base text-text-muted">No guides yet.</p>;
  else if (shown.length === 0) {
    body = <p className="text-base text-text-muted">No guides match. Try a different search or device type.</p>;
  } else body = <GuideGrid guides={shown} onOpen={onOpen} />;

  return (
    <>
      <PageHeader title="Repair guides" subtitle="Practical repairs. Clear steps. Real confidence." />
      <div className="flex flex-wrap items-center gap-4">
        <SearchField
          label="Search guides"
          placeholder="Search guides"
          value={query}
          onChange={setQuery}
          className="w-full max-w-sm"
        />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Device type">
          <Chip label="All" selected={deviceId === null} onClick={() => setDeviceId(null)} />
          {devices.map((d) => (
            <Chip key={d.id} label={d.name} selected={deviceId === d.id} onClick={() => setDeviceId(d.id)} />
          ))}
        </div>
      </div>
      {body}
    </>
  );
}
