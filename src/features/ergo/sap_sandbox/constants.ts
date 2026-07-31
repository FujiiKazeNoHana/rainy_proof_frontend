export const OWNER = "ergo" as const;
export const FEATURE = "sap_sandbox" as const;

export const FEATURE_ROUTE = "/ergo/sap-sandbox" as const;
export const FEATURE_LOGIN_ROUTE = `${FEATURE_ROUTE}/login` as const;
export const SALES_ORDERS_ROUTE = `${FEATURE_ROUTE}/sales/orders` as const;

export const SALES_ORDERS_API = "/api/sales/orders" as const;
