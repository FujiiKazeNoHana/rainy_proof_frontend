"use client";

import { DEFAULT_N, MAX_N } from "@/features/ergo/monkey_sort/constants";
import type { LoadRunParams } from "@/features/ergo/monkey_sort/lib/types";
import { IntegerInput } from "@/shared/components/IntegerInput";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Slider } from "@/shared/components/ui/slider";
import { Pause, Play, RotateCcw, SkipForward, Dices } from "lucide-react";

export interface ControlPanelProps {
  params: LoadRunParams;
  onParamsChange: (next: LoadRunParams) => void;
  playing: boolean;
  speed: number;
  onSpeedChange: (speed: number) => void;
  roundIndex: number;
  maxRound: number;
  onRoundChange: (round: number) => void;
  onStart: () => void;
  onTogglePlay: () => void;
  onStep: () => void;
  onReset: () => void;
  busy?: boolean;
  hasRun: boolean;
}

export function ControlPanel({
  params,
  onParamsChange,
  playing,
  speed,
  onSpeedChange,
  roundIndex,
  maxRound,
  onRoundChange,
  onStart,
  onTogglePlay,
  onStep,
  onReset,
  busy,
  hasRun,
}: ControlPanelProps) {
  return (
    <div className="sticky top-0 z-10 flex flex-col gap-4 border-b border-border bg-background/90 px-4 py-4 backdrop-blur md:px-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={`长度 n（1–${MAX_N}）`}>
          <IntegerInput
            min={1}
            max={MAX_N}
            emptyValue={0}
            value={params.n}
            placeholder={String(DEFAULT_N)}
            onValueChange={(n) => onParamsChange({ ...params, n })}
          />
        </Field>
        <Field label="最小值">
          <IntegerInput
            value={params.minValue}
            onValueChange={(minValue) =>
              onParamsChange({ ...params, minValue })
            }
          />
        </Field>
        <Field label="最大值">
          <IntegerInput
            value={params.maxValue}
            onValueChange={(maxValue) =>
              onParamsChange({ ...params, maxValue })
            }
          />
        </Field>
        <Field label="Seed（每次开始自动刷新）">
          <Input
            value={String(params.seed)}
            onChange={(e) =>
              onParamsChange({ ...params, seed: e.target.value })
            }
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onStart} disabled={busy}>
          <Dices data-icon="inline-start" />
          开始
        </Button>
        <Button variant="outline" onClick={onTogglePlay} disabled={!hasRun}>
          {playing ? (
            <Pause data-icon="inline-start" />
          ) : (
            <Play data-icon="inline-start" />
          )}
          {playing ? "暂停" : "播放"}
        </Button>
        <Button variant="outline" onClick={onStep} disabled={!hasRun || playing}>
          <SkipForward data-icon="inline-start" />
          单步
        </Button>
        <Button variant="ghost" onClick={onReset} disabled={!hasRun}>
          <RotateCcw data-icon="inline-start" />
          重置
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <Label>尝试次数</Label>
            <span className="tabular-nums text-muted-foreground">
              {hasRun ? `${roundIndex} / ${maxRound}` : "—"}
            </span>
          </div>
          <Slider
            min={0}
            max={Math.max(maxRound, 0)}
            step={1}
            value={[hasRun ? roundIndex : 0]}
            onValueChange={(v) => {
              const n = Array.isArray(v) ? v[0] : v;
              onRoundChange(n ?? 0);
            }}
            disabled={!hasRun}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <Label>速度</Label>
            <span className="tabular-nums text-muted-foreground">
              {speed.toFixed(1)}×
            </span>
          </div>
          <Slider
            min={0.25}
            max={8}
            step={0.25}
            value={[speed]}
            onValueChange={(v) => {
              const n = Array.isArray(v) ? v[0] : v;
              onSpeedChange(n ?? 1);
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
