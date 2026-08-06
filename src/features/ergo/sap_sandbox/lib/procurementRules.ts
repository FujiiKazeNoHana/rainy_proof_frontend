import {
  GOODS_RECEIPTS_ROUTE,
  INVOICE_RECEIPTS_ROUTE,
  PURCHASE_ORDERS_ROUTE,
} from "../constants";
import type {
  ProcurementDocumentFlowNode,
  ProcurementDocumentFlowNodeType,
  PurchaseOrder,
  PurchaseOrderLine,
} from "./procurementTypes";

export function normalizeInvoicedQty(line: PurchaseOrderLine): number {
  if (line.invoicedQty == null) {
    if (typeof console !== "undefined") {
      console.warn("PO line missing invoicedQty; defaulting to 0", line.id);
    }
    return 0;
  }
  return line.invoicedQty;
}

export function remainingQty(line: PurchaseOrderLine): number {
  return Math.max(0, line.orderedQty - line.receivedQty);
}

/** Display helper; backend remains source of truth. */
export function invoiceableQty(line: PurchaseOrderLine): number {
  return Math.max(0, line.receivedQty - normalizeInvoicedQty(line));
}

export function canEditPo(order: PurchaseOrder | null): boolean {
  if (!order) return false;
  return (
    order.status === "Open" ||
    order.status === "PartiallyReceived" ||
    order.status === "PartiallyInvoiced"
  );
}

export function canCancelPo(order: PurchaseOrder | null): boolean {
  if (!order) return false;
  if (order.status !== "Open") return false;
  return (order.lines ?? []).every((l) => l.receivedQty <= 0);
}

/** D-FE-GR-STATUS */
export function canReceivePo(order: PurchaseOrder | null): boolean {
  if (!order) return false;
  if (
    order.status !== "Open" &&
    order.status !== "PartiallyReceived" &&
    order.status !== "PartiallyInvoiced"
  ) {
    return false;
  }
  return (order.lines ?? []).some((l) => remainingQty(l) > 0);
}

export function canInvoicePo(order: PurchaseOrder | null): boolean {
  if (!order) return false;
  if (order.status === "Cancelled" || order.status === "Invoiced") return false;
  return (order.lines ?? []).some((l) => invoiceableQty(l) > 0);
}

export function mapProcurementFlowHref(
  type: ProcurementDocumentFlowNodeType,
  id: string,
): string {
  switch (type) {
    case "PurchaseOrder":
      return `${PURCHASE_ORDERS_ROUTE}/${id}`;
    case "GoodsReceipt":
      return `${GOODS_RECEIPTS_ROUTE}/${id}`;
    case "InvoiceReceipt":
      return `${INVOICE_RECEIPTS_ROUTE}/${id}`;
    default:
      return PURCHASE_ORDERS_ROUTE;
  }
}

export function procurementFlowNodeHref(
  node: ProcurementDocumentFlowNode,
): string {
  return mapProcurementFlowHref(node.type, node.id);
}

export function purchaseOrderStatusBadgeVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Open":
      return "default";
    case "PartiallyReceived":
    case "PartiallyInvoiced":
      return "secondary";
    case "Received":
    case "Invoiced":
      return "outline";
    case "Cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

export function goodsReceiptStatusBadgeVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Posted":
      return "secondary";
    default:
      return "outline";
  }
}

export function invoiceReceiptStatusBadgeVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  return goodsReceiptStatusBadgeVariant(status);
}
