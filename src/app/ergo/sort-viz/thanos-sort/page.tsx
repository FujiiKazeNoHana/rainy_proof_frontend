"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { loadRun } from "@/features/ergo/thanos_sort/api/loadRun";
import { ControlPanel } from "@/features/ergo/thanos_sort/components/ControlPanel";
import { PlayerChart } from "@/features/ergo/thanos_sort/components/PlayerChart";
import { RemainingCountSpark } from "@/features/ergo/thanos_sort/components/RemainingCountSpark";
import { RoundStats } from "@/features/ergo/thanos_sort/components/RoundStats";
import { modeFor } from "@/features/ergo/thanos_sort/lib/chart/modeFor";
import { monotonicKind } from "@/features/ergo/thanos_sort/lib/engine/thanosSort";
import type {
  LoadRunParams,
  LodMode,
  ThanosSortRun,
} from "@/features/ergo/thanos_sort/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

const DEFAULT_PARAMS: LoadRunParams = {
  n: 2048,
  minValue: 0,
  maxValue: 1000,
  seed: "snap",
};

export default function ThanosSortPage() {
  const [params, setParams] = useState<LoadRunParams>(DEFAULT_PARAMS);
  const [run, setRun] = useState<ThanosSortRun | null>(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [busy, setBusy] = useState(false);
  const [showCrosshair, setShowCrosshair] = useState(true);
  const [mode, setMode] = useState<LodMode | null>(null);

  const maxRound = Math.max((run?.steps.length ?? 1) - 1, 0);
  const step = run?.steps[roundIndex] ?? null;

  const derivedMode = useMemo(
    () => (step ? modeFor(step.values.length) : null),
    [step],
  );

  const handleStart = useCallback(() => {
    setBusy(true);
    setPlaying(false);
    // Fresh seed each Start so initial values and removals differ every click.
    const seed = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const nextParams = { ...params, seed };
    setParams(nextParams);
    void (async () => {
      try {
        const next = await loadRun(nextParams);
        startTransition(() => {
          setRun(next);
          setRoundIndex(0);
          setPlaying(true);
        });
      } finally {
        setBusy(false);
      }
    })();
  }, [params]);

  const handleReset = useCallback(() => {
    setPlaying(false);
    setRoundIndex(0);
  }, []);

  const handleStep = useCallback(() => {
    setRoundIndex((i) => Math.min(i + 1, maxRound));
  }, [maxRound]);

  // Playback loop
  useEffect(() => {
    if (!playing || !run) return;
    const baseMs = 450;
    const delay = baseMs / speed;
    const id = window.setTimeout(() => {
      setRoundIndex((i) => {
        if (i >= maxRound) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, delay);
    return () => window.clearTimeout(id);
  }, [playing, run, roundIndex, speed, maxRound]);

  return (
    <div className="flex flex-1 flex-col">
      <ControlPanel
        params={params}
        onParamsChange={setParams}
        playing={playing}
        speed={speed}
        onSpeedChange={setSpeed}
        roundIndex={roundIndex}
        maxRound={maxRound}
        onRoundChange={(r) => {
          setPlaying(false);
          setRoundIndex(r);
        }}
        showCrosshair={showCrosshair}
        onShowCrosshairChange={setShowCrosshair}
        onStart={handleStart}
        onTogglePlay={() => setPlaying((p) => !p)}
        onStep={handleStep}
        onReset={handleReset}
        busy={busy}
        hasRun={!!run}
      />

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-6 md:px-6">
        <PlayerChart
          step={step}
          showCrosshair={showCrosshair}
          onModeChange={setMode}
        />

        <div className="grid gap-4 md:grid-cols-[1fr_280px]">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">剩余数量 · 轮次</CardTitle>
              <CardDescription>与主图同步的剩余序列长度曲线</CardDescription>
            </CardHeader>
            <CardContent>
              <RemainingCountSpark run={run} roundIndex={roundIndex} />
            </CardContent>
          </Card>
          <RoundStats
            step={step}
            mode={mode ?? derivedMode}
            totalRounds={run?.steps.length ?? 0}
            initialCount={run?.initialValues.length ?? 0}
          />
        </div>

        {step?.sorted && step.removedIndices.length === 0 && run ? (
          <Card className="border-accent bg-accent/40">
            <CardHeader>
              <CardTitle>排序完成</CardTitle>
              <CardDescription>
                经过 {Math.max(run.steps.length - 1, 0)} 轮消去，剩余{" "}
                {step.values.length} 个元素，
                {describeMonotonic(step.values)}。
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function describeMonotonic(values: number[]): string {
  switch (monotonicKind(values)) {
    case "non-decreasing":
      return "已单调非递减（允许相等）";
    case "non-increasing":
      return "已单调非递增（允许相等）";
    case "flat":
      return "已全部相等或仅剩单个元素";
    default:
      return "已单调有序";
  }
}
