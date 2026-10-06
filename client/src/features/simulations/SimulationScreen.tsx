import { useState } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { Button, TextButton } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useLoad } from "@/lib/useLoad";
import { fetchSimulationSteps, fetchStepResults, startSimulation, submitAnswer } from "./api";
import type { Simulation, SimulationStep, StepResult, SubmitResult } from "./types";

type Props = { simulation: Simulation; onBack: () => void; onExit: () => void };

// Loads steps, starts (or resumes) the attempt, then hands over to the runner.
export function SimulationScreen({ simulation, onBack, onExit }: Readonly<Props>) {
  const { data, loading, error, retry } = useLoad(
    async () => {
      const [steps, attemptId] = await Promise.all([
        fetchSimulationSteps(simulation.id),
        startSimulation(simulation.id),
      ]);
      const results = await fetchStepResults(attemptId);
      return { steps, attemptId, results };
    },
    [simulation.id],
  );

  return (
    <div className="flex flex-col gap-6 pb-12">
      <BackButton onClick={onBack} />
      <h1 className="text-xl font-semibold">{simulation.title}</h1>
      {loading && <p className="text-base text-text-muted">Loading</p>}
      {!loading && (error || !data) && (
        <div className="flex flex-col gap-4">
          <p role="alert" className="text-sm text-danger">
            Can't load this simulation. Check your connection and try again.
          </p>
          <Button onClick={retry}>Try again</Button>
        </div>
      )}
      {!loading && data?.steps.length === 0 && (
        <p className="text-base text-text-muted">This simulation has no steps yet.</p>
      )}
      {!loading && data && data.steps.length > 0 && (
        <Runner
          key={data.attemptId}
          attemptId={data.attemptId}
          steps={data.steps}
          results={data.results}
          onRetake={retry}
          onExit={onExit}
        />
      )}
    </div>
  );
}

type RunnerProps = {
  attemptId: string;
  steps: SimulationStep[];
  results: StepResult[];
  onRetake: () => void;
  onExit: () => void;
};

type Outcome = { passed: boolean; level: number | null };

// Resume at the first step without a resolved result; keep the points so far.
function resumeState(steps: SimulationStep[], results: StepResult[]) {
  const resolved = results.filter((r) => r.resolved_at);
  const done = new Set(resolved.map((r) => r.simulation_step_id));
  const index = steps.findIndex((s) => !done.has(s.id));
  const points = resolved.reduce((sum, r) => sum + (r.points ?? 0), 0);
  const hadWrongTry = results.some(
    (r) => !r.resolved_at && r.simulation_step_id === steps[Math.max(index, 0)].id,
  );
  return { index: Math.max(index, 0), points, hadWrongTry };
}

function Runner({ attemptId, steps, results, onRetake, onExit }: Readonly<RunnerProps>) {
  const start = resumeState(steps, results);
  const [index, setIndex] = useState(start.index);
  const [total, setTotal] = useState(start.points);
  const [chosen, setChosen] = useState<number | null>(null);
  const [wrongPick, setWrongPick] = useState<number | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [resumedWrong, setResumedWrong] = useState(start.hadWrongTry);
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const step = steps[index];
  const resolved = result?.resolved === true;

  async function check() {
    if (chosen === null || submitting) return;
    setSubmitting(true);
    setFailed(false);
    try {
      const next = await submitAnswer(attemptId, step.id, chosen);
      setResult(next);
      setResumedWrong(false);
      if (next.resolved) setTotal((t) => t + (next.points ?? 0));
      else setWrongPick(chosen);
    } catch {
      setFailed(true);
    }
    setSubmitting(false);
  }

  function next() {
    if (result?.attempt_completed) {
      setOutcome({ passed: result.passed === true, level: result.learning_level });
      return;
    }
    setIndex(index + 1);
    setChosen(null);
    setWrongPick(null);
    setResult(null);
    setResumedWrong(false);
  }

  if (outcome) {
    return (
      <ResultScreen
        outcome={outcome}
        total={total}
        max={steps.length * 2}
        onRetake={onRetake}
        onExit={onExit}
      />
    );
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
          aria-label="Simulation progress"
        />
      </div>
      <fieldset className="flex flex-col gap-2" disabled={resolved || submitting}>
        <legend className="mb-4 text-base font-semibold">{step.prompt}</legend>
        {step.options.map((option, i) => {
          const isCorrect = resolved && result?.correct_option === i;
          return (
            <label
              key={`${i}-${option}`}
              className={cn(
                "flex min-h-14 cursor-pointer items-center gap-4 rounded-md border bg-surface px-4 py-2 text-base",
                "has-checked:border-accent has-checked:bg-surface-secondary",
                "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent",
                "has-disabled:cursor-not-allowed has-disabled:text-text-muted",
                isCorrect ? "border-accent" : "border-border",
              )}
            >
              <input
                type="radio"
                name={step.id}
                className="size-5 shrink-0 accent-accent"
                checked={chosen === i}
                disabled={wrongPick === i}
                onChange={() => setChosen(i)}
              />
              <span>
                {option}
                {isCorrect && <span className="block text-sm font-semibold">Correct answer</span>}
                {wrongPick === i && !resolved && (
                  <span className="block text-sm">Not the answer</span>
                )}
              </span>
            </label>
          );
        })}
      </fieldset>
      {resumedWrong && !result && (
        <p className="text-sm text-text-muted">Your first answer was wrong. Choose again.</p>
      )}
      {result && (
        <output className="flex flex-col gap-2">
          <p className={cn("text-base font-semibold", !result.correct && "text-danger")}>
            {feedbackLabel(result)}
          </p>
          <p className="text-base">{result.feedback}</p>
        </output>
      )}
      {failed && (
        <p role="alert" className="text-sm text-danger">
          Answer could not be sent. Check your connection and try again.
        </p>
      )}
      {resolved ? (
        <Button onClick={next}>{result?.attempt_completed ? "See result" : "Next"}</Button>
      ) : (
        <Button onClick={check} disabled={chosen === null} loading={submitting}>
          {submitting ? "Checking" : "Check answer"}
        </Button>
      )}
    </div>
  );
}

function feedbackLabel(result: SubmitResult): string {
  if (result.correct) {
    const points = result.points ?? 0;
    return `Correct, ${points} ${points === 1 ? "point" : "points"}`;
  }
  return result.resolved ? "Incorrect, 0 points" : "Not quite. Try once more";
}

type ResultProps = {
  outcome: Outcome;
  total: number;
  max: number;
  onRetake: () => void;
  onExit: () => void;
};

function ResultScreen({ outcome, total, max, onRetake, onExit }: Readonly<ResultProps>) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-base font-semibold">{outcome.passed ? "Passed" : "Not passed"}</h2>
      <p className="text-base">
        {total} of {max} points
      </p>
      {outcome.level !== null && (
        <p className="text-base">Learning level {outcome.level}</p>
      )}
      {outcome.passed ? (
        <Button onClick={onExit}>Done</Button>
      ) : (
        <>
          <Button onClick={onRetake}>Try again</Button>
          <p className="text-center text-base">
            <TextButton onClick={onExit}>Done</TextButton>
          </p>
        </>
      )}
    </div>
  );
}
