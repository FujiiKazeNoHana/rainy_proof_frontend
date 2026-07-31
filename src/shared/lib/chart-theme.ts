export interface ChartTheme {
  survive: string;
  removed: string;
  axis: string;
  grid: string;
  background: string;
  label: string;
  muted: string;
}

const FALLBACK: ChartTheme = {
  survive: "#5b86b0",
  removed: "#7a6fa8",
  axis: "#6a7a8c",
  grid: "#d9e3ec",
  background: "#fbfcfe",
  label: "#334155",
  muted: "#7a8b9c",
};

/** Reads canvas colors from CSS variables so charts follow the global theme. */
export function readChartTheme(el: HTMLElement | null): ChartTheme {
  if (!el) return { ...FALLBACK };
  const styles = getComputedStyle(el);
  const pick = (name: string, fallback: string) => {
    const v = styles.getPropertyValue(name).trim();
    return v || fallback;
  };
  return {
    survive: pick("--chart-survive", FALLBACK.survive),
    removed: pick("--chart-removed", FALLBACK.removed),
    axis: pick("--chart-axis", FALLBACK.axis),
    grid: pick("--chart-grid", FALLBACK.grid),
    background: pick("--chart-background", FALLBACK.background),
    label: pick("--chart-label", FALLBACK.label),
    muted: pick("--chart-muted", FALLBACK.muted),
  };
}
