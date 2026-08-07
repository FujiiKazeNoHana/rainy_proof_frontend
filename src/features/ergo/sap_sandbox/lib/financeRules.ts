import { FI_ACCOUNTING_UI_ENABLED, FINANCE_AP_ROUTE, FINANCE_AR_ROUTE } from "../constants";
import type { FiSide } from "./financeTypes";

/** D-FE-FI-POLL */
export const FI_POLL = { intervalMs: 2000, maxAttempts: 15 } as const;

export function isFinanceAccountingUiEnabled(): boolean {
  return FI_ACCOUNTING_UI_ENABLED;
}

export function partnerLabel(
  code: string,
  name?: string | null,
): string {
  return name ? `${code} · ${name}` : code;
}

export function financeDetailRoute(side: FiSide, id: string): string {
  return side === "AR"
    ? `${FINANCE_AR_ROUTE}/${id}`
    : `${FINANCE_AP_ROUTE}/${id}`;
}

export function financeListRoute(side: FiSide): string {
  return side === "AR" ? FINANCE_AR_ROUTE : FINANCE_AP_ROUTE;
}

/** Route side vs response side mismatch → link to correct detail. */
export function financeSideMismatchRedirect(
  routeSide: FiSide,
  docSide: FiSide,
  id: string,
): string | null {
  if (routeSide === docSide) return null;
  return financeDetailRoute(docSide, id);
}

export function accountingDocumentStatusBadgeVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Open":
      return "secondary";
    default:
      return "outline";
  }
}
