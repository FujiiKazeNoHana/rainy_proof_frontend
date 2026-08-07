import type { DeveloperId } from "./developers";

/**
 * Top-level workspace entries shown on /ergo (and peer owner pages).
 * Nested methods live in SORT_METHODS and are switched inside the hub.
 */
export interface FeatureEntry {
  owner: DeveloperId;
  id: string;
  title: string;
  description: string;
  href: string;
  status: "ready" | "planned";
}

export interface SortMethodEntry {
  id: "thanos_sort" | "monkey_sort";
  title: string;
  description: string;
  href: string;
}

export const FEATURE_CATALOG: FeatureEntry[] = [
  {
    owner: "ergo",
    id: "sort_visualization",
    title: "排序可视化",
    description: "灭霸排序、猴子排序等多种排序过程的可视化演示。",
    href: "/ergo/sort-viz",
    status: "ready",
  },
  {
    owner: "ergo",
    id: "sap_sandbox",
    title: "SAP 沙盒",
    description: "销售订单等 SAP 学习模块（对接 Gateway）。",
    href: "/ergo/sap-sandbox",
    status: "ready",
  },
  {
    owner: "ergo",
    id: "markdown_lab",
    title: "Markdown 实验室",
    description: "实时编辑与预览 Markdown，支持 Mermaid 文本绘图。",
    href: "/ergo/markdown-lab",
    status: "ready",
  },
];

/** Methods available inside 排序可视化. */
export const SORT_METHODS: SortMethodEntry[] = [
  {
    id: "thanos_sort",
    title: "灭霸排序",
    description: "随机消去一半元素直到单调有序",
    href: "/ergo/sort-viz/thanos-sort",
  },
  {
    id: "monkey_sort",
    title: "猴子排序",
    description: "随机打乱直到非递减有序（n ≤ 10）",
    href: "/ergo/sort-viz/monkey-sort",
  },
];

export function featuresFor(owner: DeveloperId): FeatureEntry[] {
  return FEATURE_CATALOG.filter((f) => f.owner === owner);
}
