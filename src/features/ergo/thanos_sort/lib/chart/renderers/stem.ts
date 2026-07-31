import {
  drawAxes,
  makePlotRect,
  niceYRange,
  xToPx,
  yToPx,
  type Scale,
} from "../drawAxes";
import type { RenderContext } from "./types";

export function renderStem(rc: RenderContext): void {
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
  const baseline = yToPx(0, scale);
  const stemW = Math.max(1, (plot.width / Math.max(n, 1)) * 0.35);

  for (let i = 0; i < n; i++) {
    const isRemoved = removed.has(i);
    const fade =
      isRemoved && removeProgress > 0
        ? Math.max(0, 1 - removeProgress)
        : 1;
    if (fade <= 0.01) continue;

    const px = xToPx(i, scale);
    const py = yToPx(values[i]!, scale);
    const color = isRemoved ? theme.removed : theme.survive;
    ctx.globalAlpha = fade;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = stemW;
    ctx.beginPath();
    ctx.moveTo(px, baseline);
    ctx.lineTo(px, py);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px, py, Math.max(2, stemW * 0.9), 0, Math.PI * 2);
    ctx.fill();
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
