import { supabase } from "@/lib/supabase";
import type { Simulation, SimulationStep, StepResult, SubmitResult } from "./types";

export async function fetchSimulations(guideId: string): Promise<Simulation[]> {
  const { data, error } = await supabase
    .from("simulations")
    .select("id, title")
    .eq("guide_id", guideId)
    .eq("status", "published")
    .order("title");
  if (error) throw error;
  return data;
}

export async function fetchSimulationSteps(simulationId: string): Promise<SimulationStep[]> {
  const { data, error } = await supabase
    .from("simulation_steps")
    .select("id, position, prompt, options")
    .eq("simulation_id", simulationId)
    .order("position");
  if (error) throw error;
  return data as SimulationStep[];
}

// Reuses the user's unfinished attempt, otherwise creates one.
export async function startSimulation(simulationId: string): Promise<string> {
  const { data, error } = await supabase.rpc("start_simulation", {
    p_simulation_id: simulationId,
  });
  if (error) throw error;
  return data as string;
}

export async function fetchStepResults(attemptId: string): Promise<StepResult[]> {
  const { data, error } = await supabase
    .from("step_results")
    .select("simulation_step_id, points, resolved_at")
    .eq("attempt_id", attemptId);
  if (error) throw error;
  return data;
}

// Scoring happens in the database. The app only sends the chosen option index.
export async function submitAnswer(
  attemptId: string,
  stepId: string,
  chosen: number,
): Promise<SubmitResult> {
  const { data, error } = await supabase.rpc("submit_answer", {
    p_attempt_id: attemptId,
    p_step_id: stepId,
    p_chosen: chosen,
  });
  if (error) throw error;
  return data as SubmitResult;
}
