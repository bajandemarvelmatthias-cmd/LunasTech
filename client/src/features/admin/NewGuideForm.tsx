import { useId, useState, type FormEvent } from "react";
import { Check } from "@phosphor-icons/react";
import { Button, OutlineButton } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import { useAuth } from "@/features/auth/AuthProvider";
import { DIFFICULTY_LABEL, type GuideDifficulty } from "@/features/guides/types";
import { useLoad } from "@/lib/useLoad";
import { createDevice, createSymptom, fetchDeviceOptions, fetchSymptomOptions, saveGuide } from "./api";
import { ImageField } from "./ImageField";
import { CATEGORY_LABEL, STATUS_LABEL, type DeviceCategory, type Status } from "./types";

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
const STATUS_OPTIONS = (Object.keys(STATUS_LABEL) as Status[]).map((s) => ({ value: s, label: STATUS_LABEL[s] }));

// Heading shown at the top of the "Create guide" dialog.
export function NewGuideHeading() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Repair guides</p>
      <h2 className="text-lg font-semibold">
        Create guide<span className="text-accent">.</span>
      </h2>
      <p className="text-sm text-text-muted">A clear guide is the first step to a confident repair.</p>
    </div>
  );
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

// "Create guide" dialog. Type the device and symptom: an existing one is reused,
// a new one is created. The guide is saved, then the editor opens for the steps.
export function NewGuideForm({
  onCreated,
  onCancel,
}: Readonly<{ onCreated: (guideId: string, start: NewGuideStart) => void; onCancel: () => void }>) {
  const { session } = useAuth();
  const listId = useId();
  const symptomListId = useId();
  const { data, loading, error, retry } = useLoad(
    async () => {
      const [devices, symptoms] = await Promise.all([fetchDeviceOptions(), fetchSymptomOptions()]);
      return { devices, symptoms };
    },
    [],
  );

  const [title, setTitle] = useState("");
  const [device, setDevice] = useState("");
  const [category, setCategory] = useState<DeviceCategory>("smartphones");
  const [symptom, setSymptom] = useState("");
  const [difficulty, setDifficulty] = useState<GuideDifficulty>("easy");
  const [minutes, setMinutes] = useState("");
  const [stepsText, setStepsText] = useState("4");
  const [description, setDescription] = useState("");
  const [coverPath, setCoverPath] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("draft");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string>();

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <p role="alert" className="text-sm text-danger">
          Can't load devices. Check your connection and try again.
        </p>
        <Button onClick={retry}>Try again</Button>
      </div>
    );
  }
  if (loading || !data) return <p className="text-base text-text-muted">Loading</p>;

  const existing = data.devices.find((d) => same(d.name, device));
  const deviceSymptoms = existing ? data.symptoms.filter((s) => s.deviceId === existing.id) : [];

  const edit = (change: () => void) => {
    setProblem(undefined);
    change();
  };

  function check(): string | null {
    if (!title.trim()) return "Enter a title.";
    if (!device.trim()) return "Enter the device or model.";
    if (!symptom.trim()) return "Enter the symptom, for example: Cracked screen.";
    if (minutes.trim() && !/^[1-9]\d{0,3}$/.test(minutes.trim())) return "Enter the time as a whole number of minutes.";
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
        (await createDevice({ name: device.trim(), category, notes: "", status: "active" }));
      const symptomId =
        deviceSymptoms.find((s) => same(s.name, symptom))?.id ?? (await createSymptom(deviceId, symptom.trim()));
      const saved = await saveGuide({
        guideId: null,
        userId: session?.user.id ?? "",
        title: title.trim(),
        description: description.trim(),
        symptomId,
        kind: "small_fix",
        difficulty,
        estimatedMinutes: minutes.trim() ? Number(minutes.trim()) : null,
        coverImagePath: coverPath,
        drafts: [],
        original: [],
      });
      // Publishing needs written steps, so the guide starts as a draft and the
      // chosen status is applied when the steps are saved in the editor.
      onCreated(saved.id, { planned: Number(stepsText), status });
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
          options={DIFFICULTY_OPTIONS}
          onChange={(e) => edit(() => setDifficulty(e.target.value as GuideDifficulty))}
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
          help="You write each step next."
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
      <div className="flex items-center justify-end gap-4 border-t border-border pt-6">
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
