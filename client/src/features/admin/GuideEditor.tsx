import { useRef, useState, type RefObject } from "react";
import { TextButton } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import { useAuth } from "@/features/auth/AuthProvider";
import { fetchDevices } from "@/features/guides/api";
import { KIND_LABEL, type GuideKind, type GuideStep } from "@/features/guides/types";
import { useLoad } from "@/lib/useLoad";
import {
  AddStepButton,
  confirmDiscard,
  EditorFrame,
  RemoveStepButton,
  SaveBar,
  useEditorActions,
} from "./editorParts";
import {
  createSymptom,
  fetchGuideDetail,
  fetchSymptomOptions,
  saveGuide,
  setGuideStatus,
} from "./api";
import { STATUS_LABEL, type GuideDetail, type Status, type StepDraft, type SymptomOption } from "./types";

const BLANK: GuideDetail = {
  id: null,
  title: "",
  kind: "small_fix",
  status: "draft",
  symptomId: "",
  steps: [],
};

const KIND_OPTIONS = (Object.keys(KIND_LABEL) as GuideKind[]).map((k) => ({
  value: k,
  label: KIND_LABEL[k],
}));

type Props = {
  guideId: string | null;
  onBack: () => void;
  onSimulations: (guideId: string) => void;
};

// Loads the guide (or a blank one) and the symptom list, then hands over to the form.
export function GuideEditor({ guideId, onBack, onSimulations }: Readonly<Props>) {
  // The form sets this when something is edited and clears it on save.
  const dirty = useRef(false);
  const { data, loading, error, retry } = useLoad(
    async () => {
      const [detail, symptoms] = await Promise.all([
        guideId ? fetchGuideDetail(guideId) : Promise.resolve(BLANK),
        fetchSymptomOptions(),
      ]);
      return { detail, symptoms };
    },
    [guideId],
  );

  return (
    <EditorFrame
      dirty={dirty}
      onBack={onBack}
      loading={loading}
      failed={Boolean(error) || !data}
      errorText="Can't load this guide. Check your connection and try again."
      onRetry={retry}
    >
      {data && (
        <EditorForm detail={data.detail} symptoms={data.symptoms} dirty={dirty} onSimulations={onSimulations} />
      )}
    </EditorFrame>
  );
}

const toDrafts = (steps: GuideStep[]): StepDraft[] =>
  steps.map((s) => ({ id: s.id, title: s.title, instruction: s.instruction }));

function EditorForm({
  detail,
  symptoms: initialSymptoms,
  dirty,
  onSimulations,
}: Readonly<{
  detail: GuideDetail;
  symptoms: SymptomOption[];
  dirty: RefObject<boolean>;
  onSimulations: (guideId: string) => void;
}>) {
  const { session } = useAuth();
  const userId = session?.user.id ?? "";

  const [guideId, setGuideId] = useState(detail.id);
  const [status, setStatus] = useState<Status>(detail.status);
  const [original, setOriginal] = useState<GuideStep[]>(detail.steps);
  const [title, setTitle] = useState(detail.title);
  const [symptomId, setSymptomId] = useState(detail.symptomId);
  const [kind, setKind] = useState<GuideKind>(detail.kind);
  const [drafts, setDrafts] = useState<StepDraft[]>(toDrafts(detail.steps));
  const [symptoms, setSymptoms] = useState(initialSymptoms);

  function updateDraft(index: number, patch: Partial<StepDraft>) {
    touch();
    setDrafts((list) => list.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  // Returns a problem to show, or null when everything needed is filled in.
  function problem(): string | null {
    if (!title.trim()) return "Enter a title.";
    if (!symptomId) return "Choose a symptom.";
    if (drafts.some((d) => !d.title.trim() || !d.instruction.trim())) {
      return "Every step needs a title and an instruction.";
    }
    return null;
  }

  async function persist(): Promise<string> {
    const saved = await saveGuide({
      guideId,
      userId,
      title: title.trim(),
      symptomId,
      kind,
      drafts: drafts.map((d) => ({ ...d, title: d.title.trim(), instruction: d.instruction.trim() })),
      original,
    });
    dirty.current = false;
    setGuideId(saved.id);
    setOriginal(saved.steps);
    setDrafts(toDrafts(saved.steps));
    return saved.id;
  }

  const { busy, message, touch, save, toggleStatus } = useEditorActions({
    dirty,
    status,
    setStatus,
    stepCount: drafts.length,
    problem,
    persist,
    writeStatus: setGuideStatus,
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">{guideId ? "Edit guide" : "New guide"}</h1>
      <p className="text-sm text-text-muted">{STATUS_LABEL[status]}</p>

      <TextField label="Title" value={title} onChange={(e) => (touch(), setTitle(e.target.value))} />
      <Select
        label="Symptom"
        value={symptomId}
        placeholder="Choose a symptom"
        options={symptoms.map((s) => ({ value: s.id, label: s.label }))}
        onChange={(e) => (touch(), setSymptomId(e.target.value))}
      />
      <NewSymptom
        onCreated={(id, list) => {
          setSymptoms(list);
          setSymptomId(id);
          touch();
        }}
      />
      <Select
        label="Kind"
        value={kind}
        options={KIND_OPTIONS}
        onChange={(e) => (touch(), setKind(e.target.value as GuideKind))}
      />

      {drafts.map((d, i) => (
        <fieldset key={d.id ?? `new-${i}`} className="flex flex-col gap-4">
          <legend className="mb-2 text-sm font-semibold">Step {i + 1}</legend>
          <TextField label="Title" value={d.title} onChange={(e) => updateDraft(i, { title: e.target.value })} />
          <TextArea
            label="Instruction"
            value={d.instruction}
            onChange={(e) => updateDraft(i, { instruction: e.target.value })}
          />
          {i === drafts.length - 1 && (
            <RemoveStepButton number={i + 1} onRemove={() => (touch(), setDrafts((list) => list.slice(0, -1)))} />
          )}
        </fieldset>
      ))}
      <AddStepButton
        onAdd={() => (touch(), setDrafts((list) => [...list, { id: null, title: "", instruction: "" }]))}
      />

      <SaveBar message={message} busy={busy} status={status} onSave={save} onToggleStatus={toggleStatus} />
      {guideId && (
        <p className="text-center text-base">
          <TextButton
            onClick={() => confirmDiscard(dirty, () => onSimulations(guideId))}
            disabled={busy}
          >
            Simulations
          </TextButton>
        </p>
      )}
    </div>
  );
}

// Symptoms must exist before a guide can use them, and the table starts empty.
function NewSymptom({
  onCreated,
}: Readonly<{ onCreated: (id: string, list: SymptomOption[]) => void }>) {
  const [open, setOpen] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: devices } = useLoad(fetchDevices, []);

  async function add() {
    if (!deviceId || !name.trim()) {
      setError("Choose a device and enter a name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const id = await createSymptom(deviceId, name.trim());
      onCreated(id, await fetchSymptomOptions());
      setOpen(false);
      setName("");
    } catch {
      setError("Could not add the symptom. It may already exist for this device.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <TextButton className="self-start" onClick={() => setOpen(true)}>
        New symptom
      </TextButton>
    );
  }
  return (
    <div className="flex flex-col gap-4 rounded-md bg-surface-secondary p-4">
      <Select
        label="Device"
        value={deviceId}
        placeholder="Choose a device"
        options={(devices ?? []).map((d) => ({ value: d.id, label: d.name }))}
        onChange={(e) => setDeviceId(e.target.value)}
      />
      <TextField label="Symptom name" value={name} onChange={(e) => setName(e.target.value)} error={error ?? undefined} />
      <div className="flex gap-6">
        <TextButton onClick={add} disabled={busy}>
          {busy ? "Adding" : "Add symptom"}
        </TextButton>
        <TextButton onClick={() => setOpen(false)} disabled={busy}>
          Cancel
        </TextButton>
      </div>
    </div>
  );
}
