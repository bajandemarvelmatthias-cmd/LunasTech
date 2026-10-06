import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadError, Loading } from "@/components/ui/Status";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { fetchDevices, fetchGuides, fetchSymptoms } from "@/features/guides/api";
import type { Guide, PublishedGuide } from "@/features/guides/types";
import { GuideGrid } from "@/features/guides/GuideCard";
import { useLoad } from "@/lib/useLoad";

// Device type, then symptom, then the matching guides. One match opens at once.
// Model is not asked: the database holds device types and symptoms only.
export function DiagnosisScreen({ onOpen }: Readonly<{ onOpen: (guide: Guide) => void }>) {
  const devices = useLoad(fetchDevices, []);
  const [deviceId, setDeviceId] = useState("");
  const [symptomId, setSymptomId] = useState("");
  const symptoms = useLoad(() => (deviceId ? fetchSymptoms(deviceId) : Promise.resolve([])), [deviceId]);
  const [checking, setChecking] = useState(false);
  const [failed, setFailed] = useState(false);
  const [matches, setMatches] = useState<Guide[] | null>(null);

  function pickDevice(id: string) {
    setDeviceId(id);
    setSymptomId("");
    setMatches(null);
  }

  async function check() {
    setChecking(true);
    setFailed(false);
    try {
      const found = await fetchGuides(symptomId);
      if (found.length === 1) onOpen(found[0]);
      else setMatches(found);
    } catch {
      setFailed(true);
    } finally {
      setChecking(false);
    }
  }

  const device = devices.data?.find((d) => d.id === deviceId);
  const symptom = symptoms.data?.find((s) => s.id === symptomId);
  // Matches are listed as guides of the chosen device and symptom.
  const listed: PublishedGuide[] = (matches ?? []).map((g) => ({
    ...g,
    deviceId,
    device: device?.name ?? "",
    symptom: symptom?.name ?? "",
  }));

  if (devices.loading) return <Loading />;
  if (devices.error || !devices.data) {
    return <LoadError message="Can't load device types. Check your connection and try again." onRetry={devices.retry} />;
  }

  return (
    <>
      <PageHeader title="Device diagnosis" subtitle="Tell us the symptoms. We'll help you find the next best step." />
      <Card className="flex flex-col gap-4">
        <Select
          label="Device type"
          placeholder="Choose a type"
          value={deviceId}
          onChange={(e) => pickDevice(e.target.value)}
          options={devices.data.map((d) => ({ value: d.id, label: d.name }))}
        />
        <Select
          label="Symptom"
          placeholder={deviceId ? "Choose a symptom" : "Choose a device type first"}
          value={symptomId}
          disabled={!deviceId || symptoms.loading}
          onChange={(e) => {
            setSymptomId(e.target.value);
            setMatches(null);
          }}
          options={(symptoms.data ?? []).map((s) => ({ value: s.id, label: s.name }))}
          error={symptoms.error ? "Can't load symptoms. Pick the device type again to retry." : undefined}
        />
        {deviceId && !symptoms.loading && !symptoms.error && symptoms.data?.length === 0 && (
          <p className="text-sm text-text-muted">No symptoms for this device type yet.</p>
        )}
        {failed && (
          <p role="alert" className="text-sm text-danger">
            Can't check this symptom. Check your connection and try again.
          </p>
        )}
        <Button onClick={check} disabled={!symptomId} loading={checking} className="w-auto self-start">
          {checking ? "Checking" : "Check symptom"}
        </Button>
      </Card>
      {matches?.length === 0 && (
        <p className="text-base text-text-muted">No guides for this symptom yet.</p>
      )}
      {matches && matches.length > 1 && <GuideGrid guides={listed} onOpen={onOpen} />}
    </>
  );
}
