import { useEffect, useRef } from "react";
import { useHistoryStack } from "@/lib/useHistoryStack";
import { useLoad } from "@/lib/useLoad";
import { fetchDevices, fetchGuides, fetchSymptoms } from "./api";
import { GuideScreen } from "./GuideScreen";
import { ListScreen } from "./ListScreen";
import { SimulationList } from "@/features/simulations/SimulationList";
import { SimulationScreen } from "@/features/simulations/SimulationScreen";
import type { Simulation } from "@/features/simulations/types";
import { KIND_LABEL, type DeviceType, type Guide, type Symptom } from "./types";

type Route =
  | { name: "devices" }
  | { name: "symptoms"; device: DeviceType }
  | { name: "guides"; device: DeviceType; symptom: Symptom }
  | { name: "guide"; guide: Guide }
  | { name: "simulations"; guide: Guide }
  | { name: "simulation"; simulation: Simulation };

// Where the flow opens when the dashboard sends the person straight to a
// device's symptoms or to one guide. Back returns to the device list.
export type GuidesStart = Extract<Route, { name: "symptoms" | "guide" }>;

// Linear flow: device, symptom, matching guides, the guide itself, then its
// simulation (opened automatically when the guide has exactly one).
// State-based like AuthFlow. The browser back button goes back one screen
// (lib/useHistoryStack.ts); the URL does not change.
export function GuidesFlow({ start }: Readonly<{ start?: GuidesStart }>) {
  const { current: route, push, pop, replace, reset: home } = useHistoryStack<Route>({ name: "devices" });
  const seeded = useRef(false);

  useEffect(() => {
    if (start && !seeded.current) {
      seeded.current = true;
      push(start);
    }
  }, [start, push]);

  switch (route.name) {
    case "devices":
      return <DeviceList onSelect={(device) => push({ name: "symptoms", device })} />;
    case "symptoms":
      return (
        <SymptomList
          device={route.device}
          onBack={pop}
          onSelect={(symptom) => push({ name: "guides", device: route.device, symptom })}
        />
      );
    case "guides":
      return (
        <GuideList
          symptom={route.symptom}
          onBack={pop}
          onSelect={(guide) => push({ name: "guide", guide })}
          // Exactly one match needs no choice: open it and keep Back going to symptoms.
          onOnlyGuide={(guide) => replace({ name: "guide", guide })}
        />
      );
    case "guide":
      return (
        <GuideScreen
          guide={route.guide}
          onBack={pop}
          onFinished={() => replace({ name: "simulations", guide: route.guide })}
        />
      );
    case "simulations":
      return (
        <SimulationList
          guide={route.guide}
          onBack={pop}
          onSelect={(simulation) => push({ name: "simulation", simulation })}
          onOnly={(simulation) => replace({ name: "simulation", simulation })}
          onNone={pop}
        />
      );
    case "simulation":
      return <SimulationScreen simulation={route.simulation} onBack={pop} onExit={home} />;
  }
}

function DeviceList({ onSelect }: Readonly<{ onSelect: (device: DeviceType) => void }>) {
  const { data, loading, error, retry } = useLoad(fetchDevices, []);
  return (
    <ListScreen
      title="Device"
      loading={loading}
      error={error}
      onRetry={retry}
      items={data?.map((d) => ({ id: d.id, label: d.name })) ?? null}
      empty="No devices yet."
      onSelect={(id) => {
        const device = data?.find((d) => d.id === id);
        if (device) onSelect(device);
      }}
    />
  );
}

type SymptomListProps = {
  device: DeviceType;
  onBack: () => void;
  onSelect: (symptom: Symptom) => void;
};

function SymptomList({ device, onBack, onSelect }: Readonly<SymptomListProps>) {
  const { data, loading, error, retry } = useLoad(() => fetchSymptoms(device.id), [device.id]);
  return (
    <ListScreen
      title={`${device.name} symptoms`}
      onBack={onBack}
      loading={loading}
      error={error}
      onRetry={retry}
      items={data?.map((s) => ({ id: s.id, label: s.name })) ?? null}
      empty="No symptoms yet."
      onSelect={(id) => {
        const symptom = data?.find((s) => s.id === id);
        if (symptom) onSelect(symptom);
      }}
    />
  );
}

type GuideListProps = {
  symptom: Symptom;
  onBack: () => void;
  onSelect: (guide: Guide) => void;
  onOnlyGuide: (guide: Guide) => void;
};

function GuideList({ symptom, onBack, onSelect, onOnlyGuide }: Readonly<GuideListProps>) {
  const { data, loading, error, retry } = useLoad(() => fetchGuides(symptom.id), [symptom.id]);
  const only = data?.length === 1 ? data[0] : null;

  useEffect(() => {
    if (only) onOnlyGuide(only);
    // onOnlyGuide changes identity every render; `only` is the trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [only]);

  return (
    <ListScreen
      title={symptom.name}
      onBack={onBack}
      loading={loading || only !== null}
      error={error}
      onRetry={retry}
      items={
        data?.map((g) => ({ id: g.id, label: g.title, note: KIND_LABEL[g.kind] })) ?? null
      }
      empty="No guides yet."
      onSelect={(id) => {
        const guide = data?.find((g) => g.id === id);
        if (guide) onSelect(guide);
      }}
    />
  );
}
