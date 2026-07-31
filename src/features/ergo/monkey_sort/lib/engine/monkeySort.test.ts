import { describe, expect, it } from "vitest";
import { MAX_N } from "../../constants";
import { loadRun } from "../../api/loadRun";
import { createPrng } from "./prng";
import {
  generateInitialValues,
  isSorted,
  runMonkeySort,
  shuffleInPlace,
} from "./monkeySort";

describe("isSorted", () => {
  it("allows equals", () => {
    expect(isSorted([1, 2, 2, 3])).toBe(true);
  });
  it("rejects decreases", () => {
    expect(isSorted([1, 3, 2])).toBe(false);
  });
});

describe("runMonkeySort", () => {
  it("terminates with a sorted sequence for small n", () => {
    const initial = [3, 1, 2];
    const run = runMonkeySort(initial, 42);
    expect(run.exhausted).toBe(false);
    const last = run.steps[run.steps.length - 1]!;
    expect(last.sorted).toBe(true);
    expect(isSorted(last.values)).toBe(true);
  });

  it("is reproducible for same seed and initial values", () => {
    const initial = [5, 1, 4, 2];
    const a = runMonkeySort(initial, 7);
    const b = runMonkeySort(initial, 7);
    expect(a.steps.map((s) => s.values)).toEqual(b.steps.map((s) => s.values));
  });

  it("rejects n above MAX_N", () => {
    expect(() =>
      runMonkeySort(Array.from({ length: MAX_N + 1 }, (_, i) => i), 1),
    ).toThrow(/<= 10/);
  });

  it("shuffle preserves multiset", () => {
    const rng = createPrng(9);
    const values = [1, 2, 3, 4, 5];
    const copy = values.slice();
    shuffleInPlace(copy, rng);
    expect([...copy].sort((a, b) => a - b)).toEqual(values);
  });
});

describe("loadRun", () => {
  it("generates n within limit and finishes sorted", async () => {
    const run = await loadRun({
      n: 4,
      minValue: 0,
      maxValue: 9,
      seed: "banana",
    });
    expect(run.initialValues).toHaveLength(4);
    expect(run.exhausted).toBe(false);
    expect(run.steps[run.steps.length - 1]!.sorted).toBe(true);
  });

  it("rejects oversized n at generation", () => {
    expect(() =>
      generateInitialValues(
        { n: 11, minValue: 0, maxValue: 1, seed: 1 },
        createPrng(1),
      ),
    ).toThrow();
  });
});
