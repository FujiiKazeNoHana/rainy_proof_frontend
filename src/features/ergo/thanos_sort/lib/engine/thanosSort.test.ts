import { describe, expect, it } from "vitest";
import { createPrng } from "./prng";
import {
  applyRemoval,
  fromCompactRun,
  generateInitialValues,
  isMonotonic,
  isNonDecreasing,
  isNonIncreasing,
  pickRemovedIndices,
  removalCount,
  runThanosSort,
  toCompactRun,
} from "./thanosSort";
import { loadRun } from "../../api/loadRun";

describe("removalCount", () => {
  it("uses floor(n/2), so odd lengths remove one fewer than half rounded up", () => {
    expect(removalCount(1)).toBe(0);
    expect(removalCount(2)).toBe(1);
    expect(removalCount(3)).toBe(1);
    expect(removalCount(4)).toBe(2);
    expect(removalCount(5)).toBe(2);
  });
});

describe("monotonic checks", () => {
  it("non-decreasing allows equals", () => {
    expect(isNonDecreasing([1, 2, 2, 3])).toBe(true);
    expect(isNonDecreasing([1, 3, 2])).toBe(false);
  });
  it("non-increasing allows equals", () => {
    expect(isNonIncreasing([5, 3, 3, 1])).toBe(true);
    expect(isNonIncreasing([5, 1, 3])).toBe(false);
  });
  it("isMonotonic accepts either direction", () => {
    expect(isMonotonic([1, 2, 2, 4])).toBe(true);
    expect(isMonotonic([4, 2, 2, 1])).toBe(true);
    expect(isMonotonic([2, 2, 2])).toBe(true);
    expect(isMonotonic([1, 3, 2])).toBe(false);
  });
  it("treats empty and singleton as monotonic", () => {
    expect(isMonotonic([])).toBe(true);
    expect(isMonotonic([42])).toBe(true);
  });
});

describe("pickRemovedIndices", () => {
  it("removes floor(n/2) indices and keeps relative order", () => {
    const rng = createPrng(7);
    const values = [10, 20, 30, 40, 50, 60];
    const k = removalCount(values.length);
    const removed = pickRemovedIndices(values.length, k, rng);
    expect(removed).toHaveLength(3);
    expect(removed).toEqual([...removed].sort((a, b) => a - b));
    const kept = applyRemoval(values, removed);
    expect(kept).toHaveLength(3);
    // kept is subsequence of values
    let j = 0;
    for (const v of values) {
      if (j < kept.length && kept[j] === v) j++;
    }
    expect(j).toBe(kept.length);
  });

  it("for odd n=3 removes exactly one index", () => {
    const rng = createPrng(3);
    const values = [9, 1, 4];
    const k = removalCount(values.length);
    expect(k).toBe(1);
    const removed = pickRemovedIndices(values.length, k, rng);
    expect(removed).toHaveLength(1);
    const kept = applyRemoval(values, removed);
    expect(kept).toHaveLength(2);
  });
});

describe("runThanosSort", () => {
  it("terminates with a monotonic sequence", () => {
    const initial = [9, 1, 8, 2, 7, 3, 6, 4, 5, 0];
    const run = runThanosSort(initial, 123);
    const last = run.steps[run.steps.length - 1]!;
    expect(last.sorted).toBe(true);
    expect(isMonotonic(last.keptValues)).toBe(true);
  });

  it("is reproducible for same seed and initial values", () => {
    const initial = generateInitialValues(
      { n: 64, minValue: 0, maxValue: 100, seed: 99 },
      createPrng(99),
    );
    const a = runThanosSort(initial, 42);
    const b = runThanosSort(initial, 42);
    expect(a.steps.map((s) => s.removedIndices)).toEqual(
      b.steps.map((s) => s.removedIndices),
    );
  });

  it("already non-decreasing input yields a single terminal step", () => {
    const run = runThanosSort([1, 2, 2, 4], 1);
    expect(run.steps).toHaveLength(1);
    expect(run.steps[0]!.removedIndices).toEqual([]);
    expect(run.steps[0]!.sorted).toBe(true);
  });

  it("already non-increasing input yields a single terminal step", () => {
    const run = runThanosSort([5, 3, 3, 1], 1);
    expect(run.steps).toHaveLength(1);
    expect(run.steps[0]!.removedIndices).toEqual([]);
    expect(run.steps[0]!.sorted).toBe(true);
  });

  it("round-trips compact representation", () => {
    const run = runThanosSort([5, 1, 4, 2, 3], 11);
    const compact = toCompactRun(run);
    const restored = fromCompactRun(compact);
    expect(restored.initialValues).toEqual(run.initialValues);
    expect(restored.steps.map((s) => s.removedIndices)).toEqual(
      run.steps.map((s) => s.removedIndices),
    );
    expect(restored.steps.map((s) => s.keptValues)).toEqual(
      run.steps.map((s) => s.keptValues),
    );
  });
});

describe("loadRun", () => {
  it("returns a valid run asynchronously", async () => {
    const run = await loadRun({
      n: 100,
      minValue: 0,
      maxValue: 50,
      seed: "demo",
    });
    expect(run.initialValues).toHaveLength(100);
    expect(run.steps.length).toBeGreaterThan(0);
    const last = run.steps[run.steps.length - 1]!;
    expect(last.sorted).toBe(true);
  });

  it("is deterministic for identical params", async () => {
    const params = { n: 200, minValue: 1, maxValue: 20, seed: 2026 };
    const a = await loadRun(params);
    const b = await loadRun(params);
    expect(a.initialValues).toEqual(b.initialValues);
    expect(a.steps.map((s) => s.removedIndices)).toEqual(
      b.steps.map((s) => s.removedIndices),
    );
  });
});
