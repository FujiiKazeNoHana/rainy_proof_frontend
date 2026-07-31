import {
  drawAxes,
  makePlotRect,
  niceYRange,
  xToPx,
  yToPx,
  type Scale,
} from "../drawAxes";
import type { RenderContext } from "./types";

export function renderBar(rc: RenderContext): void {
  const { ctx, width, height, theme, step, removeProgress, hoverIndex } = rc;
  const values = step.values;
  const n = values.length;
  const plot = makePlotRect(width, height);
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
  drawAxes(ctx, scale, theme);

  const removed = new Set(step.removedIndices);
  const gap = 0.18;
  const barUnit = plot.width / Math.max(n, 1);
  const barW = Math.max(2, barUnit * (1 - gap));
  const baseline = yToPx(0, scale);

  for (let i = 0; i < n; i++) {
    const isRemoved = removed.has(i);
    let alpha = 1;
    let highlight = false;
    if (isRemoved) {
      if (removeProgress < 0.4) {
        highlight = true;
        alpha = 1;
      } else {
        alpha = Math.max(0, 1 - (removeProgress - 0.4) / 0.6);
      }
    }
    if (alpha <= 0.01) continue;

    const cx = xToPx(i, scale);
    const top = yToPx(values[i]!, scale);
    const h = baseline - top;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = highlight || isRemoved ? theme.removed : theme.survive;
    if (hoverIndex === i) {
      ctx.fillStyle = theme.axis;
    }
    ctx.fillRect(cx - barW / 2, Math.min(top, baseline), barW, Math.abs(h) || 1);
    ctx.globalAlpha = 1;
  }

  if (hoverIndex != null && hoverIndex >= 0 && hoverIndex < n) {
    ctx.fillStyle = theme.label;
    ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(
      `[${hoverIndex}] = ${values[hoverIndex]}`,
      plot.left + 8,
      plot.top + 8,
    );
  }
}
