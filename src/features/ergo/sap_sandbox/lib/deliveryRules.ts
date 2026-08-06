import type { DeliveryListItem } from "./deliveryTypes";

export function canCreateFromOrderStatus(status: string): boolean {
  return status === "Open" || status === "PartiallyDelivered";
}

export function canCancelDelivery(status: string): boolean {
  return status === "Open";
}

export function canPostPgi(status: string): boolean {
  return status === "Open" || status === "GoodsIssued";
}

export function deliveryStatusBadgeVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Open":
      return "default";
    case "GoodsIssued":
      return "secondary";
    case "Cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

/** Open 交货对某 SO 行的占量合计 */
export function sumOpenReservedByLine(
  deliveries: DeliveryListItem[],
  lineQtys: Map<string, number>,
): Map<string, number> {
  // list items don't include line qty — create page uses detail lines from open DNs
  void deliveries;
  return lineQtys;
}

/**
 * remaining = orderedQty - deliveredQty - openReserved
 * （前端提示；以后端校验为准）
 */
export function remainingDeliverableQty(
  orderedQty: number,
  deliveredQty: number,
  openReserved: number,
): number {
  return Math.max(0, orderedQty - deliveredQty - openReserved);
}
