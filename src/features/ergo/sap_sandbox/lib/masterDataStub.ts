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

export const ORDER_STATUSES: { code: string; label: string }[] = [
  { code: "Open", label: "打开" },
  { code: "PartiallyDelivered", label: "部分交货" },
  { code: "Delivered", label: "已交货" },
  { code: "PartiallyBilled", label: "部分开票" },
  { code: "Billed", label: "已开票" },
  { code: "Cancelled", label: "已取消" },
];

export const CURRENCIES = ["CNY"] as const;
