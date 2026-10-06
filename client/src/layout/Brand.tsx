import { Wrench } from "@phosphor-icons/react";

// Logo mark (Phosphor Wrench) and wordmark.
export function Brand() {
  return (
    <span className="flex items-center gap-3">
      <span className="flex size-10 items-center justify-center rounded-md bg-accent text-accent-text">
        <Wrench className="size-6" aria-hidden="true" />
      </span>
      <span className="text-lg font-semibold">LunasTech</span>
    </span>
  );
}
