export interface MinMaxPoint {
  x: number;
  min: number;
  max: number;
}

/**
 * Bucket values into ~`bucketCount` columns; each bucket keeps min & max
 * (typical sparkline / OHLC-style overview for large n).
 */
export function downsampleMinMax(
  values: ArrayLike<number>,
  bucketCount: number,
): MinMaxPoint[] {
  const n = values.length;
  if (n === 0 || bucketCount <= 0) return [];
  if (bucketCount >= n) {
    const out: MinMaxPoint[] = [];
    for (let i = 0; i < n; i++) {
      const v = values[i]!;
      out.push({ x: i, min: v, max: v });
    }
    return out;
  }

  const out: MinMaxPoint[] = [];
  for (let b = 0; b < bucketCount; b++) {
    const start = Math.floor((b * n) / bucketCount);
    const end = Math.floor(((b + 1) * n) / bucketCount);
    let min = Infinity;
    let max = -Infinity;
    for (let i = start; i < end; i++) {
      const v = values[i]!;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    out.push({ x: (start + end - 1) / 2, min, max });
  }
  return out;
}

export interface LttbPoint {
  x: number;
  y: number;
}

/**
 * Largest-Triangle-Three-Buckets downsampling for polyline overview.
 * Returns at most `threshold` points including endpoints.
 */
export function downsampleLttb(
  values: ArrayLike<number>,
  threshold: number,
): LttbPoint[] {
  const n = values.length;
  if (n === 0) return [];
  if (threshold >= n || threshold < 3) {
    const all: LttbPoint[] = [];
    for (let i = 0; i < n; i++) all.push({ x: i, y: values[i]! });
    return all;
  }

  const sampled: LttbPoint[] = [{ x: 0, y: values[0]! }];
  const bucketSize = (n - 2) / (threshold - 2);
  let prevIndex = 0;

  for (let i = 0; i < threshold - 2; i++) {
    const bucketStart = Math.floor((i + 0) * bucketSize) + 1;
    const bucketEnd = Math.min(Math.floor((i + 1) * bucketSize) + 1, n - 1);

    const nextStart = Math.floor((i + 1) * bucketSize) + 1;
    const nextEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, n);

    let avgX = 0;
    let avgY = 0;
    const nextLen = Math.max(nextEnd - nextStart, 1);
    for (let j = nextStart; j < nextEnd; j++) {
      avgX += j;
      avgY += values[j]!;
    }
    avgX /= nextLen;
    avgY /= nextLen;

    const pointAx = prevIndex;
    const pointAy = values[prevIndex]!;

    let maxArea = -1;
    let maxIndex = bucketStart;
    for (let j = bucketStart; j < bucketEnd; j++) {
      const area = Math.abs(
        (pointAx - avgX) * (values[j]! - pointAy) -
          (pointAx - j) * (avgY - pointAy),
      );
      if (area > maxArea) {
        maxArea = area;
        maxIndex = j;
      }
    }

    sampled.push({ x: maxIndex, y: values[maxIndex]! });
    prevIndex = maxIndex;
  }

  sampled.push({ x: n - 1, y: values[n - 1]! });
  return sampled;
}
