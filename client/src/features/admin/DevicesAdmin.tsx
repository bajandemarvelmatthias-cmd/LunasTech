import { useState, type FormEvent } from "react";
import { Button, OutlineButton, TextButton } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { TextField } from "@/components/ui/TextField";
import { LoadError, PageHeader } from "@/features/overview/parts";
import { cn } from "@/lib/utils";
import { useLoad } from "@/lib/useLoad";
import { createDevice, createSymptom, fetchDeviceSummaries, isDuplicate } from "./api";
import { DataList, EmptyNote, SearchField, SECONDARY, SUBTITLE, TITLE } from "./parts";
import type { DeviceSummary } from "./types";

const DEVICE_GRID = "grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_120px_160px]";
const SYMPTOM_GRID = "grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_200px_120px]";
const ROW = "grid items-center gap-4 px-6 py-4";
const SAVE_FAILED = "Could not save. Check your connection and try again.";

type Dialog = "device" | "symptom" | null;

// Device types and their symptoms. These two tables are what the customer
// picks from before any guide. Both lists are read from one query; adding is
// the only write (renaming and deleting are not offered, so existing guides
// keep their links).
export function DevicesAdmin() {
  const { data, loading, error, retry } = useLoad(fetchDeviceSummaries, []);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [query, setQuery] = useState("");

  function saved() {
    setDialog(null);
    retry();
  }

  const q = query.trim().toLowerCase();
  const symptoms = (data ?? [])
    .flatMap((d) => d.symptoms.map((s) => ({ ...s, device: d.name })))
    .filter((s) => `${s.name} ${s.device}`.toLowerCase().includes(q));

  let body;
  if (error) {
    body = <LoadError onRetry={retry} />;
  } else if (loading || !data) {
    body = <p className="text-base text-text-muted">Loading</p>;
  } else {
    const total = data.reduce((n, d) => n + d.symptoms.length, 0);
    body = (
      <>
        {data.length === 0 ? (
          <EmptyNote>No devices yet.</EmptyNote>
        ) : (
          <DataList columns={["Device", "Symptoms", "Guides"]} grid={DEVICE_GRID}>
            {data.map((d) => (
              <li key={d.id} className={cn(ROW, DEVICE_GRID)}>
                <span className={TITLE}>{d.name}</span>
                <span className={SECONDARY}>{d.symptoms.length}</span>
                <span className="truncate text-sm text-text-muted">
                  {d.published} of {d.guides} published
                </span>
              </li>
            ))}
          </DataList>
        )}
        <div className="flex flex-col gap-4 pt-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-base font-semibold">Symptoms</h2>
          {total > 0 && <SearchField value={query} onChange={setQuery} label="Search symptoms" />}
        </div>
        {total === 0 && <EmptyNote>No symptoms yet.</EmptyNote>}
        {total > 0 && symptoms.length === 0 && <EmptyNote>No symptoms match.</EmptyNote>}
        {symptoms.length > 0 && (
          <DataList columns={["Symptom", "Device", "Guides"]} grid={SYMPTOM_GRID}>
            {symptoms.map((s) => (
              <li key={s.id} className={cn(ROW, SYMPTOM_GRID)}>
                <span className="flex min-w-0 flex-col">
                  <span className={TITLE}>{s.name}</span>
                  <span className={cn(SUBTITLE, "md:hidden")}>{s.device}</span>
                </span>
                <span className={SECONDARY}>{s.device}</span>
                <span className="text-sm text-text-muted">{s.guides}</span>
              </li>
            ))}
          </DataList>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="All devices"
        actions={
          <>
            <OutlineButton disabled={!data?.length} onClick={() => setDialog("symptom")}>
              Add symptom
            </OutlineButton>
            <Button className="w-auto" onClick={() => setDialog("device")}>
              Add device
            </Button>
          </>
        }
      />
      {body}
      <Modal open={dialog === "device"} title="Add device" onClose={() => setDialog(null)}>
        <AddDeviceForm onSaved={saved} onCancel={() => setDialog(null)} />
      </Modal>
      <Modal open={dialog === "symptom"} title="Add symptom" onClose={() => setDialog(null)}>
        <AddSymptomForm devices={data ?? []} onSaved={saved} onCancel={() => setDialog(null)} />
      </Modal>
    </div>
  );
}

function AddDeviceForm({ onSaved, onCancel }: Readonly<{ onSaved: () => void; onCancel: () => void }>) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const trimmed = name.trim();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!trimmed) return;
    setBusy(true);
    setError(undefined);
    try {
      await createDevice(trimmed);
      onSaved();
    } catch (err) {
      setError(isDuplicate(err) ? "A device with that name already exists." : SAVE_FAILED);
      setBusy(false);
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={submit}>
      <TextField
        label="Device name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setError(undefined);
        }}
        error={error}
        help={trimmed ? undefined : "Enter a name to save."}
      />
      <Button type="submit" loading={busy} disabled={!trimmed}>
        {busy ? "Saving" : "Save"}
      </Button>
      <p className="text-center text-base">
        <TextButton onClick={onCancel}>Cancel</TextButton>
      </p>
    </form>
  );
}

function AddSymptomForm({
  devices,
  onSaved,
  onCancel,
}: Readonly<{ devices: DeviceSummary[]; onSaved: () => void; onCancel: () => void }>) {
  const [deviceId, setDeviceId] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const trimmed = name.trim();
  const ready = Boolean(deviceId && trimmed);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(undefined);
    try {
      await createSymptom(deviceId, trimmed);
      onSaved();
    } catch (err) {
      setError(isDuplicate(err) ? "That device already has this symptom." : SAVE_FAILED);
      setBusy(false);
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={submit}>
      <Select
        label="Device"
        placeholder="Choose a device"
        value={deviceId}
        onChange={(e) => {
          setDeviceId(e.target.value);
          setError(undefined);
        }}
        options={devices.map((d) => ({ value: d.id, label: d.name }))}
      />
      <TextField
        label="Symptom"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setError(undefined);
        }}
        error={error}
        help={ready ? undefined : "Choose a device and enter a symptom to save."}
      />
      <Button type="submit" loading={busy} disabled={!ready}>
        {busy ? "Saving" : "Save"}
      </Button>
      <p className="text-center text-base">
        <TextButton onClick={onCancel}>Cancel</TextButton>
      </p>
    </form>
  );
}
