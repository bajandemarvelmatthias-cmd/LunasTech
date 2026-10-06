import { useState } from "react";
import { ArrowRight, Clock, ListNumbers } from "@phosphor-icons/react";
import { Button, TextButton } from "@/components/ui/Button";
import { GuideImage } from "@/components/ui/GuideImage";
import { cn } from "@/lib/utils";
import { useLoad } from "@/lib/useLoad";
import { fetchAllGuides } from "./api";
import { DEVICE_CATEGORY_LABEL, DIFFICULTY_LABEL, type DeviceCategory, type Guide } from "./types";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

type Filter = "all" | DeviceCategory;

const CATEGORIES = Object.keys(DEVICE_CATEGORY_LABEL) as DeviceCategory[];

// The Repair Guides home: every published guide as a photo card, with a filter
// by device category. The device and symptom path stays one tap away for people
// who do not know which guide they need.
export function GuideBrowse({
  onSelect,
  onFindBySymptom,
}: Readonly<{ onSelect: (guide: Guide) => void; onFindBySymptom: () => void }>) {
  const { data, loading, error, retry } = useLoad(fetchAllGuides, []);
  const [filter, setFilter] = useState<Filter>("all");

  const guides = (data ?? []).filter((g) => filter === "all" || g.device_category === filter);

  let body;
  if (loading) {
    body = <p className="text-base text-text-muted">Loading</p>;
  } else if (error || !data) {
    body = (
      <div className="flex max-w-sm flex-col gap-4">
        <p role="alert" className="text-sm text-danger">
          Can't load the guides. Check your connection and try again.
        </p>
        <Button onClick={retry}>Try again</Button>
      </div>
    );
  } else if (guides.length === 0) {
    body = (
      <p className="text-base text-text-muted">
        {data.length === 0 ? "No guides yet." : "No guides for this device type yet."}
      </p>
    );
  } else {
    body = (
      <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {guides.map((g) => (
          <li key={g.id}>
            <GuideCard guide={g} onSelect={onSelect} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
          Learn. Diagnose. Repair.
        </p>
        <h1 className="text-lg font-semibold">
          Repair Guides<span className="text-accent">.</span>
        </h1>
        <p className="text-sm text-text-muted">Find the right guide. Build the confidence to repair.</p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <fieldset className="m-0 flex min-w-0 flex-wrap gap-3 border-0 p-0">
          <legend className="sr-only">Device type</legend>
          {(["all", ...CATEGORIES] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={f === filter}
              onClick={() => setFilter(f)}
              className={cn(
                "h-10 rounded-md border px-4 text-base",
                f === filter
                  ? "border-accent bg-accent-soft font-semibold text-accent"
                  : "border-border bg-surface text-text-muted hover:text-text",
                focus,
              )}
            >
              {f === "all" ? "All devices" : DEVICE_CATEGORY_LABEL[f]}
            </button>
          ))}
        </fieldset>
        {data && (
          <p className="text-sm text-text-muted" aria-live="polite">
            {guides.length} {guides.length === 1 ? "guide" : "guides"}
          </p>
        )}
      </div>

      {body}

      <p className="text-base text-text-muted">
        Not sure which guide you need? <TextButton onClick={onFindBySymptom}>Find one by device and symptom</TextButton>
      </p>
    </div>
  );
}

function GuideCard({ guide: g, onSelect }: Readonly<{ guide: Guide; onSelect: (guide: Guide) => void }>) {
  return (
    <button
      type="button"
      onClick={() => onSelect(g)}
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-lg border border-border bg-surface text-left shadow-card hover:border-accent",
        focus,
      )}
    >
      <span className="relative block">
        <GuideImage path={g.cover_image_path} placeholder className="aspect-[12/5] w-full" />
        {g.difficulty && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-md bg-surface px-2 py-1 text-sm font-semibold text-accent">
            <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
            {DIFFICULTY_LABEL[g.difficulty]}
          </span>
        )}
      </span>
      <span className="flex flex-1 flex-col gap-2 p-4">
        {g.device_name && <span className="truncate text-sm text-text-muted">{g.device_name}</span>}
        <span className="text-base font-semibold">{g.title}</span>
        <span className="mt-auto flex items-center gap-4 border-t border-border pt-4 text-sm text-text-muted">
          {g.estimated_minutes ? (
            <span className="flex items-center gap-1">
              <Clock className="size-4" aria-hidden="true" />
              {g.estimated_minutes} min
            </span>
          ) : null}
          {g.step_count ? (
            <span className="flex items-center gap-1">
              <ListNumbers className="size-4" aria-hidden="true" />
              {g.step_count} {g.step_count === 1 ? "step" : "steps"}
            </span>
          ) : null}
          <ArrowRight className="ml-auto size-5" aria-hidden="true" />
        </span>
      </span>
    </button>
  );
}
