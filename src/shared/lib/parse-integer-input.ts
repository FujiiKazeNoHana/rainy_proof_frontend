/**
 * Normalize free-form integer input:
 * - empty / whitespace → fallback (default 0)
 * - leading zeros like "0100" → 100
 * - non-numeric → fallback
 */
export function parseIntegerInput(raw: string, fallback = 0): number {
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "-" || trimmed === "+") {
    return fallback;
  }
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

export function clampInt(n: number, min?: number, max?: number): number {
  let v = n;
  if (min != null) v = Math.max(min, v);
  if (max != null) v = Math.min(max, v);
  return v;
}
