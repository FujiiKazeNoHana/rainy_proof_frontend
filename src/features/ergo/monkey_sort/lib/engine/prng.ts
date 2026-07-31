export interface Prng {
  nextFloat(): number;
  nextInt(bound: number): number;
}

function hashSeed(seed: number | string): number {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    return seed >>> 0;
  }
  const s = String(seed);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createPrng(seed: number | string): Prng {
  let state = hashSeed(seed) || 1;

  const nextFloat = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const nextInt = (bound: number): number => {
    if (!Number.isFinite(bound) || bound <= 0) {
      throw new RangeError(`nextInt bound must be > 0, got ${bound}`);
    }
    return Math.floor(nextFloat() * bound);
  };

  return { nextFloat, nextInt };
}
