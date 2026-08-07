"use client";

import { useEffect, useId, useState } from "react";
import { useTheme } from "@/shared/theme/ThemeProvider";
import { cn } from "@/shared/lib/utils";

type Props = {
  chart: string;
  className?: string;
};

export function MermaidBlock({ chart, className }: Props) {
  const reactId = useId().replace(/:/g, "");
  const { theme } = useTheme();
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const source = chart.trim();
    if (!source) {
      setSvg("");
      setError(null);
      setPending(false);
      return;
    }

    setPending(true);
    setError(null);

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const mermaid = (await import("mermaid")).default;
          mermaid.initialize({
            startOnLoad: false,
            securityLevel: "strict",
            // 门户主题为 blue/warm/white，非暗色；暖色用中性板
            theme: theme === "warm" ? "neutral" : "default",
          });
          const id = `mermaid-${reactId}-${Math.random().toString(36).slice(2, 9)}`;
          const { svg: next } = await mermaid.render(id, source);
          if (!cancelled) {
            setSvg(next);
            setError(null);
          }
        } catch (err) {
          if (!cancelled) {
            setSvg("");
            setError(
              err instanceof Error ? err.message : "Mermaid 渲染失败",
            );
          }
        } finally {
          if (!cancelled) setPending(false);
        }
      })();
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [chart, theme, reactId]);

  if (error) {
    return (
      <div
        className={cn(
          "rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 font-mono text-xs text-destructive",
          className,
        )}
        role="alert"
      >
        Mermaid：{error}
      </div>
    );
  }

  if (pending && !svg) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        绘图中…
      </p>
    );
  }

  return (
    <div
      className={cn(
        "my-3 max-w-full overflow-x-auto [&_svg]:mx-auto [&_svg]:max-w-full",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
