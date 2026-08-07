export const THEME_IDS = ["blue", "warm", "white"] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const THEME_STORAGE_KEY = "rainy-proof-theme";

export const DEFAULT_THEME: ThemeId = "blue";

export const THEME_LABELS: Record<ThemeId, string> = {
  blue: "淡蓝",
  warm: "暖色",
  white: "纯白",
};

export function isThemeId(value: unknown): value is ThemeId {
  return (
    typeof value === "string" &&
    (THEME_IDS as readonly string[]).includes(value)
  );
}
