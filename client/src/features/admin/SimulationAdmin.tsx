import { useRef, useState, type RefObject } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { Button, TextButton } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import { ListScreen } from "@/features/guides/ListScreen";
import { DISCARD_PROMPT } from "./GuideEditor";
import { useLoad } from "@/lib/useLoad";
import {
  fetchAdminSimulations,
  fetchSimulationDetail,
  saveSimulation,
  setSimulationStatus,
} from "./api";
import {
  MAX_OPTIONS,
  MIN_OPTIONS,
  STATUS_LABEL,
  type SimStepDraft,
  type SimStepFull,
  type SimulationDetail,
  type Status,
} from "./types";

// Simulations of one guide. Opened from the guide editor (saved guides only).
export function SimulationAdminList({
  guideId,
  onBack,
  onOpen,
}: Readonly<{ guideId: string; onBack: () => void; onOpen: (simulationId: string | null) => void }>) {
  const { data, loading, error, retry } = useLoad(() => fetchAdminSimulations(guideId), [guideId]);
  return (
    <ListScreen
      title="Simulations"
      onBack={onBack}
      loading={loading}
      error={error}
      onRetry={retry}
      items={data?.map((s) => ({ id: s.id, label: s.title, note: STATUS_LABEL[s.status] })) ?? null}
      empty="No simulations yet."
      onSelect={onOpen}
      action={<Button onClick={() => onOpen(null)}>New simulation</Button>}
    />
  );
}

const BLANK: SimulationDetail = { id: null, title: "", status: "draft", steps: [] };

export function SimulationEditor({
  guideId,
  simulationId,
  onBack,
}: Readonly<{ guideId: string; simulationId: string | null; onBack: () => void }>) {
  const dirty = useRef(false);
  const { data, loading, error, retry } = useLoad(
    () => (simulationId ? fetchSimulationDetail(simulationId) : Promise.resolve(BLANK)),
    [simulationId],
  );
  return (
    <div className="flex flex-col gap-6 pb-12">
      <BackButton onClick={() => (!dirty.current || window.confirm(DISCARD_PROMPT)) && onBack()} />
      {loading && <p className="text-base text-text-muted">Loading</p>}
      {!loading && (error || !data) && (
        <div className="flex flex-col gap-4">
          <p role="alert" className="text-sm text-danger">
            Can't load this simulation. Check your connection and try again.
          </p>
          <Button onClick={retry}>Try again</Button>
        </div>
      )}
      {!loading && data && <SimulationForm guideId={guideId} detail={data} dirty={dirty} />}
    </div>
  );
}

const toDrafts = (steps: SimStepFull[]): SimStepDraft[] =>
  steps.map((s) => ({
    id: s.id,
    prompt: s.prompt,
    options: s.options,
    correct: s.correct_option,
    feedback: s.feedback,
  }));

const NEW_STEP: SimStepDraft = { id: null, prompt: "", options: ["", ""], correct: null, feedback: "" };

function SimulationForm({
  guideId,
  detail,
  dirty,
}: Readonly<{ guideId: string; detail: SimulationDetail; dirty: RefObject<boolean> }>) {
  const [simulationId, setSimulationId] = useState(detail.id);
  const [status, setStatus] = useState<Status>(detail.status);
  const [original, setOriginal] = useState<SimStepFull[]>(detail.steps);
  const [title, setTitle] = useState(detail.title);
  const [drafts, setDrafts] = useState<SimStepDraft[]>(toDrafts(detail.steps));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  function touch() {
    dirty.current = true;
    setMessage(null);
  }

  function update(index: number, patch: Partial<SimStepDraft>) {
    touch();
    setDrafts((list) => list.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  function setOption(index: number, optionIndex: number, text: string) {
    update(index, { options: drafts[index].options.map((o, k) => (k === optionIndex ? text : o)) });
  }

  // Removing the last option clears the correct answer if it pointed at it.
  function removeOption(index: number) {
    const d = drafts[index];
    const options = d.options.slice(0, -1);
    update(index, { options, correct: d.correct !== null && d.correct >= options.length ? null : d.correct });
  }

  function problem(): string | null {
    if (!title.trim()) return "Enter a title.";
    for (const d of drafts) {
      if (!d.prompt.trim() || d.options.some((o) => !o.trim()) || !d.feedback.trim()) {
        return "Every step needs a question, all its options and feedback.";
      }
      if (d.correct === null) return "Choose the correct answer for every step.";
    }
    return null;
  }

  async function persist(): Promise<string> {
    const saved = await saveSimulation({
      simulationId,
      guideId,
      title: title.trim(),
      drafts: drafts.map((d) => ({
        ...d,
        prompt: d.prompt.trim(),
        feedback: d.feedback.trim(),
        options: d.options.map((o) => o.trim()),
      })),
      original,
    });
    dirty.current = false;
    setSimulationId(saved.id);
    setOriginal(saved.steps);
    setDrafts(toDrafts(saved.steps));
    return saved.id;
  }

  async function run(action: () => Promise<string>) {
    const found = problem();
    if (found) {
      setMessage({ text: found, error: true });
      return;
    }
    const removing = original.filter((o) => !drafts.some((d) => d.id === o.id)).length;
    if (
      removing > 0 &&
      !window.confirm(
        `Removing ${removing === 1 ? "this step" : `these ${removing} steps`} also deletes users' results for ${removing === 1 ? "it" : "them"}. Remove anyway?`,
      )
    ) {
      return;
    }
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

  // Users only see a simulation when it and its guide are both published.
  const toggleStatus = () => {
    const next: Status = status === "published" ? "draft" : "published";
    if (next === "published" && drafts.length === 0) {
      setMessage({ text: "Add at least one step before publishing.", error: true });
      return;
    }
    return run(async () => {
      const id = await persist();
      await setSimulationStatus(id, next);
      setStatus(next);
      return next === "published" ? "Published" : "Moved to drafts";
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">{simulationId ? "Edit simulation" : "New simulation"}</h1>
      <p className="text-sm text-text-muted">{STATUS_LABEL[status]}</p>
      <TextField
        label="Title"
        value={title}
        onChange={(e) => {
          touch();
          setTitle(e.target.value);
        }}
      />

      {drafts.map((d, i) => (
        <fieldset key={d.id ?? `new-${i}`} className="flex flex-col gap-4">
          <legend className="mb-2 text-sm font-semibold">Step {i + 1}</legend>
          <TextArea label="Question" rows={3} value={d.prompt} onChange={(e) => update(i, { prompt: e.target.value })} />
          {d.options.map((o, k) => (
            <TextField
              key={`${d.id ?? "new"}-${i}-option-${k}`}
              label={`Option ${k + 1}`}
              value={o}
              onChange={(e) => setOption(i, k, e.target.value)}
            />
          ))}
          <div className="flex gap-6">
            {d.options.length < MAX_OPTIONS && (
              <TextButton onClick={() => update(i, { options: [...d.options, ""] })}>Add option</TextButton>
            )}
            {d.options.length > MIN_OPTIONS && (
              <TextButton onClick={() => removeOption(i)}>Remove option {d.options.length}</TextButton>
            )}
          </div>
          <Select
            label="Correct answer"
            value={d.correct === null ? "" : String(d.correct)}
            placeholder="Choose the correct option"
            options={d.options.map((_, k) => ({ value: String(k), label: `Option ${k + 1}` }))}
            onChange={(e) => update(i, { correct: Number(e.target.value) })}
          />
          <TextArea label="Feedback" rows={3} value={d.feedback} onChange={(e) => update(i, { feedback: e.target.value })} />
          {i === drafts.length - 1 && (
            <TextButton
              className="self-start"
              onClick={() => {
                touch();
                setDrafts((list) => list.slice(0, -1));
              }}
            >
              Remove step {i + 1}
            </TextButton>
          )}
        </fieldset>
      ))}
      <TextButton
        className="self-start"
        onClick={() => {
          touch();
          setDrafts((list) => [...list, NEW_STEP]);
        }}
      >
        Add step
      </TextButton>

      {message && (
        <p
          role={message.error ? "alert" : "status"}
          className={message.error ? "text-sm text-danger" : "text-sm text-text-muted"}
        >
          {message.text}
        </p>
      )}
      <Button onClick={save} loading={busy}>
        {busy ? "Saving" : "Save"}
      </Button>
      <p className="text-center text-base">
        <TextButton onClick={toggleStatus} disabled={busy}>
          {status === "published" ? "Move to drafts" : "Publish"}
        </TextButton>
      </p>
    </div>
  );
}
