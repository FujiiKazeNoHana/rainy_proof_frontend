import { createPrng, type Prng } from "./prng";
import type {
  CompactThanosSortRun,
  LoadRunParams,
  Step,
  ThanosSortRun,
} from "../types";

/** Non-strict ascending: a[i] <= a[i+1] (equals allowed). */
export function isNonDecreasing(values: readonly number[]): boolean {
  for (let i = 1; i < values.length; i++) {
    if (values[i]! < values[i - 1]!) return false;
  }
  return true;
}

/** Non-strict descending: a[i] >= a[i+1] (equals allowed). */
export function isNonIncreasing(values: readonly number[]): boolean {
  for (let i = 1; i < values.length; i++) {
    if (values[i]! > values[i - 1]!) return false;
  }
  return true;
}

/**
 * Done when the sequence is non-strictly mono-increasing or mono-decreasing
 * (equals allowed). Empty / singleton count as done.
 */
export function isMonotonic(values: readonly number[]): boolean {
  return isNonDecreasing(values) || isNonIncreasing(values);
}

export type MonotonicKind =
  | "non-decreasing"
  | "non-increasing"
  | "flat"
  | null;

export function monotonicKind(values: readonly number[]): MonotonicKind {
  if (values.length <= 1) return "flat";
  const up = isNonDecreasing(values);
  const down = isNonIncreasing(values);
  if (up && down) return "flat";
  if (up) return "non-decreasing";
  if (down) return "non-increasing";
  return null;
}

export function generateInitialValues(
  params: LoadRunParams,
  rng: Prng,
): number[] {
  if (params.initialValues) {
    return params.initialValues.slice();
  }
  const { n, minValue, maxValue } = params;
  if (!Number.isInteger(n) || n < 0) {
    throw new RangeError(`n must be a non-negative integer, got ${n}`);
  }
  if (maxValue < minValue) {
    throw new RangeError(
      `maxValue (${maxValue}) must be >= minValue (${minValue})`,
    );
  }
  const span = maxValue - minValue + 1;
  const out = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    out[i] = minValue + rng.nextInt(span);
  }
  return out;
}

/**
 * How many elements to remove this round: ⌊n/2⌋.
 * Odd lengths keep the extra one (e.g. n=3 → remove 1, keep 2).
 */
export function removalCount(n: number): number {
  if (n < 2) return 0;
  return Math.floor(n / 2);
}

/**
 * Uniformly sample `k` distinct indices from `[0, n)` without replacement,
 * returning them sorted ascending (relative order of kept items preserved).
 */
export function pickRemovedIndices(n: number, k: number, rng: Prng): number[] {
  if (k <= 0) return [];
  if (k >= n) return Array.from({ length: n }, (_, i) => i);

  // Fisher–Yates partial shuffle on index list
  const indices = Array.from({ length: n }, (_, i) => i);
  for (let i = 0; i < k; i++) {
    const j = i + rng.nextInt(n - i);
    const tmp = indices[i]!;
    indices[i] = indices[j]!;
    indices[j] = tmp;
  }
  return indices.slice(0, k).sort((a, b) => a - b);
}

export function applyRemoval(
  values: readonly number[],
  removedIndices: readonly number[],
): number[] {
  if (removedIndices.length === 0) return values.slice();
  const remove = new Set(removedIndices);
  const kept: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (!remove.has(i)) kept.push(values[i]!);
  }
  return kept;
}

export function runThanosSort(
  initialValues: readonly number[],
  seed: number | string,
): ThanosSortRun {
  const rng = createPrng(seed);
  const steps: Step[] = [];
  let current = initialValues.slice();
  let round = 0;

  // Always record at least the initial state as round 0 when already sorted / n<=1
  for (;;) {
    const sorted = current.length <= 1 || isMonotonic(current);

    if (sorted || current.length < 2) {
      steps.push({
        round,
        values: current.slice(),
        removedIndices: [],
        keptValues: current.slice(),
        sorted: true,
      });
      break;
    }

    const k = removalCount(current.length);
    const removedIndices = pickRemovedIndices(current.length, k, rng);
    const keptValues = applyRemoval(current, removedIndices);
    const nowSorted = keptValues.length <= 1 || isMonotonic(keptValues);

    steps.push({
      round,
      values: current.slice(),
      removedIndices,
      keptValues,
      sorted: nowSorted,
    });

    current = keptValues;
    round += 1;

    if (nowSorted) {
      // Terminal snapshot of the final sorted sequence
      steps.push({
        round,
        values: current.slice(),
        removedIndices: [],
        keptValues: current.slice(),
        sorted: true,
      });
      break;
    }
  }

  return {
    seed,
    initialValues: initialValues.slice(),
    steps,
  };
}

/** Compact form: initialValues + per-round removedIndices only. */
export function toCompactRun(run: ThanosSortRun): CompactThanosSortRun {
  return {
    seed: run.seed,
    initialValues: run.initialValues.slice(),
    steps: run.steps.map((s) => ({
      round: s.round,
      removedIndices: s.removedIndices.slice(),
      sorted: s.sorted,
    })),
  };
}

/** Materialize full steps from a compact payload. */
export function fromCompactRun(compact: CompactThanosSortRun): ThanosSortRun {
  const steps: Step[] = [];
  let current = compact.initialValues.slice();

  for (const cs of compact.steps) {
    const keptValues = applyRemoval(current, cs.removedIndices);
    steps.push({
      round: cs.round,
      values: current.slice(),
      removedIndices: cs.removedIndices.slice(),
      keptValues,
      sorted: cs.sorted,
    });
    current = keptValues;
  }

  return {
    seed: compact.seed,
    initialValues: compact.initialValues.slice(),
    steps,
  };
}
