import { useRef, useState, type RefObject } from "react";
import { Button, TextButton } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import { ListScreen } from "@/features/guides/ListScreen";
import { useLoad } from "@/lib/useLoad";
import { AddStepButton, EditorFrame, RemoveStepButton, SaveBar, useEditorActions } from "./editorParts";
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
    <EditorFrame
      dirty={dirty}
      onBack={onBack}
      loading={loading}
      failed={Boolean(error) || !data}
      errorText="Can't load this simulation. Check your connection and try again."
      onRetry={retry}
    >
      {data && <SimulationForm guideId={guideId} detail={data} dirty={dirty} />}
    </EditorFrame>
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

  // Removing steps also deletes users' results for them, so ask first.
  function approveRemoval(): boolean {
    const removing = original.filter((o) => !drafts.some((d) => d.id === o.id)).length;
    if (removing === 0) return true;
    const what = removing === 1 ? "this step" : `these ${removing} steps`;
    const them = removing === 1 ? "it" : "them";
    return window.confirm(`Removing ${what} also deletes users' results for ${them}. Remove anyway?`);
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

  // Users only see a simulation when it and its guide are both published.
  const { busy, message, touch, edit, save, toggleStatus } = useEditorActions({
    dirty,
    status,
    setStatus,
    stepCount: drafts.length,
    problem,
    approve: approveRemoval,
    persist,
    writeStatus: setSimulationStatus,
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">{simulationId ? "Edit simulation" : "New simulation"}</h1>
      <p className="text-sm text-text-muted">{STATUS_LABEL[status]}</p>
      <TextField
        label="Title"
        value={title}
        onChange={(e) => edit(() => setTitle(e.target.value))}
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
            <RemoveStepButton number={i + 1} onRemove={() => edit(() => setDrafts((list) => list.slice(0, -1)))} />
          )}
        </fieldset>
      ))}
      <AddStepButton onAdd={() => edit(() => setDrafts((list) => [...list, NEW_STEP]))} />

      <SaveBar message={message} busy={busy} status={status} onSave={save} onToggleStatus={toggleStatus} />
    </div>
  );
}
