import { MAX_ATTEMPTS, MAX_N } from "../../constants";
import type { LoadRunParams, MonkeySortRun, MonkeyStep } from "../types";
import { createPrng, type Prng } from "./prng";

/** Non-strict ascending — classic “sorted” for bogosort. */
export function isSorted(values: readonly number[]): boolean {
  for (let i = 1; i < values.length; i++) {
    if (values[i]! < values[i - 1]!) return false;
  }
  return true;
}

export function generateInitialValues(
  params: LoadRunParams,
  rng: Prng,
): number[] {
  if (params.initialValues) {
    if (params.initialValues.length > MAX_N) {
      throw new RangeError(`monkey_sort n must be <= ${MAX_N}`);
    }
    return params.initialValues.slice();
  }

  const { n, minValue, maxValue } = params;
  if (!Number.isInteger(n) || n < 1 || n > MAX_N) {
    throw new RangeError(`n must be an integer in [1, ${MAX_N}], got ${n}`);
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

/** In-place Fisher–Yates shuffle. */
export function shuffleInPlace(values: number[], rng: Prng): void {
  for (let i = values.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    const tmp = values[i]!;
    values[i] = values[j]!;
    values[j] = tmp;
  }
}

export function runMonkeySort(
  initialValues: readonly number[],
  seed: number | string,
  maxAttempts = MAX_ATTEMPTS,
): MonkeySortRun {
  if (initialValues.length > MAX_N) {
    throw new RangeError(`monkey_sort n must be <= ${MAX_N}`);
  }

  const rng = createPrng(seed);
  const steps: MonkeyStep[] = [];
  let current = initialValues.slice();
  let round = 0;

  // Record initial arrangement
  let sorted = isSorted(current);
  steps.push({ round, values: current.slice(), sorted });

  while (!sorted && round < maxAttempts) {
    shuffleInPlace(current, rng);
    round += 1;
    sorted = isSorted(current);
    steps.push({ round, values: current.slice(), sorted });
  }

  return {
    seed,
    initialValues: initialValues.slice(),
    steps,
    exhausted: !sorted,
    attempts: round,
  };
}
