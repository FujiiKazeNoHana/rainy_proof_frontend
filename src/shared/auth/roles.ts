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
