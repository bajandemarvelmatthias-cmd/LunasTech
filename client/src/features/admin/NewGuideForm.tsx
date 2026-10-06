import { useId, useState, type FormEvent } from "react";
import { Check } from "@phosphor-icons/react";
import { Button, OutlineButton, TextButton } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import { useAuth } from "@/features/auth/AuthProvider";
import { DIFFICULTY_LABEL, type GuideDifficulty, type GuideStep } from "@/features/guides/types";
import { useLoad } from "@/lib/useLoad";
import {
  createDevice,
  createSymptom,
  fetchDeviceOptions,
  fetchGuideDetail,
  fetchSymptomOptions,
  saveGuide,
  setGuideStatus,
} from "./api";
import { ImageField } from "./ImageField";
import {
  CATEGORY_LABEL,
  STATUS_LABEL,
  type DeviceCategory,
  type DeviceOption,
  type GuideDetail,
  type Status,
  type SymptomOption,
} from "./types";

const MAX_STEPS = 30;

// What the editor needs to continue from this form.
export type NewGuideStart = { planned: number; status: Status };

const CATEGORY_OPTIONS = (Object.keys(CATEGORY_LABEL) as DeviceCategory[]).map((c) => ({
  value: c,
  label: CATEGORY_LABEL[c],
}));
const DIFFICULTY_OPTIONS = (Object.keys(DIFFICULTY_LABEL) as GuideDifficulty[]).map((d) => ({
  value: d,
  label: DIFFICULTY_LABEL[d],
}));
// A guide saved before difficulty existed has none; editing must not invent one.
const DIFFICULTY_OPTIONS_EDIT = [{ value: "", label: "Not set" }, ...DIFFICULTY_OPTIONS];
const STATUS_OPTIONS = (Object.keys(STATUS_LABEL) as Status[]).map((s) => ({ value: s, label: STATUS_LABEL[s] }));

// Heading shown at the top of the "Create guide" / "Edit guide" dialog.
export function NewGuideHeading({ editing = false }: Readonly<{ editing?: boolean }>) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Repair guides</p>
      <h2 className="text-lg font-semibold">
        {editing ? "Edit guide" : "Create guide"}
        <span className="text-accent">.</span>
      </h2>
      <p className="text-sm text-text-muted">
        {editing ? "Update the details of this guide." : "A clear guide is the first step to a confident repair."}
      </p>
    </div>
  );
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

type Options = { devices: DeviceOption[]; symptoms: SymptomOption[] };

type Props = {
  // Set to edit an existing guide with the same form; omitted to create one.
  guideId?: string;
  // Create: the guide was saved as a draft; the step editor opens next.
  onCreated?: (guideId: string, start: NewGuideStart) => void;
  // Edit: the changes were saved.
  onSaved?: () => void;
  // Edit: open the step editor for this guide.
  onEditSteps?: (guideId: string) => void;
  onCancel: () => void;
};

// "Create guide" / "Edit guide" dialog. Both use the same fields. Type the
// device and symptom: an existing one is reused, a new one is created.
// Create saves the guide, then the editor opens for the steps. Edit saves the
// guide and leaves its steps as they are; Edit steps opens the step editor.
export function NewGuideForm({ guideId, onCreated, onSaved, onEditSteps, onCancel }: Readonly<Props>) {
  const { data, loading, error, retry } = useLoad(
    async () => {
      const [devices, symptoms, detail] = await Promise.all([
        fetchDeviceOptions(),
        fetchSymptomOptions(),
        guideId ? fetchGuideDetail(guideId) : Promise.resolve(null),
      ]);
      return { devices, symptoms, detail };
    },
    [guideId],
  );

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <p role="alert" className="text-sm text-danger">
          Can't load {guideId ? "this guide" : "devices"}. Check your connection and try again.
        </p>
        <Button onClick={retry}>Try again</Button>
      </div>
    );
  }
  if (loading || !data) return <p className="text-base text-text-muted">Loading</p>;

  return (
    <GuideFields
      options={{ devices: data.devices, symptoms: data.symptoms }}
      detail={data.detail}
      onCreated={onCreated}
      onSaved={onSaved}
      onEditSteps={onEditSteps}
      onCancel={onCancel}
    />
  );
}

const toDrafts = (steps: GuideStep[]) =>
  steps.map((st) => ({ id: st.id, title: st.title, instruction: st.instruction, imagePath: st.image_path }));

type FieldsProps = Omit<Props, "guideId"> & { options: Options; detail: GuideDetail | null };

function GuideFields({ options, detail, onCreated, onSaved, onEditSteps, onCancel }: Readonly<FieldsProps>) {
  const { session } = useAuth();
  const listId = useId();
  const symptomListId = useId();
  const data = options;
  const editing = detail !== null;

  // Existing guide: start from what is stored (its device is the symptom's device).
  const storedSymptom = detail ? data.symptoms.find((x) => x.id === detail.symptomId) : undefined;
  const storedDevice = storedSymptom ? data.devices.find((d) => d.id === storedSymptom.deviceId) : undefined;

  const [title, setTitle] = useState(detail?.title ?? "");
  const [device, setDevice] = useState(storedDevice?.name ?? "");
  const [category, setCategory] = useState<DeviceCategory>(storedDevice?.category ?? "smartphones");
  const [symptom, setSymptom] = useState(storedSymptom?.name ?? "");
  const [difficulty, setDifficulty] = useState<GuideDifficulty | "">(detail ? (detail.difficulty ?? "") : "easy");
  const [minutes, setMinutes] = useState(detail?.estimatedMinutes ? String(detail.estimatedMinutes) : "");
  const [stepsText, setStepsText] = useState(detail ? String(detail.steps.length) : "4");
  const [description, setDescription] = useState(detail?.description ?? "");
  const [coverPath, setCoverPath] = useState<string | null>(detail?.coverImagePath ?? null);
  const [status, setStatus] = useState<Status>(detail?.status ?? "draft");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string>();

  const existing = data.devices.find((d) => same(d.name, device));
  const deviceSymptoms = existing ? data.symptoms.filter((x) => x.deviceId === existing.id) : [];

  const edit = (change: () => void) => {
    setProblem(undefined);
    change();
  };

  function check(): string | null {
    if (!title.trim()) return "Enter a title.";
    if (!device.trim()) return "Enter the device or model.";
    if (!symptom.trim()) return "Enter the symptom, for example: Cracked screen.";
    if (minutes.trim() && !/^[1-9]\d{0,3}$/.test(minutes.trim())) return "Enter the time as a whole number of minutes.";
    if (editing) {
      if (status === "published" && detail.steps.length === 0) return "Add at least one step before publishing.";
      return null;
    }
    if (!/^\d{1,2}$/.test(stepsText) || Number(stepsText) < 1 || Number(stepsText) > MAX_STEPS) {
      return `Planned repair steps must be a number from 1 to ${MAX_STEPS}.`;
    }
    return null;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const found = check();
    if (found) {
      setProblem(found);
      return;
    }
    setBusy(true);
    setProblem(undefined);
    try {
      const deviceId =
        existing?.id ??
        (await createDevice({ name: device.trim(), manufacturer: "", category, notes: "", status: "active" }));
      const symptomId =
        deviceSymptoms.find((x) => same(x.name, symptom))?.id ?? (await createSymptom(deviceId, symptom.trim()));
      const saved = await saveGuide({
        guideId: detail?.id ?? null,
        userId: session?.user.id ?? "",
        title: title.trim(),
        description: description.trim(),
        symptomId,
        kind: detail?.kind ?? "small_fix",
        difficulty: difficulty || null,
        estimatedMinutes: minutes.trim() ? Number(minutes.trim()) : null,
        coverImagePath: coverPath,
        // Editing keeps every step exactly as stored; the step editor changes them.
        drafts: detail ? toDrafts(detail.steps) : [],
        original: detail?.steps ?? [],
      });
      if (detail) {
        if (status !== detail.status) await setGuideStatus(saved.id, status);
        onSaved?.();
        return;
      }
      // Publishing needs written steps, so the guide starts as a draft and the
      // chosen status is applied when the steps are saved in the editor.
      onCreated?.(saved.id, { planned: Number(stepsText), status });
    } catch {
      setProblem("Could not save. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => void submit(e)} noValidate>
      <TextField label="Guide title" value={title} onChange={(e) => edit(() => setTitle(e.target.value))} />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <TextField
            label="Device / model"
            list={listId}
            value={device}
            onChange={(e) => edit(() => setDevice(e.target.value))}
          />
          <datalist id={listId}>
            {data.devices
              .filter((d) => !d.archived)
              .map((d) => (
                <option key={d.id} value={d.name} />
              ))}
          </datalist>
        </div>
        <Select
          label="Device category"
          value={existing?.category ?? category}
          disabled={Boolean(existing?.category)}
          options={CATEGORY_OPTIONS}
          onChange={(e) => edit(() => setCategory(e.target.value as DeviceCategory))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <TextField
          label="Symptom"
          list={symptomListId}
          help="What is wrong with the device? For example: Cracked screen"
          value={symptom}
          onChange={(e) => edit(() => setSymptom(e.target.value))}
        />
        <datalist id={symptomListId}>
          {deviceSymptoms.map((s) => (
            <option key={s.id} value={s.name} />
          ))}
        </datalist>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Select
          label="Difficulty"
          value={difficulty}
          options={editing ? DIFFICULTY_OPTIONS_EDIT : DIFFICULTY_OPTIONS}
          onChange={(e) => edit(() => setDifficulty(e.target.value as GuideDifficulty | ""))}
        />
        <TextField
          label="Estimated time (minutes)"
          inputMode="numeric"
          help="For example: 30"
          value={minutes}
          onChange={(e) => edit(() => setMinutes(e.target.value))}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <TextField
          label="Planned repair steps"
          inputMode="numeric"
          help={editing ? "Change the steps with Edit steps." : "You write each step next."}
          disabled={editing}
          value={stepsText}
          onChange={(e) => edit(() => setStepsText(e.target.value))}
        />
      </div>

      <TextArea
        label="Guide description"
        rows={4}
        value={description}
        onChange={(e) => edit(() => setDescription(e.target.value))}
      />
      <ImageField label="Cover image" folder="covers" path={coverPath} onChange={(p) => edit(() => setCoverPath(p))} />

      <div className="grid gap-6 md:grid-cols-2">
        <Select
          label="Publication status"
          value={status}
          options={STATUS_OPTIONS}
          onChange={(e) => edit(() => setStatus(e.target.value as Status))}
        />
      </div>

      {problem && (
        <p role="alert" className="text-sm text-danger">
          {problem}
        </p>
      )}
      <div className="flex items-center gap-4 border-t border-border pt-6">
        {editing && detail.id && (
          <TextButton onClick={() => onEditSteps?.(detail.id as string)} disabled={busy}>
            Edit steps
          </TextButton>
        )}
        <span className="flex-1" />
        <OutlineButton onClick={onCancel} disabled={busy}>
          Cancel
        </OutlineButton>
        <Button type="submit" className="flex w-auto items-center justify-center gap-2" loading={busy}>
          <Check className="size-5" aria-hidden="true" />
          {busy ? "Saving" : "Save guide"}
        </Button>
      </div>
    </form>
  );
}
