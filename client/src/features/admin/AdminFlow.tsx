import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ListScreen } from "@/features/guides/ListScreen";
import { KIND_LABEL } from "@/features/guides/types";
import { useLoad } from "@/lib/useLoad";
import { fetchAdminGuides } from "./api";
import { GuideEditor } from "./GuideEditor";
import { SimulationAdminList, SimulationEditor } from "./SimulationAdmin";
import { STATUS_LABEL } from "./types";

type Route =
  | { name: "list" }
  | { name: "edit"; guideId: string | null }
  | { name: "sims"; guideId: string }
  | { name: "sim"; guideId: string; simulationId: string | null };

// Every guide (drafts included), the editor for one guide, and that guide's
// simulations with their editor.
// State-based like the other flows. Unlike the Guides flow it does not follow
// the browser back button (decision-log.md #14).
export function AdminFlow() {
  const [route, setRoute] = useState<Route>({ name: "list" });

  switch (route.name) {
    case "edit":
      return (
        <GuideEditor
          guideId={route.guideId}
          onBack={() => setRoute({ name: "list" })}
          onSimulations={(guideId) => setRoute({ name: "sims", guideId })}
        />
      );
    case "sims":
      return (
        <SimulationAdminList
          guideId={route.guideId}
          onBack={() => setRoute({ name: "edit", guideId: route.guideId })}
          onOpen={(simulationId) => setRoute({ name: "sim", guideId: route.guideId, simulationId })}
        />
      );
    case "sim":
      return (
        <SimulationEditor
          guideId={route.guideId}
          simulationId={route.simulationId}
          onBack={() => setRoute({ name: "sims", guideId: route.guideId })}
        />
      );
  }
  return <GuideAdminList onOpen={(guideId) => setRoute({ name: "edit", guideId })} />;
}

function GuideAdminList({ onOpen }: Readonly<{ onOpen: (guideId: string | null) => void }>) {
  const { data, loading, error, retry } = useLoad(fetchAdminGuides, []);
  return (
    <ListScreen
      title="All guides"
      loading={loading}
      error={error}
      onRetry={retry}
      items={
        data?.map((g) => ({
          id: g.id,
          label: g.title,
          note: `${g.device} · ${g.symptom} · ${KIND_LABEL[g.kind]} · ${STATUS_LABEL[g.status]}`,
        })) ?? null
      }
      empty="No guides yet."
      onSelect={onOpen}
      action={<Button onClick={() => onOpen(null)}>New guide</Button>}
    />
  );
}
