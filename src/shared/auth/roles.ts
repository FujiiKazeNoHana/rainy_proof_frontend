export const AUTH_STORAGE_KEY = "rainy-proof-sap-auth";

export type SalesRole = "Admin" | "SalesClerk" | "Inventory" | "Buyer";

export function canWriteSales(roles: readonly string[]): boolean {
  return roles.includes("Admin") || roles.includes("SalesClerk");
}

export function canReadSales(roles: readonly string[]): boolean {
  return (
    canWriteSales(roles) ||
    roles.includes("Inventory") ||
    roles.includes("Buyer")
  );
}

/** 外向交货 / PGI 写：Admin、Inventory */
export function canWriteDelivery(roles: readonly string[]): boolean {
  return roles.includes("Admin") || roles.includes("Inventory");
}

/** 交货只读：与后端 sales.delivery.read 对齐 */
export function canReadDelivery(roles: readonly string[]): boolean {
  return (
    canWriteDelivery(roles) ||
    roles.includes("SalesClerk") ||
    roles.includes("Buyer")
  );
}

/** 开票创建：仅 Admin（sales.billing.create） */
export function canWriteBilling(roles: readonly string[]): boolean {
  return roles.includes("Admin");
}

/** 开票只读：与后端 sales.billing.read 对齐 */
export function canReadBilling(roles: readonly string[]): boolean {
  return (
    roles.includes("Admin") ||
    roles.includes("SalesClerk") ||
    roles.includes("Inventory") ||
    roles.includes("Buyer")
  );
}

/** 库存余额/流水读：Policy Inventory */
export function canReadInventory(roles: readonly string[]): boolean {
  return (
    roles.includes("Admin") ||
    roles.includes("SalesClerk") ||
    roles.includes("Inventory") ||
    roles.includes("Buyer")
  );
}

/** 手工库存调整：Admin、Inventory */
export function canAdjustInventory(roles: readonly string[]): boolean {
  return roles.includes("Admin") || roles.includes("Inventory");
}

/** 主数据销售读：masterdata.read */
export function canReadMasterData(roles: readonly string[]): boolean {
  return (
    roles.includes("Admin") ||
    roles.includes("SalesClerk") ||
    roles.includes("Inventory") ||
    roles.includes("Buyer")
  );
}

/** 主数据采购读：masterdata.procurement.read */
export function canReadProcurementMasterData(roles: readonly string[]): boolean {
  return roles.includes("Admin") || roles.includes("Buyer");
}

/** 采购订单 / 收货只读：procurement.po.read / gr.read */
export function canReadProcurement(roles: readonly string[]): boolean {
  return (
    roles.includes("Admin") ||
    roles.includes("Buyer") ||
    roles.includes("Inventory")
  );
}

/** 采购订单写：procurement.po.* */
export function canWritePurchaseOrder(roles: readonly string[]): boolean {
  return roles.includes("Admin") || roles.includes("Buyer");
}

/** 收货过账：procurement.gr.post */
export function canPostGoodsReceipt(roles: readonly string[]): boolean {
  return roles.includes("Admin") || roles.includes("Inventory");
}

/** 发票校验过账：procurement.ir.post */
export function canPostInvoiceReceipt(roles: readonly string[]): boolean {
  return roles.includes("Admin") || roles.includes("Buyer");
}

/** 财务应收读：finance.ar.read */
export function canReadAr(roles: readonly string[]): boolean {
  return roles.includes("Admin") || roles.includes("SalesClerk");
}

/** 财务应付读：finance.ap.read */
export function canReadAp(roles: readonly string[]): boolean {
  return roles.includes("Admin") || roles.includes("Buyer");
}
