import { useState, type ReactNode } from "react";
import { GuideAdminList } from "./GuideAdminList";
import { GuideEditor } from "./GuideEditor";
import { SimulationAdminList, SimulationEditor } from "./SimulationAdmin";
import { SimulationsAllList } from "./SimulationsAllList";
import type { NewGuideStart } from "./NewGuideForm";
import type { AdminStart } from "./types";

// "all" means the simulation was opened from the Simulations page; "guide"
// means from a guide's own simulation list. Back returns to where it came from.
type Route =
  | { name: "list" }
  | { name: "edit"; guideId: string; start?: NewGuideStart }
  | { name: "sims"; guideId: string }
  | { name: "sim"; guideId: string; simulationId: string | null; from: "all" | "guide" };

// Forms stay a narrow centered column inside the wide admin page.
function Narrow({ children, wide = false }: Readonly<{ children: ReactNode; wide?: boolean }>) {
  return <div className={wide ? "mx-auto w-full max-w-2xl" : "mx-auto w-full max-w-md"}>{children}</div>;
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
  // editGuide: a guide id opens that guide; null opens the "Add guide" form.
  const [route, setRoute] = useState<Route>(() =>
    typeof start?.editGuide === "string" ? { name: "edit", guideId: start.editGuide } : { name: "list" },
  );

  switch (route.name) {
    case "edit":
      return (
        <Narrow wide>
          <GuideEditor
            guideId={route.guideId}
            start={route.start}
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
  return (
    <GuideAdminList
      initialFilter={start?.filter}
      startNew={start?.editGuide === null}
      onOpen={(guideId, newGuide) => setRoute({ name: "edit", guideId, start: newGuide })}
    />
  );
}
