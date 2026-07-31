import { createPrng } from "../lib/engine/prng";
import {
  generateInitialValues,
  runThanosSort,
} from "../lib/engine/thanosSort";
import type { LoadRunParams, ThanosSortRun } from "../lib/types";

/**
 * Data boundary for thanos_sort.
 * Phase-1: local engine.
 * Phase-2: `apiFetch(`${FEATURE_API_BASE}/...`)` via `@/shared/lib/api-client`,
 * then adapt to ThanosSortRun. Chart/player stay unchanged.
 * Call sites should `await loadRun(...)` for both sync-local and async-remote.
 */
export async function loadRun(params: LoadRunParams): Promise<ThanosSortRun> {
  const rng = createPrng(params.seed);
  // Consume RNG for initial generation with a derived stream so removal uses
  // an independent continuation from the same seed family.
  const initialValues = generateInitialValues(params, rng);
  // Re-seed removal stream from the same user seed so identical params reproduce.
  return runThanosSort(initialValues, params.seed);
}

export function isThanosSortRun(value: unknown): value is ThanosSortRun {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (!("seed" in v) || !Array.isArray(v.initialValues) || !Array.isArray(v.steps)) {
    return false;
  }
  return v.steps.every((step) => {
    if (!step || typeof step !== "object") return false;
    const s = step as Record<string, unknown>;
    return (
      typeof s.round === "number" &&
      Array.isArray(s.values) &&
      Array.isArray(s.removedIndices) &&
      Array.isArray(s.keptValues) &&
      typeof s.sorted === "boolean"
    );
  });
}
