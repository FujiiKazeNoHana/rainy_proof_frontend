export const THEME_IDS = ["blue", "warm"] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const THEME_STORAGE_KEY = "rainy-proof-theme";

export const DEFAULT_THEME: ThemeId = "blue";

export const THEME_LABELS: Record<ThemeId, string> = {
  blue: "淡蓝",
  warm: "暖色",
};

export function isThemeId(value: unknown): value is ThemeId {
  return value === "blue" || value === "warm";
}
