export type CodeName = { code: string; name: string };

export const SALES_ORGS: CodeName[] = [
  { code: "1000", name: "国内销售组织" },
];

export const PLANTS: CodeName[] = [
  { code: "1000", name: "总部工厂" },
];

export const CUSTOMERS: CodeName[] = [
  { code: "C-1001", name: "华中贸易" },
  { code: "C-2099", name: "未分配组织（负例）" },
];

export const MATERIALS: (CodeName & { defaultUnit: string })[] = [
  { code: "FG-100", name: "成品 A", defaultUnit: "EA" },
  { code: "FG-200", name: "成品 B", defaultUnit: "EA" },
  { code: "FG-NONE", name: "不存在物料（负例）", defaultUnit: "EA" },
];

/** Status codes for filters; labels via i18n `status.order.*`. */
export const ORDER_STATUS_CODES = [
  "Open",
  "PartiallyDelivered",
  "Delivered",
  "PartiallyBilled",
  "Billed",
  "Cancelled",
] as const;

/** @deprecated Prefer ORDER_STATUS_CODES + i18n labels */
export const ORDER_STATUSES: { code: string; label: string }[] =
  ORDER_STATUS_CODES.map((code) => ({ code, label: code }));

export const CURRENCIES = ["CNY"] as const;
