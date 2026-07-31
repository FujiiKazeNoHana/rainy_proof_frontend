import type { LodMode } from "../types";

/** Default LOD thresholds from the product spec. */
export function modeFor(n: number): LodMode {
  if (n >= 2000) return "spark";
  if (n >= 200) return "stem";
  if (n >= 32) return "bar";
  return "label";
}
