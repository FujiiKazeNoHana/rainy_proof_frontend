"use client";

import { useEffect, useRef } from "react";
import { readChartTheme } from "@/features/ergo/thanos_sort/lib/chart/theme";
import type { ThanosSortRun } from "@/features/ergo/thanos_sort/lib/types";

export interface RemainingCountSparkProps {
  run: ThanosSortRun | null;
  roundIndex: number;
}

export function RemainingCountSpark({
  run,
  roundIndex,
}: RemainingCountSparkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || !run) return;

    const counts = run.steps.map((s) => s.values.length);
    const theme = readChartTheme(wrap);

    const draw = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      if (counts.length === 0) return;
      const max = Math.max(...counts, 1);
      const min = Math.min(...counts);
      const pad = 6;
      const plotW = w - pad * 2;
      const plotH = h - pad * 2;

      ctx.strokeStyle = theme.grid;
      ctx.beginPath();
      ctx.moveTo(pad, pad);
      ctx.lineTo(pad, h - pad);
      ctx.lineTo(w - pad, h - pad);
      ctx.stroke();

      ctx.strokeStyle = theme.survive;
      ctx.lineWidth = 1.75;
      ctx.beginPath();
      counts.forEach((c, i) => {
        const x = pad + (i / Math.max(counts.length - 1, 1)) * plotW;
        const y =
          pad + (1 - (c - min) / Math.max(max - min, 1)) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      const idx = Math.min(roundIndex, counts.length - 1);
      const cx = pad + (idx / Math.max(counts.length - 1, 1)) * plotW;
      const cy =
        pad +
        (1 - (counts[idx]! - min) / Math.max(max - min, 1)) * plotH;
      ctx.fillStyle = theme.removed;
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [run, roundIndex]);

  return (
    <div
      ref={wrapRef}
      className="chart-theme h-24 w-full"
      data-slot="remaining-spark"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
