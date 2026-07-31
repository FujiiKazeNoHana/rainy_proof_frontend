"use client";

import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { monotonicKind } from "@/features/ergo/thanos_sort/lib/engine/thanosSort";
import type { LodMode, Step } from "@/features/ergo/thanos_sort/lib/types";

export interface RoundStatsProps {
  step: Step | null;
  mode: LodMode | null;
  totalRounds: number;
  initialCount: number;
}

export function RoundStats({
  step,
  mode,
  totalRounds,
  initialCount,
}: RoundStatsProps) {
  if (!step) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>轮次统计</CardTitle>
          <CardDescription>生成序列后开始播放</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const remaining = step.values.length;
  const done = step.sorted && step.removedIndices.length === 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">轮次统计</CardTitle>
          {mode ? (
            <Badge variant="secondary">
              {mode === "spark"
                ? "行情折线"
                : mode === "stem"
                  ? "细茎图"
                  : mode === "bar"
                    ? "柱状图"
                    : "数值标签"}
            </Badge>
          ) : null}
        </div>
        <CardDescription>
          {done
            ? doneLabel(step.values)
            : `第 ${step.round} 轮 · 共 ${totalRounds} 步`}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-3 text-sm">
        <Stat label="初始" value={initialCount} />
        <Stat label="当前" value={remaining} />
        <Stat label="本轮删除" value={step.removedIndices.length} />
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="text-lg font-medium tabular-nums">{value}</div>
    </div>
  );
}

function doneLabel(values: number[]): string {
  switch (monotonicKind(values)) {
    case "non-decreasing":
      return "已单调非递减";
    case "non-increasing":
      return "已单调非递增";
    case "flat":
      return "已完成（相等/单元素）";
    default:
      return "已单调有序";
  }
}
