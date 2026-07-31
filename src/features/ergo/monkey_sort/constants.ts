export const OWNER = "ergo" as const;
export const FEATURE = "monkey_sort" as const;

export const FEATURE_ROUTE = "/ergo/sort-viz/monkey-sort" as const;
export const FEATURE_API_BASE = `/api/${OWNER}/${FEATURE}` as const;

/** Hard limit: bogosort is factorial in expectation. */
export const MAX_N = 10;
export const DEFAULT_N = 5;

/** Safety cap so a run cannot allocate millions of steps. */
export const MAX_ATTEMPTS = 20_000;
