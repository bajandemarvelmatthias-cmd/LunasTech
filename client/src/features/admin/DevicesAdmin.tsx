import { useState, type FormEvent } from "react";
import { DeviceMobile, DeviceTablet, GameController, Laptop, PencilSimple } from "@phosphor-icons/react";
import { Button, OutlineButton, TextButton } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import { LoadError, PageHeader } from "@/features/overview/parts";
import { cn } from "@/lib/utils";
import { useLoad } from "@/lib/useLoad";
import { createDevice, createSymptom, fetchDeviceSummaries, isDuplicate, updateDevice } from "./api";
import {
  DataList,
  EmptyNote,
  FilterTabs,
  ListToolbar,
  SearchField,
  SECONDARY,
  SUBTITLE,
  TITLE,
  type FilterOption,
} from "./parts";
import { CATEGORY_LABEL, type DeviceCategory, type DeviceFields, type DeviceStatus, type DeviceSummary } from "./types";

const DEVICE_GRID =
  "grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_136px_112px_88px_136px_24px]";
const SYMPTOM_GRID = "grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_200px_120px]";
const ROW = "grid items-center gap-4 px-6 py-4";
const SAVE_FAILED = "Could not save. Check your connection and try again.";

type Dialog = { name: "device"; device: DeviceSummary | null } | { name: "symptom" } | null;
type DeviceFilter = "all" | DeviceStatus;

const ICONS = {
  smartphones: DeviceMobile,
  laptops: Laptop,
  tablets: DeviceTablet,
  game_consoles: GameController,
} as const;

const CATEGORY_OPTIONS = [
  { value: "", label: "Not set" },
  ...(Object.keys(CATEGORY_LABEL) as DeviceCategory[]).map((c) => ({ value: c, label: CATEGORY_LABEL[c] })),
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

function deviceFilters(devices: DeviceSummary[]): FilterOption<DeviceFilter>[] {
  const active = devices.filter((d) => d.status === "active").length;
  return [
    { value: "all", label: "All", count: devices.length },
    { value: "active", label: "Active", count: active },
    { value: "archived", label: "Archived", count: devices.length - active },
  ];
}

// Phosphor icon for the device category (DeviceMobile, Laptop, DeviceTablet,
// GameController); a phone when no category is set.
function DeviceTile({ category }: Readonly<{ category: DeviceCategory | null }>) {
  const Icon = ICONS[category ?? "smartphones"];
  return (
    <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
      <Icon className="size-6" aria-hidden="true" />
    </span>
  );
}

// Device types and their symptoms. These two tables are what the customer
// picks from before any guide. Both lists are read from one query; adding is
// writes (devices are edited or archived, never deleted, so existing guides
// keep their links).
export function DevicesAdmin() {
  const { data, loading, error, retry } = useLoad(fetchDeviceSummaries, []);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [query, setQuery] = useState("");
  const [deviceQuery, setDeviceQuery] = useState("");
  const [filter, setFilter] = useState<DeviceFilter>("all");

  function saved() {
    setDialog(null);
    retry();
  }

  const q = query.trim().toLowerCase();
  const dq = deviceQuery.trim().toLowerCase();
  const devices = (data ?? []).filter(
    (d) =>
      (filter === "all" || d.status === filter) &&
      `${d.name} ${d.manufacturer}`.toLowerCase().includes(dq),
  );
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
          <>
            <ListToolbar>
              <FilterTabs options={deviceFilters(data)} value={filter} onChange={setFilter} />
              <SearchField value={deviceQuery} onChange={setDeviceQuery} label="Search devices" />
            </ListToolbar>
            {devices.length === 0 ? (
              <EmptyNote>No devices match.</EmptyNote>
            ) : (
              <DataList columns={["Device", "Category", "Status", "Symptoms", "Guides", ""]} grid={DEVICE_GRID}>
                {devices.map((d) => (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => setDialog({ name: "device", device: d })}
                      className={cn(
                        ROW,
                        DEVICE_GRID,
                        "w-full text-left hover:bg-surface-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-4">
                        <DeviceTile category={d.category} />
                        <span className="flex min-w-0 flex-col">
                          <span className={TITLE}>{d.name}</span>
                          <span className={SUBTITLE}>{d.manufacturer || "No manufacturer"}</span>
                        </span>
                      </span>
                      <span className={SECONDARY}>{d.category ? CATEGORY_LABEL[d.category] : "Not set"}</span>
                      <span className={SECONDARY}>{d.status === "active" ? "Active" : "Archived"}</span>
                      <span className={SECONDARY}>{d.symptoms.length}</span>
                      <span className={SECONDARY}>
                        {d.published} of {d.guides} published
                      </span>
                      <PencilSimple className="hidden size-6 text-text-muted md:block" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </DataList>
            )}
          </>
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
            <OutlineButton disabled={!data?.length} onClick={() => setDialog({ name: "symptom" })}>
              Add symptom
            </OutlineButton>
            <Button className="w-auto" onClick={() => setDialog({ name: "device", device: null })}>
              Add device
            </Button>
          </>
        }
      />
      {body}
      <Modal
        open={dialog?.name === "device"}
        title={dialog?.name === "device" && dialog.device ? "Edit device" : "Add device"}
        onClose={() => setDialog(null)}
      >
        {dialog?.name === "device" && (
          <DeviceForm device={dialog.device} onSaved={saved} onCancel={() => setDialog(null)} />
        )}
      </Modal>
      <Modal open={dialog?.name === "symptom"} title="Add symptom" onClose={() => setDialog(null)}>
        <AddSymptomForm devices={data ?? []} onSaved={saved} onCancel={() => setDialog(null)} />
      </Modal>
    </div>
  );
}

// Add (device is null) or edit one device. Only the name is required.
function DeviceForm({
  device,
  onSaved,
  onCancel,
}: Readonly<{ device: DeviceSummary | null; onSaved: () => void; onCancel: () => void }>) {
  const [name, setName] = useState(device?.name ?? "");
  const [manufacturer, setManufacturer] = useState(device?.manufacturer ?? "");
  const [category, setCategory] = useState<DeviceCategory | "">(device?.category ?? "");
  const [notes, setNotes] = useState(device?.notes ?? "");
  const [status, setStatus] = useState<DeviceStatus>(device?.status ?? "active");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const trimmed = name.trim();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!trimmed) return;
    const fields: DeviceFields = {
      name: trimmed,
      manufacturer: manufacturer.trim(),
      category: category || null,
      notes: notes.trim(),
      status,
    };
    setBusy(true);
    setError(undefined);
    try {
      if (device) await updateDevice(device.id, fields);
      else await createDevice(fields);
      onSaved();
    } catch (err) {
      setError(isDuplicate(err) ? "A device with that name already exists." : SAVE_FAILED);
      setBusy(false);
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => void submit(e)}>
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
      <TextField label="Manufacturer (optional)" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
      <Select
        label="Category"
        value={category}
        options={CATEGORY_OPTIONS}
        onChange={(e) => setCategory(e.target.value as DeviceCategory | "")}
      />
      <TextArea label="Notes (optional)" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      <Select
        label="Status"
        value={status}
        options={STATUS_OPTIONS}
        onChange={(e) => setStatus(e.target.value as DeviceStatus)}
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
    <form className="flex flex-col gap-6" onSubmit={(e) => void submit(e)}>
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
