import { useEffect, useRef } from "react";
import { useHistoryStack } from "@/lib/useHistoryStack";
import { DiagnosisScreen } from "@/features/diagnosis/DiagnosisScreen";
import { SimulationList } from "@/features/simulations/SimulationList";
import { SimulationScreen } from "@/features/simulations/SimulationScreen";
import { SimulationsScreen } from "@/features/simulations/SimulationsScreen";
import type { Simulation } from "@/features/simulations/types";
import { GuideBrowser } from "./GuideBrowser";
import { GuideScreen } from "./GuideScreen";
import type { Guide } from "./types";

export type LearnRoot = "guides" | "diagnose" | "simulations";

type Route =
  | { name: "root" }
  | { name: "guide"; guide: Guide }
  | { name: "simulations"; guide: Guide }
  | { name: "simulation"; simulation: Simulation };

type Props = {
  // Which page sits at the bottom of the stack.
  root: LearnRoot;
  initialQuery: string;
  initialDeviceId: string | null;
  // A guide to open on top of the root as soon as the flow appears.
  initialGuide: Guide | null;
};

// Opening a guide or simulation from any root page: the guide, then its
// simulation (opened automatically when the guide has exactly one).
// State-based like AuthFlow. The browser back button goes back one screen
// (lib/useHistoryStack.ts); the URL does not change. The root page stays
// mounted underneath, so its search text and choices are still there on Back.
export function GuidesFlow({ root, initialQuery, initialDeviceId, initialGuide }: Readonly<Props>) {
  const { current: route, push, pop, replace, reset: home } = useHistoryStack<Route>({ name: "root" });

  const opened = useRef(false);
  useEffect(() => {
    if (initialGuide && !opened.current) {
      opened.current = true;
      push({ name: "guide", guide: initialGuide });
    }
  }, [initialGuide, push]);

  const openGuide = (guide: Guide) => push({ name: "guide", guide });
  const openSimulation = (simulation: Simulation) => push({ name: "simulation", simulation });

  let detail = null;
  switch (route.name) {
    case "guide":
      detail = (
        <GuideScreen
          guide={route.guide}
          onBack={pop}
          onFinished={() => replace({ name: "simulations", guide: route.guide })}
        />
      );
      break;
    case "simulations":
      detail = (
        <SimulationList
          guide={route.guide}
          onBack={pop}
          onSelect={openSimulation}
          onOnly={(simulation) => replace({ name: "simulation", simulation })}
          onNone={pop}
        />
      );
      break;
    case "simulation":
      detail = <SimulationScreen simulation={route.simulation} onBack={pop} onExit={home} />;
      break;
  }

  return (
    <>
      <div hidden={route.name !== "root"} className="flex flex-col gap-8">
        {root === "guides" && (
          <GuideBrowser initialQuery={initialQuery} initialDeviceId={initialDeviceId} onOpen={openGuide} />
        )}
        {root === "diagnose" && <DiagnosisScreen onOpen={openGuide} />}
        {root === "simulations" && <SimulationsScreen onOpen={openSimulation} />}
      </div>
      {detail && <div className="max-w-2xl">{detail}</div>}
    </>
  );
}
