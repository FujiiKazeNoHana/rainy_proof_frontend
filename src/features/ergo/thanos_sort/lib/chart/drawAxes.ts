import type { ChartTheme } from "./theme";

export interface PlotRect {
  left: number;
  top: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

export interface Scale {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  plot: PlotRect;
}

export function makePlotRect(
  width: number,
  height: number,
  pad = { left: 48, right: 16, top: 16, bottom: 36 },
): PlotRect {
  const left = pad.left;
  const top = pad.top;
  const w = Math.max(1, width - pad.left - pad.right);
  const h = Math.max(1, height - pad.top - pad.bottom);
  return {
    left,
    top,
    width: w,
    height: h,
    right: left + w,
    bottom: top + h,
  };
}

export function niceYRange(values: ArrayLike<number>): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < values.length; i++) {
    const v = values[i]!;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: 0, max: 1 };
  }
  if (min === max) {
    const pad = Math.abs(min) * 0.1 || 1;
    return { min: min - pad, max: max + pad };
  }
  const span = max - min;
  const pad = span * 0.08;
  return { min: min - pad, max: max + pad };
}

export function xToPx(x: number, scale: Scale): number {
  const t = (x - scale.xMin) / Math.max(scale.xMax - scale.xMin, 1e-9);
  return scale.plot.left + t * scale.plot.width;
}

export function yToPx(y: number, scale: Scale): number {
  const t = (y - scale.yMin) / Math.max(scale.yMax - scale.yMin, 1e-9);
  return scale.plot.bottom - t * scale.plot.height;
}

export function drawAxes(
  ctx: CanvasRenderingContext2D,
  scale: Scale,
  theme: ChartTheme,
  opts?: {
    xTicks?: number;
    yTicks?: number;
    /** `market`: horizontal grid only, stock-chart style. */
    style?: "default" | "market";
  },
): void {
  const { plot } = scale;
  const xTicks = opts?.xTicks ?? 6;
  const yTicks = opts?.yTicks ?? 5;
  const style = opts?.style ?? "default";

  ctx.save();
  ctx.strokeStyle = theme.grid;
  ctx.lineWidth = 1;
  ctx.fillStyle = theme.muted;
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  for (let i = 0; i <= yTicks; i++) {
    const y = scale.yMin + ((scale.yMax - scale.yMin) * i) / yTicks;
    const py = yToPx(y, scale);
    ctx.beginPath();
    ctx.moveTo(plot.left, py);
    ctx.lineTo(plot.right, py);
    ctx.stroke();
    ctx.fillText(formatTick(y), plot.left - 8, py);
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let i = 0; i <= xTicks; i++) {
    const x = scale.xMin + ((scale.xMax - scale.xMin) * i) / xTicks;
    const px = xToPx(x, scale);
    if (style !== "market") {
      ctx.beginPath();
      ctx.moveTo(px, plot.top);
      ctx.lineTo(px, plot.bottom);
      ctx.stroke();
    } else {
      // short tick marks at bottom only
      ctx.beginPath();
      ctx.moveTo(px, plot.bottom);
      ctx.lineTo(px, plot.bottom + 4);
      ctx.stroke();
    }
    ctx.fillText(formatTick(x), px, plot.bottom + 8);
  }

  ctx.strokeStyle = theme.axis;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(plot.left, plot.top);
  ctx.lineTo(plot.left, plot.bottom);
  ctx.lineTo(plot.right, plot.bottom);
  ctx.stroke();
  ctx.restore();
}

function formatTick(v: number): string {
  if (Math.abs(v) >= 1000) return v.toFixed(0);
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(1);
}
