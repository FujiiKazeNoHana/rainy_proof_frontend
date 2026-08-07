"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { ThemeSwitcher } from "@/shared/components/ThemeSwitcher";
import { cn } from "@/shared/lib/utils";

export function SettingsMenu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointerDown = (event: MouseEvent | PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={open ? "关闭设置" : "打开设置"}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "border border-transparent text-muted-foreground",
          "hover:border-border/70 hover:bg-background/70 hover:text-foreground",
          "backdrop-blur-sm",
          open && "border-border/70 bg-background/80 text-foreground",
        )}
      >
        <Settings
          className={cn(
            "size-4 transition-transform duration-200",
            open && "rotate-90",
          )}
        />
      </Button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="设置"
          className={cn(
            "absolute right-0 top-[calc(100%+0.4rem)] z-50 w-60 origin-top-right",
            "rounded-xl border border-border/80 bg-popover/95 p-3 text-popover-foreground",
            "shadow-[0_12px_40px_-18px_oklch(0.35_0.04_240/0.45)] backdrop-blur-md",
            "animate-in fade-in-0 zoom-in-95 duration-150",
          )}
        >
          <div className="mb-3 border-b border-border/60 pb-2.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              设置
            </p>
            <p className="mt-1 text-sm font-medium tracking-tight">外观</p>
          </div>

          <div className="space-y-1.5">
            <p className="px-0.5 text-xs text-muted-foreground">主题颜色</p>
            <ThemeSwitcher variant="menu" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
