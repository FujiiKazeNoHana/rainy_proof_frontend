export type LodMode = "spark" | "stem" | "bar" | "label";

export interface Step {
  round: number;
  /** Sequence at the start of this round. */
  values: number[];
  /** Indices into `values` that were removed this round. */
  removedIndices: number[];
  /** Sequence after removal; may be derived from values + removedIndices. */
  keptValues: number[];
  /** Whether the sequence is monotonic (non-strict ↑ or ↓) after this round. */
  sorted: boolean;
}

export interface ThanosSortRun {
  seed: number | string;
  initialValues: number[];
  steps: Step[];
}

export interface LoadRunParams {
  n: number;
  minValue: number;
  maxValue: number;
  seed: number | string;
  /** Optional fixed initial sequence; when set, overrides n/value-range generation. */
  initialValues?: number[];
}

/** Compact step for transport/memory: only removed indices per round. */
export interface CompactStep {
  round: number;
  removedIndices: number[];
  sorted: boolean;
}

export interface CompactThanosSortRun {
  seed: number | string;
  initialValues: number[];
  steps: CompactStep[];
}
