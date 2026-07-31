export interface MonkeyStep {
  round: number;
  values: number[];
  /** True when values are non-decreasing (equals allowed). */
  sorted: boolean;
}

export interface MonkeySortRun {
  seed: number | string;
  initialValues: number[];
  steps: MonkeyStep[];
  /** True if stopped because MAX_ATTEMPTS was hit before sorted. */
  exhausted: boolean;
  attempts: number;
}

export interface LoadRunParams {
  n: number;
  minValue: number;
  maxValue: number;
  seed: number | string;
  initialValues?: number[];
}
