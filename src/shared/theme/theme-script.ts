import {
  DEFAULT_THEME,
  THEME_IDS,
  THEME_STORAGE_KEY,
  isThemeId,
  type ThemeId,
} from "./types";

const THEME_ID_SET = THEME_IDS.map((id) => JSON.stringify(id)).join(",");

/** Inline boot script — applies theme before paint to avoid flash. */
export const themeBootstrapScript = `
(function () {
  try {
    var key = ${JSON.stringify(THEME_STORAGE_KEY)};
    var allowed = [${THEME_ID_SET}];
    var stored = localStorage.getItem(key);
    var theme = allowed.indexOf(stored) >= 0 ? stored : ${JSON.stringify(DEFAULT_THEME)};
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", ${JSON.stringify(DEFAULT_THEME)});
  }
})();
`;

export function readStoredTheme(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeId(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}
