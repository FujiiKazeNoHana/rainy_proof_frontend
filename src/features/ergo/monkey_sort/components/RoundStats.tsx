"use client";

import type { MonkeySortRun, MonkeyStep } from "@/features/ergo/monkey_sort/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

export function RoundStats({
  step,
  run,
}: {
  step: MonkeyStep | null;
  run: MonkeySortRun | null;
}) {
  if (!step || !run) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>尝试统计</CardTitle>
          <CardDescription>生成序列后开始洗牌</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">尝试统计</CardTitle>
        <CardDescription>
          {step.sorted
            ? "已非递减有序"
            : run.exhausted
              ? "已达尝试上限"
              : `第 ${step.round} 次排列`}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-3 text-sm">
        <Stat label="长度" value={step.values.length} />
        <Stat label="当前尝试" value={step.round} />
        <Stat label="总步数" value={run.steps.length} />
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
