import type { Metadata } from "next";
import Link from "next/link";
import { SortMethodSwitcher } from "@/features/ergo/sort_visualization/SortMethodSwitcher";

export const metadata: Metadata = {
  title: "排序可视化 · Ergo",
  description: "多种排序算法过程的可视化演示",
};

export default function SortVizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border px-4 py-5 md:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              <Link href="/" className="hover:text-foreground">
                门户
              </Link>
              <span aria-hidden>/</span>
              <Link href="/ergo" className="hover:text-foreground">
                ERGO
              </Link>
              <span aria-hidden>/</span>
              <span className="text-foreground/70">排序可视化</span>
            </div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
              排序可视化
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
              在下方切换排序方法，观察不同策略如何把序列变为有序。
            </p>
          </div>
          <SortMethodSwitcher />
        </div>
      </header>
      {children}
    </div>
  );
}
