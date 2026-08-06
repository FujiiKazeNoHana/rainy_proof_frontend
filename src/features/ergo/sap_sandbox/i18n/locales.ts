export type SapLocale = "zh" | "en";

export const SAP_LOCALE_STORAGE_KEY = "rainy-proof-sap-locale";

export const SAP_LOCALES: { code: SapLocale; label: string }[] = [
  { code: "zh", label: "中文" },
  { code: "en", label: "English" },
];

export function isSapLocale(value: unknown): value is SapLocale {
  return value === "zh" || value === "en";
}

export function loadSapLocale(): SapLocale {
  if (typeof window === "undefined") return "zh";
  try {
    const raw = window.localStorage.getItem(SAP_LOCALE_STORAGE_KEY);
    if (isSapLocale(raw)) return raw;
  } catch {
    // ignore
  }
  return "zh";
}

export function saveSapLocale(locale: SapLocale) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SAP_LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignore
  }
}
