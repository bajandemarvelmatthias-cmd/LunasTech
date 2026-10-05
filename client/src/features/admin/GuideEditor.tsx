import { useRef, useState, type RefObject } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { Button, TextButton } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import { useAuth } from "@/features/auth/AuthProvider";
import { fetchDevices } from "@/features/guides/api";
import { KIND_LABEL, type GuideKind, type GuideStep } from "@/features/guides/types";
import { useLoad } from "@/lib/useLoad";
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
export const DISCARD_PROMPT = "Discard your unsaved changes?";

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
    <div className="flex flex-col gap-6 pb-12">
      <BackButton onClick={() => (!dirty.current || window.confirm(DISCARD_PROMPT)) && onBack()} />
      {loading && <p className="text-base text-text-muted">Loading</p>}
      {!loading && (error || !data) && (
        <div className="flex flex-col gap-4">
          <p role="alert" className="text-sm text-danger">
            Can't load this guide. Check your connection and try again.
          </p>
          <Button onClick={retry}>Try again</Button>
        </div>
      )}
      {!loading && data && <EditorForm detail={data.detail} symptoms={data.symptoms} dirty={dirty} onSimulations={onSimulations} />}
    </div>
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
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  const edited = () => {
    dirty.current = true;
    setMessage(null);
  };

  function updateDraft(index: number, patch: Partial<StepDraft>) {
    edited();
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

  async function persist(): Promise<string | null> {
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

  async function run(action: () => Promise<string>) {
    const found = problem();
    if (found) {
      setMessage({ text: found, error: true });
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

  // Publishing is the admin's decision (brief: approving and publishing).
  // It saves first so what is published is what is on screen.
  const toggleStatus = () => {
    const next: Status = status === "published" ? "draft" : "published";
    if (next === "published" && drafts.length === 0) {
      setMessage({ text: "Add at least one step before publishing.", error: true });
      return;
    }
    return run(async () => {
      const id = await persist();
      if (id) await setGuideStatus(id, next);
      setStatus(next);
      return next === "published" ? "Published" : "Moved to drafts";
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">{guideId ? "Edit guide" : "New guide"}</h1>
      <p className="text-sm text-text-muted">{STATUS_LABEL[status]}</p>

      <TextField label="Title" value={title} onChange={(e) => (edited(), setTitle(e.target.value))} />
      <Select
        label="Symptom"
        value={symptomId}
        placeholder="Choose a symptom"
        options={symptoms.map((s) => ({ value: s.id, label: s.label }))}
        onChange={(e) => (edited(), setSymptomId(e.target.value))}
      />
      <NewSymptom
        onCreated={(id, list) => {
          setSymptoms(list);
          setSymptomId(id);
          edited();
        }}
      />
      <Select
        label="Kind"
        value={kind}
        options={KIND_OPTIONS}
        onChange={(e) => (edited(), setKind(e.target.value as GuideKind))}
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
            <TextButton
              className="self-start"
              onClick={() => (edited(), setDrafts((list) => list.slice(0, -1)))}
            >
              Remove step {i + 1}
            </TextButton>
          )}
        </fieldset>
      ))}
      <TextButton
        className="self-start"
        onClick={() => (edited(), setDrafts((list) => [...list, { id: null, title: "", instruction: "" }]))}
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
      {guideId && (
        <p className="text-center text-base">
          <TextButton
            onClick={() => (!dirty.current || window.confirm(DISCARD_PROMPT)) && onSimulations(guideId)}
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
