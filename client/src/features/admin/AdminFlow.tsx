import { useState, type ReactNode } from "react";
import { GuideAdminList } from "./GuideAdminList";
import { GuideEditor } from "./GuideEditor";
import { SimulationAdminList, SimulationEditor } from "./SimulationAdmin";
import { SimulationsAllList } from "./SimulationsAllList";
import type { AdminStart } from "./types";

// "all" means the simulation was opened from the Simulations page; "guide"
// means from a guide's own simulation list. Back returns to where it came from.
type Route =
  | { name: "list" }
  | { name: "edit"; guideId: string | null }
  | { name: "sims"; guideId: string }
  | { name: "sim"; guideId: string; simulationId: string | null; from: "all" | "guide" };

// Forms stay a narrow centered column inside the wide admin page.
function Narrow({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="mx-auto w-full max-w-md">{children}</div>;
}

// The Guides and Simulations sections of the admin workspace.
// Guides: list, guide editor, that guide's simulations and their editor.
// Simulations: list of every simulation and the same simulation editor.
// State-based like the other flows. Unlike the Guides flow it does not follow
// the browser back button (decision-log.md #14).
export function AdminFlow({
  section,
  start,
}: Readonly<{ section: "guides" | "simulations"; start?: AdminStart }>) {
  const [route, setRoute] = useState<Route>(() =>
    start?.editGuide === undefined ? { name: "list" } : { name: "edit", guideId: start.editGuide },
  );

  switch (route.name) {
    case "edit":
      return (
        <Narrow>
          <GuideEditor
            guideId={route.guideId}
            onBack={() => setRoute({ name: "list" })}
            onSimulations={(guideId) => setRoute({ name: "sims", guideId })}
          />
        </Narrow>
      );
    case "sims":
      return (
        <Narrow>
          <SimulationAdminList
            guideId={route.guideId}
            onBack={() => setRoute({ name: "edit", guideId: route.guideId })}
            onOpen={(simulationId) => setRoute({ name: "sim", guideId: route.guideId, simulationId, from: "guide" })}
          />
        </Narrow>
      );
    case "sim":
      return (
        <Narrow>
          <SimulationEditor
            guideId={route.guideId}
            simulationId={route.simulationId}
            onBack={() =>
              setRoute(route.from === "all" ? { name: "list" } : { name: "sims", guideId: route.guideId })
            }
          />
        </Narrow>
      );
  }

  if (section === "simulations") {
    return (
      <SimulationsAllList
        onOpen={(guideId, simulationId) => setRoute({ name: "sim", guideId, simulationId, from: "all" })}
        onNew={(guideId) => setRoute({ name: "sim", guideId, simulationId: null, from: "all" })}
      />
    );
  }
  return <GuideAdminList initialFilter={start?.filter} onOpen={(guideId) => setRoute({ name: "edit", guideId })} />;
}
