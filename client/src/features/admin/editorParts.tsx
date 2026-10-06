import { useState, type ReactNode, type RefObject } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { Button, TextButton } from "@/components/ui/Button";
import { type Status } from "./types";

export const DISCARD_PROMPT = "Discard your unsaved changes?";

// Asks before throwing away unsaved edits, then runs `action`.
export function confirmDiscard(dirty: RefObject<boolean>, action: () => void) {
  if (!dirty.current || window.confirm(DISCARD_PROMPT)) action();
}

// Back button, loading text and the load-error panel shared by both editors.
// `children` is the form, shown once the data has loaded.
export function EditorFrame({
  dirty,
  onBack,
  loading,
  failed,
  errorText,
  onRetry,
  children,
}: Readonly<{
  dirty: RefObject<boolean>;
  onBack: () => void;
  loading: boolean;
  failed: boolean;
  errorText: string;
  onRetry: () => void;
  children: ReactNode;
}>) {
  return (
    <div className="flex flex-col gap-6 pb-12">
      <BackButton onClick={() => confirmDiscard(dirty, onBack)} />
      {loading && <p className="text-base text-text-muted">Loading</p>}
      {!loading && failed && (
        <div className="flex flex-col gap-4">
          <p role="alert" className="text-sm text-danger">
            {errorText}
          </p>
          <Button onClick={onRetry}>Try again</Button>
        </div>
      )}
      {!loading && !failed && children}
    </div>
  );
}

export type Message = { text: string; error: boolean };

type ActionsInput = {
  dirty: RefObject<boolean>;
  status: Status;
  setStatus: (status: Status) => void;
  stepCount: number;
  // A problem to show, or null when everything needed is filled in.
  problem: () => string | null;
  // Optional last check before a write (for example a confirm dialog).
  approve?: () => boolean;
  // Saves the form and returns the stored id.
  persist: () => Promise<string>;
  // Writes the new status for the stored id.
  writeStatus: (id: string, next: Status) => Promise<void>;
};

// Save, publish and message handling shared by both editors.
export function useEditorActions(input: ActionsInput) {
  const { dirty, status, setStatus, stepCount, problem, approve, persist, writeStatus } = input;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  // Call whenever the form is edited.
  function touch() {
    dirty.current = true;
    setMessage(null);
  }

  async function run(action: () => Promise<string>) {
    const found = problem();
    if (found) {
      setMessage({ text: found, error: true });
      return;
    }
    if (approve && !approve()) return;
    setBusy(true);
    try {
      setMessage({ text: await action(), error: false });
    } catch {
      setMessage({ text: "Could not save. Check your connection and try again.", error: true });
    } finally {
      setBusy(false);
    }
  }

  const save = () =>
    run(async () => {
      await persist();
      return "Saved";
    });

  // Publishing is the admin's decision. It saves first so what is published
  // is what is on screen.
  const toggleStatus = () => {
    const next: Status = status === "published" ? "draft" : "published";
    if (next === "published" && stepCount === 0) {
      setMessage({ text: "Add at least one step before publishing.", error: true });
      return;
    }
    return run(async () => {
      await writeStatus(await persist(), next);
      setStatus(next);
      return next === "published" ? "Published" : "Moved to drafts";
    });
  };

  return { busy, message, touch, save, toggleStatus };
}

// Message line, Save button and Publish / Move to drafts link.
export function SaveBar({
  message,
  busy,
  status,
  onSave,
  onToggleStatus,
}: Readonly<{
  message: Message | null;
  busy: boolean;
  status: Status;
  onSave: () => void;
  onToggleStatus: () => void;
}>) {
  return (
    <>
      {message && (
        <p
          role={message.error ? "alert" : "status"}
          className={message.error ? "text-sm text-danger" : "text-sm text-text-muted"}
        >
          {message.text}
        </p>
      )}
      <Button onClick={onSave} loading={busy}>
        {busy ? "Saving" : "Save"}
      </Button>
      <p className="text-center text-base">
        <TextButton onClick={onToggleStatus} disabled={busy}>
          {status === "published" ? "Move to drafts" : "Publish"}
        </TextButton>
      </p>
    </>
  );
}

// "Remove step N" (last step only) and "Add step", used under the step list.
export function RemoveStepButton({
  number,
  onRemove,
}: Readonly<{ number: number; onRemove: () => void }>) {
  return (
    <TextButton className="self-start" onClick={onRemove}>
      Remove step {number}
    </TextButton>
  );
}

export function AddStepButton({ onAdd }: Readonly<{ onAdd: () => void }>) {
  return (
    <TextButton className="self-start" onClick={onAdd}>
      Add step
    </TextButton>
  );
}
