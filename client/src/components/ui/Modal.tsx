import { useEffect, useRef, type ReactNode } from "react";
import { X } from "@phosphor-icons/react";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

// Centered modal for one focused task (ux-ui-guidelines.md, modal vs panel).
// Built on the native dialog element: it traps focus, closes on Escape and
// returns focus to the control that opened it. A click on the dim area also
// closes it. Children mount only while open, so every opening starts blank.
export function Modal({
  open,
  title,
  onClose,
  children,
}: Readonly<{ open: boolean; title: string; onClose: () => void; children: ReactNode }>) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // The dialog element itself is only hit by the dim area; its content sits in the inner div.
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-border bg-surface p-0 text-text shadow-card backdrop:bg-brand/60"
    >
      {open && (
        <div className="flex flex-col gap-6 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className={`-mr-2 flex size-10 items-center justify-center rounded-md text-text-muted hover:text-text ${focus}`}
            >
              <X className="size-6" aria-hidden="true" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
