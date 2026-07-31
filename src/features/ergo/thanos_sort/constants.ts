/** Aligns with backend package `ergo.thanos_sort` and `/api/ergo/thanos_sort/...`. */
export const OWNER = "ergo" as const;
export const FEATURE = "thanos_sort" as const;

/** App Router path (kebab-case URL). */
export const FEATURE_ROUTE = "/ergo/sort-viz/thanos-sort" as const;

/** Phase-2 API base; phase-1 `loadRun` stays local and does not call this. */
export const FEATURE_API_BASE = `/api/${OWNER}/${FEATURE}` as const;
