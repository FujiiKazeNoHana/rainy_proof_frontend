"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import { loadRun } from "@/features/ergo/monkey_sort/api/loadRun";
import { ArrayBoard } from "@/features/ergo/monkey_sort/components/ArrayBoard";
import { ControlPanel } from "@/features/ergo/monkey_sort/components/ControlPanel";
import { RoundStats } from "@/features/ergo/monkey_sort/components/RoundStats";
import { DEFAULT_N } from "@/features/ergo/monkey_sort/constants";
import type {
  LoadRunParams,
  MonkeySortRun,
} from "@/features/ergo/monkey_sort/lib/types";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

const DEFAULT_PARAMS: LoadRunParams = {
  n: DEFAULT_N,
  minValue: 0,
  maxValue: 20,
  seed: "banana",
};

export default function MonkeySortPage() {
  const [params, setParams] = useState<LoadRunParams>(DEFAULT_PARAMS);
  const [run, setRun] = useState<MonkeySortRun | null>(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [busy, setBusy] = useState(false);

  const maxRound = Math.max((run?.steps.length ?? 1) - 1, 0);
  const step = run?.steps[roundIndex] ?? null;

  const handleStart = useCallback(() => {
    setBusy(true);
    setPlaying(false);
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

  useEffect(() => {
    if (!playing || !run) return;
    const delay = 280 / speed;
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
        onStart={handleStart}
        onTogglePlay={() => setPlaying((p) => !p)}
        onStep={() => setRoundIndex((i) => Math.min(i + 1, maxRound))}
        onReset={() => {
          setPlaying(false);
          setRoundIndex(0);
        }}
        busy={busy}
        hasRun={!!run}
      />

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-6 md:px-6">
        <ArrayBoard step={step} />
        <div className="grid gap-4 md:grid-cols-[1fr_280px]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">当前序列</CardTitle>
              <CardDescription className="font-mono text-sm tracking-wide">
                {step
                  ? `[ ${step.values.join(", ")} ]`
                  : "尚未开始"}
              </CardDescription>
            </CardHeader>
          </Card>
          <RoundStats step={step} run={run} />
        </div>

        {step?.sorted && run ? (
          <Card className="border-accent bg-accent/40">
            <CardHeader>
              <CardTitle>排序完成</CardTitle>
              <CardDescription>
                经过 {run.attempts} 次随机打乱，序列已单调非递减。
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {run?.exhausted && !step?.sorted ? (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardHeader>
              <CardTitle>未在上限内完成</CardTitle>
              <CardDescription>
                已达到尝试上限。可减小 n 后重试（期望次数约为 n!）。
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
