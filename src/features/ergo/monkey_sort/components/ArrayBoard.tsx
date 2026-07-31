"use client";

import { useEffect, useRef } from "react";
import type { MonkeyStep } from "@/features/ergo/monkey_sort/lib/types";
import { readChartTheme } from "@/shared/lib/chart-theme";
import { cn } from "@/shared/lib/utils";

export function ArrayBoard({
  step,
  className,
}: {
  step: MonkeyStep | null;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas || !step) return;

    const draw = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const theme = readChartTheme(wrap);
      ctx.fillStyle = theme.background;
      ctx.fillRect(0, 0, width, height);

      const values = step.values;
      const n = values.length;
      if (n === 0) return;

      let min = Infinity;
      let max = -Infinity;
      for (const v of values) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
      if (min === max) {
        min -= 1;
        max += 1;
      }

      const padL = 36;
      const padR = 16;
      const padT = 28;
      const padB = 28;
      const plotW = width - padL - padR;
      const plotH = height - padT - padB;
      const gap = 0.22;
      const unit = plotW / n;
      const barW = Math.max(18, unit * (1 - gap));

      // grid
      ctx.strokeStyle = theme.grid;
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = padT + (plotH * i) / 4;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(padL + plotW, y);
        ctx.stroke();
      }

      ctx.font = "13px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "center";

      for (let i = 0; i < n; i++) {
        const v = values[i]!;
        const t = (v - min) / (max - min);
        const h = Math.max(4, t * plotH);
        const x = padL + i * unit + (unit - barW) / 2;
        const y = padT + plotH - h;
        ctx.fillStyle = step.sorted ? theme.survive : theme.survive;
        ctx.globalAlpha = step.sorted ? 1 : 0.85;
        roundRect(ctx, x, y, barW, h, 6);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.fillStyle = theme.label;
        ctx.textBaseline = "bottom";
        ctx.fillText(String(v), x + barW / 2, y - 6);
        ctx.fillStyle = theme.muted;
        ctx.textBaseline = "top";
        ctx.fillText(String(i), x + barW / 2, padT + plotH + 6);
      }
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [step]);

  return (
    <div
      ref={wrapRef}
      className={cn(
        "chart-theme relative h-[min(420px,50vh)] w-full overflow-hidden rounded-xl border border-border",
        className,
      )}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {!step ? (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          配置参数后点击「开始」
        </div>
      ) : null}
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
