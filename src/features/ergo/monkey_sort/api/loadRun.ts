import { createPrng } from "../lib/engine/prng";
import {
  generateInitialValues,
  runMonkeySort,
} from "../lib/engine/monkeySort";
import type { LoadRunParams, MonkeySortRun } from "../lib/types";

/**
 * Phase-1 local engine. Phase-2 may swap for `/api/ergo/monkey_sort/...`.
 */
export async function loadRun(params: LoadRunParams): Promise<MonkeySortRun> {
  const rng = createPrng(params.seed);
  const initialValues = generateInitialValues(params, rng);
  // Fresh stream from the same seed for shuffles (independent of generation draws).
  return runMonkeySort(initialValues, params.seed);
}
