import { useState, type FormEvent } from "react";
import { Button, TextButton } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { TextField } from "@/components/ui/TextField";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLoad } from "@/lib/useLoad";
import { createSymptom, fetchDeviceOptions, fetchSymptomOptions, isDuplicate, saveGuide } from "./api";

const NEW_SYMPTOM = "__new__";
const SAVE_FAILED = "Could not save. Check your connection and try again.";

// "Add guide": the same short form as "Add device". Only the essentials are
// asked here (title, device, symptom). The guide is saved as a draft and the
// full editor opens next for the steps, photos and the optional details.
export function NewGuideForm({
  onCreated,
  onCancel,
}: Readonly<{ onCreated: (guideId: string) => void; onCancel: () => void }>) {
  const { session } = useAuth();
  const { data, loading, error, retry } = useLoad(
    async () => {
      const [devices, symptoms] = await Promise.all([fetchDeviceOptions(), fetchSymptomOptions()]);
      return { devices: devices.filter((d) => !d.archived), symptoms };
    },
    [],
  );

  const [title, setTitle] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [symptomId, setSymptomId] = useState("");
  const [newSymptom, setNewSymptom] = useState("");
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

  const deviceSymptoms = data.symptoms.filter((s) => s.deviceId === deviceId);
  // A device with no symptoms yet goes straight to typing a new one.
  const adding = Boolean(deviceId) && (symptomId === NEW_SYMPTOM || deviceSymptoms.length === 0);
  const symptomName = newSymptom.trim();
  const ready = Boolean(title.trim() && deviceId && (adding ? symptomName : symptomId));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setProblem(undefined);
    try {
      const finalSymptomId = adding ? await createSymptom(deviceId, symptomName) : symptomId;
      const saved = await saveGuide({
        guideId: null,
        userId: session?.user.id ?? "",
        title: title.trim(),
        description: "",
        symptomId: finalSymptomId,
        kind: "small_fix",
        difficulty: null,
        estimatedMinutes: null,
        coverImagePath: null,
        drafts: [],
        original: [],
      });
      onCreated(saved.id);
    } catch (err) {
      setProblem(isDuplicate(err) ? "That device already has this symptom. Choose it from the list." : SAVE_FAILED);
      setBusy(false);
    }
  }

  let help: string | undefined;
  if (!ready) help = "Enter a title, choose a device and a symptom to continue.";

  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => void submit(e)}>
      <TextField
        label="Guide title"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setProblem(undefined);
        }}
        help={help}
      />
      <Select
        label="Device"
        placeholder="Choose a device"
        value={deviceId}
        options={data.devices.map((d) => ({ value: d.id, label: d.name }))}
        onChange={(e) => {
          setDeviceId(e.target.value);
          setSymptomId("");
          setNewSymptom("");
          setProblem(undefined);
        }}
      />
      {deviceId && deviceSymptoms.length > 0 && (
        <Select
          label="Symptom"
          placeholder="Choose a symptom"
          value={symptomId}
          options={[
            ...deviceSymptoms.map((s) => ({ value: s.id, label: s.name })),
            { value: NEW_SYMPTOM, label: "+ Add a new symptom" },
          ]}
          onChange={(e) => {
            setSymptomId(e.target.value);
            setProblem(undefined);
          }}
        />
      )}
      {adding && (
        <TextField
          label={deviceSymptoms.length === 0 ? "Symptom (what is wrong with it?)" : "New symptom"}
          value={newSymptom}
          onChange={(e) => {
            setNewSymptom(e.target.value);
            setProblem(undefined);
          }}
          error={problem}
        />
      )}
      {problem && !adding && (
        <p role="alert" className="text-sm text-danger">
          {problem}
        </p>
      )}
      <Button type="submit" loading={busy} disabled={!ready}>
        {busy ? "Saving" : "Save and add steps"}
      </Button>
      <p className="text-center text-base">
        <TextButton onClick={onCancel}>Cancel</TextButton>
      </p>
    </form>
  );
}
