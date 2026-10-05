import { useEffect } from "react";
import { ListScreen } from "@/features/guides/ListScreen";
import type { Guide } from "@/features/guides/types";
import { useLoad } from "@/lib/useLoad";
import { fetchSimulations } from "./api";
import type { Simulation } from "./types";

type Props = {
  guide: Guide;
  onBack: () => void;
  onSelect: (simulation: Simulation) => void;
  // One simulation needs no choice, none means there is nothing to show.
  onOnly: (simulation: Simulation) => void;
  onNone: () => void;
};

// Shown after a guide is finished. Automatic when 0 or 1 simulation exists.
export function SimulationList({ guide, onBack, onSelect, onOnly, onNone }: Readonly<Props>) {
  const { data, loading, error, retry } = useLoad(() => fetchSimulations(guide.id), [guide.id]);
  const only = data?.length === 1 ? data[0] : null;
  const none = data?.length === 0;

  useEffect(() => {
    if (only) onOnly(only);
    else if (none) onNone();
    // Callbacks change identity every render; `only` and `none` are the triggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [only, none]);

  return (
    <ListScreen
      title="Simulation"
      onBack={onBack}
      loading={loading || only !== null || !!none}
      error={error}
      onRetry={retry}
      items={data?.map((s) => ({ id: s.id, label: s.title })) ?? null}
      empty="No simulations yet."
      onSelect={(id) => {
        const simulation = data?.find((s) => s.id === id);
        if (simulation) onSelect(simulation);
      }}
    />
  );
}
