export const OWNER = "ergo" as const;
export const FEATURE = "sap_sandbox" as const;

export const FEATURE_ROUTE = "/ergo/sap-sandbox" as const;
export const FEATURE_LOGIN_ROUTE = `${FEATURE_ROUTE}/login` as const;
export const SALES_ORDERS_ROUTE = `${FEATURE_ROUTE}/sales/orders` as const;
export const SALES_DELIVERIES_ROUTE = `${FEATURE_ROUTE}/sales/deliveries` as const;
export const SALES_BILLING_ROUTE = `${FEATURE_ROUTE}/sales/billing` as const;
export const INVENTORY_STOCK_ROUTE = `${FEATURE_ROUTE}/inventory/stock` as const;
export const INVENTORY_MOVEMENTS_ROUTE =
  `${FEATURE_ROUTE}/inventory/movements` as const;
export const INVENTORY_ROUTE = `${FEATURE_ROUTE}/inventory` as const;
export const MASTERDATA_ROUTE = `${FEATURE_ROUTE}/master-data` as const;
export const MASTERDATA_SALES_ROUTE = `${MASTERDATA_ROUTE}/sales` as const;
export const MASTERDATA_PROCUREMENT_ROUTE =
  `${MASTERDATA_ROUTE}/procurement` as const;
export const PROCUREMENT_ROUTE = `${FEATURE_ROUTE}/procurement` as const;
export const PURCHASE_ORDERS_ROUTE =
  `${PROCUREMENT_ROUTE}/purchase-orders` as const;
export const GOODS_RECEIPTS_ROUTE =
  `${PROCUREMENT_ROUTE}/goods-receipts` as const;
export const INVOICE_RECEIPTS_ROUTE =
  `${PROCUREMENT_ROUTE}/invoice-receipts` as const;
export const FINANCE_ROUTE = `${FEATURE_ROUTE}/finance` as const;
export const FINANCE_AR_ROUTE = `${FINANCE_ROUTE}/ar` as const;
export const FINANCE_AP_ROUTE = `${FINANCE_ROUTE}/ap` as const;

/** D-FE-IR-SHIP: hide IR nav/buttons until Gateway IR smoke returns 201. */
export const INVOICE_RECEIPTS_UI_ENABLED = true;

/** D-FE-FI-SHIP: hide FI until Gateway AR+AP list smoke returns 200. */
export const FI_ACCOUNTING_UI_ENABLED = true;

export const SALES_ORDERS_API = "/api/sales/orders" as const;
export const SALES_DELIVERIES_API = "/api/sales/deliveries" as const;
export const SALES_BILLING_API = "/api/sales/billing-documents" as const;
export const INVENTORY_API = "/api/inventory" as const;
export const MASTERDATA_API = "/api/masterdata" as const;
export const PROCUREMENT_API = "/api/procurement" as const;
export const PURCHASE_ORDERS_API = `${PROCUREMENT_API}/orders` as const;
export const GOODS_RECEIPTS_API = `${PROCUREMENT_API}/goods-receipts` as const;
export const INVOICE_RECEIPTS_API =
  `${PROCUREMENT_API}/invoice-receipts` as const;
export const FINANCE_API = "/api/finance" as const;
export const ACCOUNTING_DOCUMENTS_API =
  `${FINANCE_API}/accounting-documents` as const;
