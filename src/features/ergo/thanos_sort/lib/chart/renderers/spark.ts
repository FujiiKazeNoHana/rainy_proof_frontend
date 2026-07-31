import { downsampleLttb, downsampleMinMax } from "../downsample";
import {
  drawAxes,
  makePlotRect,
  niceYRange,
  xToPx,
  yToPx,
  type Scale,
} from "../drawAxes";
import type { RenderContext } from "./types";

/**
 * Large-n market overview: mountain area + polyline (stock-chart style).
 * Uses LTTB for the line and minmax envelope for a soft volatility band.
 */
export function renderSpark(rc: RenderContext): void {
  const { ctx, width, height, theme, step, removeProgress } = rc;
  const values = step.values;
  const n = values.length;
  const plot = makePlotRect(width, height, {
    left: 52,
    right: 56,
    top: 20,
    bottom: 40,
  });
  const yRange = niceYRange(values);
  const scale: Scale = {
    xMin: 0,
    xMax: Math.max(n - 1, 1),
    yMin: yRange.min,
    yMax: yRange.max,
    plot,
  };

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, width, height);
  drawAxes(ctx, scale, theme, { style: "market", xTicks: 6, yTicks: 5 });

  const removed = new Set(step.removedIndices);
  const pixelBuckets = Math.max(Math.floor(plot.width), 2);
  const lineBudget = Math.min(Math.max(pixelBuckets, 120), 1600);
  const points = downsampleLttb(values, lineBudget);
  const bands = downsampleMinMax(values, Math.min(pixelBuckets, 600));

  // Soft minmax envelope (range band)
  if (bands.length > 1) {
    ctx.beginPath();
    for (let i = 0; i < bands.length; i++) {
      const b = bands[i]!;
      const px = xToPx(b.x, scale);
      const py = yToPx(b.max, scale);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    for (let i = bands.length - 1; i >= 0; i--) {
      const b = bands[i]!;
      ctx.lineTo(xToPx(b.x, scale), yToPx(b.min, scale));
    }
    ctx.closePath();
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = theme.survive;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Mountain fill under the polyline
  if (points.length > 0) {
    const first = points[0]!;
    const last = points[points.length - 1]!;
    ctx.beginPath();
    ctx.moveTo(xToPx(first.x, scale), plot.bottom);
    for (let i = 0; i < points.length; i++) {
      const p = points[i]!;
      ctx.lineTo(xToPx(p.x, scale), yToPx(p.y, scale));
    }
    ctx.lineTo(xToPx(last.x, scale), plot.bottom);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, plot.top, 0, plot.bottom);
    grad.addColorStop(0, withAlpha(theme.survive, 0.38));
    grad.addColorStop(0.55, withAlpha(theme.survive, 0.14));
    grad.addColorStop(1, withAlpha(theme.survive, 0.02));
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Main price line
  ctx.beginPath();
  ctx.strokeStyle = theme.survive;
  ctx.lineWidth = 1.75;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (let i = 0; i < points.length; i++) {
    const p = points[i]!;
    const px = xToPx(p.x, scale);
    const py = yToPx(p.y, scale);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // End marker (last "price")
  if (n > 0) {
    const lastIdx = n - 1;
    const lastV = values[lastIdx]!;
    const lx = xToPx(lastIdx, scale);
    const ly = yToPx(lastV, scale);
    ctx.fillStyle = theme.survive;
    ctx.beginPath();
    ctx.arc(lx, ly, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Right-edge last-value tag
    const tag = formatValue(lastV);
    ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
    const tw = ctx.measureText(tag).width;
    const tagX = Math.min(plot.right + 4, width - tw - 8);
    const tagY = Math.min(Math.max(ly, plot.top + 10), plot.bottom - 10);
    ctx.fillStyle = theme.survive;
    roundRectFill(ctx, tagX, tagY - 9, tw + 8, 18, 3);
    ctx.fillStyle = theme.background;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(tag, tagX + 4, tagY);
  }

  // Removal wipe along the series
  if (removed.size > 0 && removeProgress < 1) {
    const alpha =
      removeProgress < 0.35
        ? 0.85
        : Math.max(0, 1 - (removeProgress - 0.35) / 0.65);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = theme.removed;
    ctx.fillStyle = theme.removed;
    ctx.lineWidth = 1.25;
    const stepX = Math.max(1, Math.floor(n / Math.min(pixelBuckets, 400)));
    for (const idx of removed) {
      if (idx % stepX !== 0 && stepX > 1) continue;
      const px = xToPx(idx, scale);
      const py = yToPx(values[idx]!, scale);
      ctx.beginPath();
      ctx.arc(px, py, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Stock-style crosshair + readout
  if (rc.hoverIndex != null && rc.hoverIndex >= 0 && rc.hoverIndex < n) {
    const hx = xToPx(rc.hoverIndex, scale);
    const hy = yToPx(values[rc.hoverIndex]!, scale);

    ctx.strokeStyle = theme.muted;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(hx, plot.top);
    ctx.lineTo(hx, plot.bottom);
    ctx.moveTo(plot.left, hy);
    ctx.lineTo(plot.right, hy);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = theme.survive;
    ctx.beginPath();
    ctx.arc(hx, hy, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = theme.background;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const label = `下标 ${rc.hoverIndex}  ·  值 ${formatValue(values[rc.hoverIndex]!)}`;
    ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
    const lw = ctx.measureText(label).width;
    const boxW = lw + 14;
    const boxH = 26;
    let boxX = hx + 12;
    let boxY = hy - boxH - 8;
    if (boxX + boxW > plot.right) boxX = hx - boxW - 12;
    if (boxY < plot.top) boxY = hy + 10;
    ctx.fillStyle = withAlpha(theme.label, 0.88);
    roundRectFill(ctx, boxX, boxY, boxW, boxH, 6);
    ctx.fillStyle = theme.background;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(label, boxX + 7, boxY + boxH / 2);
  }

  // Corner meta
  ctx.fillStyle = theme.muted;
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`行情概览 · ${n.toLocaleString("zh-CN")} 点`, plot.left + 6, plot.top + 4);
}

function formatValue(v: number): string {
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(2);
}

function withAlpha(color: string, alpha: number): string {
  const hex = color.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1]!, 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }
  // Fallback: draw opaque; callers often also set globalAlpha
  return color;
}

function roundRectFill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
  ctx.fill();
}
