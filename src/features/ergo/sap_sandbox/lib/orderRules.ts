import type { SalesOrderStatus } from "./types";

/** Doc: Open 可改；Cancelled 只读。有交货行时仍可改数量（≥已交）但不可删行。 */
export function canEditOrder(status: string): boolean {
  return status === "Open" || status === "PartiallyDelivered";
}

export function canCancelOrder(
  status: string,
  lines: Array<{ deliveredQty: number; billedQty: number }> | null | undefined,
): boolean {
  if (status === "Cancelled") return false;
  if (status !== "Open") return false;
  if (!lines || lines.length === 0) return true;
  return lines.every((l) => (l.deliveredQty ?? 0) === 0 && (l.billedQty ?? 0) === 0);
}

export function statusBadgeVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status as SalesOrderStatus) {
    case "Open":
      return "default";
    case "Cancelled":
      return "destructive";
    case "Delivered":
    case "Billed":
      return "secondary";
    default:
      return "outline";
  }
}
