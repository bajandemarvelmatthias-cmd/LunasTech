import { CaretRight } from "@phosphor-icons/react";

export type Choice = { id: string; label: string; note?: string };

// Vertical list of tappable rows. Phosphor CaretRight on the right edge.
export function ChoiceList({
  items,
  onSelect,
}: Readonly<{ items: Choice[]; onSelect: (id: string) => void }>) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onSelect(item.id)}
            className="flex min-h-14 w-full items-center justify-between gap-4 rounded-md border border-border bg-surface px-4 py-2 text-left hover:bg-surface-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span>
              <span className="block text-base font-semibold">{item.label}</span>
              {item.note && <span className="block text-sm text-text-muted">{item.note}</span>}
            </span>
            <CaretRight className="size-6 shrink-0 text-text-muted" aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}
