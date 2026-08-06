import {
  SALES_BILLING_ROUTE,
  SALES_DELIVERIES_ROUTE,
  SALES_ORDERS_ROUTE,
} from "../constants";
import type { DocumentFlowNode, DocumentFlowNodeType } from "./billingTypes";
import type { SalesOrder } from "./types";

export function billableQty(deliveredQty: number, billedQty: number): number {
  return Math.max(0, deliveredQty - billedQty);
}

export function canCreateBillingFromOrder(order: SalesOrder | null): boolean {
  if (!order || order.status === "Cancelled") return false;
  return (order.lines ?? []).some(
    (l) => billableQty(l.deliveredQty, l.billedQty) > 0,
  );
}

export function mapDocumentFlowHref(
  type: DocumentFlowNodeType,
  id: string,
): string {
  switch (type) {
    case "SalesOrder":
      return `${SALES_ORDERS_ROUTE}/${id}`;
    case "OutboundDelivery":
      return `${SALES_DELIVERIES_ROUTE}/${id}`;
    case "BillingDocument":
      return `${SALES_BILLING_ROUTE}/${id}`;
    default:
      return SALES_ORDERS_ROUTE;
  }
}

export function documentFlowNodeHref(node: DocumentFlowNode): string {
  return mapDocumentFlowHref(node.type, node.id);
}

export function billingStatusBadgeVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Posted":
      return "secondary";
    default:
      return "outline";
  }
}
