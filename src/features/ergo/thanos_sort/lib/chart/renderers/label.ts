import {
  drawAxes,
  makePlotRect,
  niceYRange,
  xToPx,
  yToPx,
  type Scale,
} from "../drawAxes";
import type { RenderContext } from "./types";

export function renderLabel(rc: RenderContext): void {
  const { ctx, width, height, theme, step, removeProgress, hoverIndex } = rc;
  const values = step.values;
  const n = values.length;
  const plot = makePlotRect(width, height, {
    left: 48,
    right: 16,
    top: 24,
    bottom: 40,
  });
  const yRange = niceYRange(values);
  const scale: Scale = {
    xMin: -0.5,
    xMax: Math.max(n - 0.5, 0.5),
    yMin: Math.min(0, yRange.min),
    yMax: yRange.max,
    plot,
  };

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, width, height);
  drawAxes(ctx, scale, theme, { xTicks: Math.min(n, 8), yTicks: 5 });

  const removed = new Set(step.removedIndices);
  const gap = 0.22;
  const barUnit = plot.width / Math.max(n, 1);
  const barW = Math.max(8, barUnit * (1 - gap));
  const baseline = yToPx(0, scale);

  ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";

  for (let i = 0; i < n; i++) {
    const isRemoved = removed.has(i);
    let alpha = 1;
    if (isRemoved) {
      alpha =
        removeProgress < 0.35
          ? 1
          : Math.max(0, 1 - (removeProgress - 0.35) / 0.65);
    }
    if (alpha <= 0.01) continue;

    const cx = xToPx(i, scale);
    const top = yToPx(values[i]!, scale);
    const h = baseline - top;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = isRemoved ? theme.removed : theme.survive;
    if (hoverIndex === i) ctx.fillStyle = theme.axis;
    const y = Math.min(top, baseline);
    const bh = Math.abs(h) || 1;
    ctx.beginPath();
    roundRect(ctx, cx - barW / 2, y, barW, bh, 4);
    ctx.fill();

    ctx.fillStyle = theme.label;
    ctx.textBaseline = "bottom";
    ctx.fillText(String(values[i]), cx, y - 4);
    ctx.globalAlpha = 1;
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
