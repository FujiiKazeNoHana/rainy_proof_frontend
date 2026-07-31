"use client";

import { useTheme } from "@/shared/theme/ThemeProvider";
import { THEME_IDS, THEME_LABELS, type ThemeId } from "@/shared/theme/types";
import { cn } from "@/shared/lib/utils";

const SWATCH: Record<ThemeId, string> = {
  blue: "bg-[oklch(0.62_0.09_232)]",
  warm: "bg-[oklch(0.68_0.11_55)]",
};

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-card/80 p-1 shadow-sm backdrop-blur",
        className,
      )}
      role="group"
      aria-label="主题色"
    >
      {THEME_IDS.map((id) => {
        const active = theme === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setTheme(id)}
            aria-pressed={active}
            title={THEME_LABELS[id]}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "size-2.5 rounded-full ring-1 ring-black/10",
                SWATCH[id],
              )}
              aria-hidden
            />
            {THEME_LABELS[id]}
          </button>
        );
      })}
    </div>
  );
}
