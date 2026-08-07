"use client";

import { Check } from "lucide-react";
import { useTheme } from "@/shared/theme/ThemeProvider";
import { THEME_IDS, THEME_LABELS, type ThemeId } from "@/shared/theme/types";
import { cn } from "@/shared/lib/utils";

const SWATCH: Record<ThemeId, string> = {
  blue: "bg-[oklch(0.62_0.09_232)]",
  warm: "bg-[oklch(0.68_0.11_55)]",
  white: "bg-white ring-black/15",
};

type ThemeSwitcherProps = {
  className?: string;
  /** pills: compact chips; menu: settings-list rows */
  variant?: "pills" | "menu";
};

export function ThemeSwitcher({
  className,
  variant = "menu",
}: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();

  if (variant === "pills") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-border bg-card/80 p-1",
          className,
        )}
        role="radiogroup"
        aria-label="主题颜色"
      >
        {THEME_IDS.map((id) => {
          const active = theme === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setTheme(id)}
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

  return (
    <div
      className={cn("flex flex-col gap-1", className)}
      role="radiogroup"
      aria-label="主题颜色"
    >
      {THEME_IDS.map((id) => {
        const active = theme === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-foreground/90 hover:bg-muted",
            )}
          >
            <span
              className={cn(
                "size-4 shrink-0 rounded-full ring-1 ring-border",
                SWATCH[id],
              )}
              aria-hidden
            />
            <span className="min-w-0 flex-1 font-medium">
              {THEME_LABELS[id]}
            </span>
            {active ? (
              <Check className="size-4 shrink-0 text-primary" aria-hidden />
            ) : (
              <span className="size-4 shrink-0" aria-hidden />
            )}
          </button>
        );
      })}
    </div>
  );
}
