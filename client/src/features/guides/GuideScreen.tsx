import { useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { BackButton } from "@/components/ui/BackButton";
import { Button, TextButton } from "@/components/ui/Button";
import { GuideImage } from "@/components/ui/GuideImage";
import { useLoad } from "@/lib/useLoad";
import { fetchGuideSteps, fetchProgress, saveProgress } from "./api";
import { GuideMeta } from "./GuideParts";
import type { Guide, GuideProgress, GuideStep } from "./types";

type Props = { guide: Guide; onBack: () => void; onFinished: () => void };

// Loads the steps and the saved position, then hands over to the stepper.
export function GuideScreen({ guide, onBack, onFinished }: Readonly<Props>) {
  const { data, loading, error, retry } = useLoad(
    async () => {
      const [steps, progress] = await Promise.all([
        fetchGuideSteps(guide.id),
        // Offline, the saved position cannot be read; start at step 1 rather
        // than block a guide that is cached. Online errors still surface.
        fetchProgress(guide.id).catch((e: unknown) => {
          if (navigator.onLine) throw e;
          return null;
        }),
      ]);
      return { steps, progress };
    },
    [guide.id],
  );

  return (
    <div className="flex flex-col gap-6 pb-12">
      <BackButton onClick={onBack} />
      <GuideImage path={guide.cover_image_path} className="aspect-video w-full rounded-lg" />
      <div className="flex flex-col gap-2">
        <h1 className="text-lg font-semibold">{guide.title}</h1>
        <GuideMeta guide={guide} />
      </div>
      {loading && <p className="text-base text-text-muted">Loading</p>}
      {!loading && (error || !data) && (
        <div className="flex flex-col gap-4">
          <p role="alert" className="text-sm text-danger">
            Can't load this guide. Check your connection and try again.
          </p>
          <Button onClick={retry}>Try again</Button>
        </div>
      )}
      {!loading && data?.steps.length === 0 && (
        <p className="text-base text-text-muted">This guide has no steps yet.</p>
      )}
      {!loading && data && data.steps.length > 0 && (
        <Stepper guideId={guide.id} steps={data.steps} progress={data.progress} onDone={onFinished} />
      )}
    </div>
  );
}

// Where to start: resume an unfinished guide, otherwise begin at step 1.
function startIndex(steps: GuideStep[], progress: GuideProgress | null): number {
  if (!progress || progress.completed_at) return 0;
  const saved = steps.findIndex((s) => s.position >= progress.last_step_position);
  return saved === -1 ? steps.length - 1 : saved;
}

type StepperProps = {
  guideId: string;
  steps: GuideStep[];
  progress: GuideProgress | null;
  onDone: () => void;
};

// One step at a time. Progress is saved automatically on every step change.
function Stepper({ guideId, steps, progress, onDone }: Readonly<StepperProps>) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [index, setIndex] = useState(() => startIndex(steps, progress));
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const step = steps[index];
  const isLast = index === steps.length - 1;

  async function save(position: number, completed = false): Promise<boolean> {
    if (!userId) return false;
    try {
      await saveProgress(userId, guideId, position, completed);
      setSaveFailed(false);
      return true;
    } catch {
      setSaveFailed(true);
      return false;
    }
  }

  async function goTo(next: number) {
    setIndex(next);
    await save(steps[next].position);
  }

  async function finish() {
    setSaving(true);
    const ok = await save(step.position, true);
    setSaving(false);
    if (ok) onDone();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-text-muted">
          Step {index + 1} of {steps.length}
        </p>
        <progress
          className="h-2 w-full appearance-none overflow-hidden rounded-md [&::-moz-progress-bar]:bg-accent [&::-webkit-progress-bar]:bg-surface-secondary [&::-webkit-progress-value]:bg-accent"
          value={index + 1}
          max={steps.length}
          aria-label="Guide progress"
        />
      </div>
      <h2 className="text-base font-semibold">{step.title}</h2>
      <GuideImage path={step.image_path} className="aspect-video w-full rounded-lg" />
      <p className="whitespace-pre-line text-base">{step.instruction}</p>
      {saveFailed && (
        <p role="alert" className="text-sm text-danger">
          Progress could not be saved. Check your connection.
        </p>
      )}
      {isLast ? (
        <Button onClick={finish} loading={saving}>
          {saving ? "Saving" : "Finish"}
        </Button>
      ) : (
        <Button onClick={() => goTo(index + 1)}>Next</Button>
      )}
      {index > 0 && (
        <p className="text-center text-base">
          <TextButton onClick={() => goTo(index - 1)}>Previous</TextButton>
        </p>
      )}
    </div>
  );
}
