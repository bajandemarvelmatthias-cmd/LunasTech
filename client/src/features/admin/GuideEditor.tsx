import { useRef, useState, type RefObject } from "react";
import { Check } from "@phosphor-icons/react";
import { Button, OutlineButton, TextButton } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  DIFFICULTY_LABEL,
  KIND_LABEL,
  type GuideDifficulty,
  type GuideKind,
  type GuideStep,
} from "@/features/guides/types";
import { useLoad } from "@/lib/useLoad";
import { confirmDiscard, EditorFrame, useEditorActions } from "./editorParts";
import { ImageField } from "./ImageField";
import {
  createSymptom,
  fetchDeviceOptions,
  fetchGuideDetail,
  fetchSymptomOptions,
  saveGuide,
  setGuideStatus,
} from "./api";
import {
  CATEGORY_LABEL,
  STATUS_LABEL,
  type DeviceOption,
  type GuideDetail,
  type Status,
  type StepDraft,
  type SymptomOption,
} from "./types";

const BLANK: GuideDetail = {
  id: null,
  title: "",
  description: "",
  kind: "small_fix",
  status: "draft",
  symptomId: "",
  difficulty: null,
  estimatedMinutes: null,
  coverImagePath: null,
  steps: [],
};

// A new guide starts with four empty steps to fill in.
const NEW_GUIDE_STEPS = 4;
const MAX_STEPS = 30;
const blankStep = (): StepDraft => ({ id: null, title: "", instruction: "", imagePath: null });

const KIND_OPTIONS = (Object.keys(KIND_LABEL) as GuideKind[]).map((k) => ({
  value: k,
  label: KIND_LABEL[k],
}));

const DIFFICULTY_OPTIONS = [
  { value: "", label: "Not set" },
  ...(Object.keys(DIFFICULTY_LABEL) as GuideDifficulty[]).map((d) => ({ value: d, label: DIFFICULTY_LABEL[d] })),
];

const STATUS_OPTIONS = (Object.keys(STATUS_LABEL) as Status[]).map((s) => ({ value: s, label: STATUS_LABEL[s] }));

type Props = {
  guideId: string | null;
  onBack: () => void;
  onSimulations: (guideId: string) => void;
};

// Loads the guide (or a blank one), the devices and the symptoms, then hands over to the form.
export function GuideEditor({ guideId, onBack, onSimulations }: Readonly<Props>) {
  // The form sets this when something is edited and clears it on save.
  const dirty = useRef(false);
  const { data, loading, error, retry } = useLoad(
    async () => {
      const [detail, symptoms, devices] = await Promise.all([
        guideId ? fetchGuideDetail(guideId) : Promise.resolve(BLANK),
        fetchSymptomOptions(),
        fetchDeviceOptions(),
      ]);
      return { detail, symptoms, devices };
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
        <EditorForm
          detail={data.detail}
          symptoms={data.symptoms}
          devices={data.devices}
          dirty={dirty}
          onBack={onBack}
          onSimulations={onSimulations}
        />
      )}
    </EditorFrame>
  );
}

const toDrafts = (steps: GuideStep[]): StepDraft[] =>
  steps.map((s) => ({ id: s.id, title: s.title, instruction: s.instruction, imagePath: s.image_path }));

type FormProps = {
  detail: GuideDetail;
  symptoms: SymptomOption[];
  devices: DeviceOption[];
  dirty: RefObject<boolean>;
  onBack: () => void;
  onSimulations: (guideId: string) => void;
};

function EditorForm({ detail, symptoms: initialSymptoms, devices, dirty, onBack, onSimulations }: Readonly<FormProps>) {
  const { session } = useAuth();
  const userId = session?.user.id ?? "";

  const [guideId, setGuideId] = useState(detail.id);
  const [status, setStatus] = useState<Status>(detail.status);
  const [statusChoice, setStatusChoice] = useState<Status>(detail.status);
  const [original, setOriginal] = useState<GuideStep[]>(detail.steps);
  const [title, setTitle] = useState(detail.title);
  const [description, setDescription] = useState(detail.description);
  const [symptoms, setSymptoms] = useState(initialSymptoms);
  const [symptomId, setSymptomId] = useState(detail.symptomId);
  const [deviceId, setDeviceId] = useState(
    () => initialSymptoms.find((s) => s.id === detail.symptomId)?.deviceId ?? "",
  );
  const [kind, setKind] = useState<GuideKind>(detail.kind);
  const [difficulty, setDifficulty] = useState<GuideDifficulty | "">(detail.difficulty ?? "");
  const [minutes, setMinutes] = useState(detail.estimatedMinutes ? String(detail.estimatedMinutes) : "");
  const [coverPath, setCoverPath] = useState<string | null>(detail.coverImagePath);
  const [drafts, setDrafts] = useState<StepDraft[]>(() =>
    detail.id ? toDrafts(detail.steps) : Array.from({ length: NEW_GUIDE_STEPS }, blankStep),
  );
  const [stepsText, setStepsText] = useState(String(drafts.length));

  const device = devices.find((d) => d.id === deviceId);
  const categoryLabel = device ? (device.category ? CATEGORY_LABEL[device.category] : "Not set") : "Choose a device first";

  function updateDraft(index: number, patch: Partial<StepDraft>) {
    touch();
    setDrafts((list) => list.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  // "Planned repair steps": adds empty steps or removes steps from the end.
  // Applied when the field loses focus so typing "12" does not pass through "1".
  function applySteps() {
    const n = Number(stepsText);
    if (!/^\d{1,2}$/.test(stepsText) || n > MAX_STEPS) {
      setStepsText(String(drafts.length));
      return;
    }
    if (n === drafts.length) return;
    if (n > drafts.length) {
      edit(() => setDrafts((list) => [...list, ...Array.from({ length: n - list.length }, blankStep)]));
      return;
    }
    const hasWork = drafts.slice(n).some((d) => d.id || d.title.trim() || d.instruction.trim() || d.imagePath);
    if (hasWork && !window.confirm(`Remove ${drafts.length - n} step(s) from the end?`)) {
      setStepsText(String(drafts.length));
      return;
    }
    edit(() => setDrafts((list) => list.slice(0, n)));
  }

  // Returns a problem to show, or null when everything needed is filled in.
  function problem(): string | null {
    if (!title.trim()) return "Enter a title.";
    if (!deviceId) return "Choose a device.";
    if (!symptomId) return "Choose a symptom.";
    if (minutes.trim() && !/^[1-9]\d{0,3}$/.test(minutes.trim())) {
      return "Enter the time as a whole number of minutes.";
    }
    if (drafts.some((d) => !d.title.trim() || !d.instruction.trim())) {
      return "Every step needs a title and an instruction. Lower the number of steps to remove empty ones.";
    }
    return null;
  }

  async function persist(): Promise<string> {
    const saved = await saveGuide({
      guideId,
      userId,
      title: title.trim(),
      description: description.trim(),
      symptomId,
      kind,
      difficulty: difficulty || null,
      estimatedMinutes: minutes.trim() ? Number(minutes.trim()) : null,
      coverImagePath: coverPath,
      drafts: drafts.map((d) => ({ ...d, title: d.title.trim(), instruction: d.instruction.trim() })),
      original,
    });
    dirty.current = false;
    setGuideId(saved.id);
    setOriginal(saved.steps);
    setDrafts(toDrafts(saved.steps));
    setStepsText(String(saved.steps.length));
    return saved.id;
  }

  const { busy, message, touch, edit, save, toggleStatus } = useEditorActions({
    dirty,
    status,
    setStatus,
    stepCount: drafts.length,
    problem,
    persist,
    writeStatus: setGuideStatus,
  });

  // The publication status chosen in the form is applied together with the save.
  const onSave = () => void (statusChoice === status ? save() : toggleStatus());

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-widest text-text-muted">Repair guides</p>
        <h1 className="text-lg font-semibold">
          {guideId ? "Edit guide" : "Create guide"}
          <span className="text-accent">.</span>
        </h1>
        <p className="text-sm text-text-muted">A clear guide is the first step to a confident repair.</p>
      </div>

      <TextField label="Guide title" value={title} onChange={(e) => edit(() => setTitle(e.target.value))} />

      <div className="grid gap-6 md:grid-cols-2">
        <Select
          label="Device / model"
          value={deviceId}
          placeholder="Choose a device"
          options={devices.map((d) => ({ value: d.id, label: d.archived ? `${d.name} (archived)` : d.name }))}
          onChange={(e) =>
            edit(() => {
              setDeviceId(e.target.value);
              setSymptomId("");
            })
          }
        />
        <Select
          label="Device category"
          value=""
          disabled
          options={[{ value: "", label: categoryLabel }]}
          onChange={() => undefined}
        />
      </div>

      <Select
        label="Symptom"
        value={symptomId}
        placeholder={deviceId ? "Choose a symptom" : "Choose a device first"}
        disabled={!deviceId}
        options={symptoms.filter((s) => s.deviceId === deviceId).map((s) => ({ value: s.id, label: s.name }))}
        onChange={(e) => edit(() => setSymptomId(e.target.value))}
      />
      {deviceId && (
        <NewSymptom
          deviceId={deviceId}
          onCreated={(id, list) => {
            setSymptoms(list);
            setSymptomId(id);
            touch();
          }}
        />
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Select
          label="Difficulty"
          value={difficulty}
          options={DIFFICULTY_OPTIONS}
          onChange={(e) => edit(() => setDifficulty(e.target.value as GuideDifficulty | ""))}
        />
        <TextField
          label="Estimated time (minutes)"
          inputMode="numeric"
          help="For example: 30"
          value={minutes}
          onChange={(e) => edit(() => setMinutes(e.target.value))}
        />
        <TextField
          label="Planned repair steps"
          inputMode="numeric"
          help="Steps are written below."
          value={stepsText}
          onChange={(e) => setStepsText(e.target.value)}
          onBlur={applySteps}
        />
        <Select
          label="Guide type"
          value={kind}
          options={KIND_OPTIONS}
          onChange={(e) => edit(() => setKind(e.target.value as GuideKind))}
        />
      </div>

      <TextArea
        label="Guide description"
        rows={4}
        value={description}
        onChange={(e) => edit(() => setDescription(e.target.value))}
      />
      <ImageField
        label="Cover photo"
        folder="covers"
        path={coverPath}
        onChange={(path) => edit(() => setCoverPath(path))}
      />

      {drafts.length > 0 && <h2 className="border-t border-border pt-6 text-base font-semibold">Steps</h2>}
      {drafts.map((d, i) => (
        <fieldset key={d.id ?? `new-${i}`} className="flex flex-col gap-4">
          <legend className="mb-2 text-sm font-semibold">Step {i + 1}</legend>
          <TextField label="Title" value={d.title} onChange={(e) => updateDraft(i, { title: e.target.value })} />
          <TextArea
            label="Instruction"
            value={d.instruction}
            onChange={(e) => updateDraft(i, { instruction: e.target.value })}
          />
          <ImageField
            label="Step photo"
            folder="steps"
            path={d.imagePath}
            onChange={(path) => updateDraft(i, { imagePath: path })}
          />
        </fieldset>
      ))}

      <Select
        label="Publication status"
        value={statusChoice}
        options={STATUS_OPTIONS}
        onChange={(e) => edit(() => setStatusChoice(e.target.value as Status))}
      />

      {message && (
        <p
          role={message.error ? "alert" : "status"}
          className={message.error ? "text-sm text-danger" : "text-sm text-text-muted"}
        >
          {message.text}
        </p>
      )}
      <div className="flex items-center justify-end gap-4 border-t border-border pt-6">
        <OutlineButton onClick={() => confirmDiscard(dirty, onBack)} disabled={busy}>
          Cancel
        </OutlineButton>
        <Button className="flex w-auto items-center justify-center gap-2" onClick={onSave} loading={busy}>
          <Check className="size-5" aria-hidden="true" />
          {busy ? "Saving" : "Save guide"}
        </Button>
      </div>

      {guideId && (
        <p className="text-center text-base">
          <TextButton onClick={() => confirmDiscard(dirty, () => onSimulations(guideId))} disabled={busy}>
            Simulations
          </TextButton>
        </p>
      )}
    </div>
  );
}

// Symptoms must exist before a guide can use them. The new symptom belongs to
// the device already chosen in the form.
function NewSymptom({
  deviceId,
  onCreated,
}: Readonly<{ deviceId: string; onCreated: (id: string, list: SymptomOption[]) => void }>) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    if (!name.trim()) {
      setError("Enter a symptom name.");
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
