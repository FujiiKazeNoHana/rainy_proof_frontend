"use client";

import { useEffect, useRef, useState } from "react";
import { modeFor } from "@/features/ergo/thanos_sort/lib/chart/modeFor";
import { renderers } from "@/features/ergo/thanos_sort/lib/chart/renderers";
import { readChartTheme } from "@/features/ergo/thanos_sort/lib/chart/theme";
import type { LodMode, Step } from "@/features/ergo/thanos_sort/lib/types";
import { cn } from "@/shared/lib/utils";

export interface PlayerChartProps {
  step: Step | null;
  /** When true, animate removal wipe for the current step. */
  animateRemoval?: boolean;
  showCrosshair?: boolean;
  className?: string;
  onModeChange?: (mode: LodMode) => void;
}

const REMOVE_MS = 220;
const CROSSFADE_MS = 300;

export function PlayerChart({
  step,
  animateRemoval = true,
  showCrosshair = true,
  className,
  onModeChange,
}: PlayerChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasARef = useRef<HTMLCanvasElement>(null);
  const canvasBRef = useRef<HTMLCanvasElement>(null);
  const stepRef = useRef<Step | null>(step);
  const hoverRef = useRef<number | null>(null);
  const removeProgressRef = useRef(0);
  const modeRef = useRef<LodMode | null>(null);
  const [activeLayer, setActiveLayer] = useState<"a" | "b">("a");
  const [fading, setFading] = useState(false);
  const [displayMode, setDisplayMode] = useState<LodMode | null>(null);

  stepRef.current = step;

  useEffect(() => {
    if (!step) return;
    const mode = modeFor(step.values.length);
    if (modeRef.current && modeRef.current !== mode) {
      setFading(true);
      setActiveLayer((prev) => (prev === "a" ? "b" : "a"));
      const t = window.setTimeout(() => setFading(false), CROSSFADE_MS);
      modeRef.current = mode;
      setDisplayMode(mode);
      onModeChange?.(mode);
      return () => window.clearTimeout(t);
    }
    modeRef.current = mode;
    setDisplayMode(mode);
    onModeChange?.(mode);
  }, [step, onModeChange]);

  // Removal animation when step identity changes
  useEffect(() => {
    if (!step || !animateRemoval || step.removedIndices.length === 0) {
      removeProgressRef.current = 1;
      return;
    }
    removeProgressRef.current = 0;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / REMOVE_MS);
      removeProgressRef.current = t;
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step, animateRemoval]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvasA = canvasARef.current;
    const canvasB = canvasBRef.current;
    if (!wrap || !canvasA || !canvasB) return;

    let raf = 0;
    let disposed = false;

    const paint = (canvas: HTMLCanvasElement, current: Step) => {
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
      const mode = modeFor(current.values.length);
      renderers[mode]({
        ctx,
        width,
        height,
        dpr,
        theme,
        step: current,
        removeProgress: removeProgressRef.current,
        hoverIndex: showCrosshair ? hoverRef.current : null,
      });
    };

    const loop = () => {
      if (disposed) return;
      const current = stepRef.current;
      if (current) {
        paint(canvasA, current);
        paint(canvasB, current);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onMove = (e: PointerEvent) => {
      const current = stepRef.current;
      if (!current || !showCrosshair) {
        hoverRef.current = null;
        return;
      }
      const rect = wrap.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const padLeft = 48;
      const padRight = 16;
      const plotW = Math.max(1, rect.width - padLeft - padRight);
      const n = current.values.length;
      const t = (x - padLeft) / plotW;
      const idx = Math.round(t * Math.max(n - 1, 0));
      hoverRef.current =
        idx >= 0 && idx < n ? idx : null;
    };
    const onLeave = () => {
      hoverRef.current = null;
    };

    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
    };
  }, [showCrosshair]);

  return (
    <div
      ref={wrapRef}
      className={cn(
        "chart-theme relative aspect-[16/9] h-[min(480px,55vh)] w-full overflow-hidden rounded-xl border border-border bg-card",
        className,
      )}
    >
      <canvas
        ref={canvasARef}
        className={cn(
          "absolute inset-0 h-full w-full transition-opacity duration-300",
          activeLayer === "a" ? "opacity-100" : fading ? "opacity-0" : "opacity-0",
        )}
      />
      <canvas
        ref={canvasBRef}
        className={cn(
          "absolute inset-0 h-full w-full transition-opacity duration-300",
          activeLayer === "b" ? "opacity-100" : fading ? "opacity-0" : "opacity-0",
        )}
      />
      {!step ? (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          配置参数后点击「开始」
        </div>
      ) : null}
      {displayMode ? (
        <div className="pointer-events-none absolute right-3 top-3 rounded-md bg-background/70 px-2 py-1 text-xs tracking-wide text-muted-foreground backdrop-blur">
          {modeLabel(displayMode)}
        </div>
      ) : null}
    </div>
  );
}

function modeLabel(mode: LodMode): string {
  switch (mode) {
    case "spark":
      return "行情折线";
    case "stem":
      return "细茎图";
    case "bar":
      return "柱状图";
    case "label":
      return "数值标签";
  }
}
