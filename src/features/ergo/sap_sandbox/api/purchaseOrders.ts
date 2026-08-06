import { apiFetch } from "@/shared/lib/api-client";
import { PURCHASE_ORDERS_API } from "../constants";
import type {
  CreatePurchaseOrderInput,
  ProcurementDocumentFlow,
  PurchaseOrder,
  PurchaseOrderListItem,
  UpdatePurchaseOrderInput,
} from "../lib/procurementTypes";

export async function listPurchaseOrders(): Promise<PurchaseOrderListItem[]> {
  return apiFetch<PurchaseOrderListItem[]>(PURCHASE_ORDERS_API);
}

export async function getPurchaseOrder(id: string): Promise<PurchaseOrder> {
  return apiFetch<PurchaseOrder>(`${PURCHASE_ORDERS_API}/${id}`);
}

/** No Idempotency-Key — disable submit while posting (D-FE-CREATE-DEBOUNCE). */
export async function createPurchaseOrder(
  input: CreatePurchaseOrderInput,
): Promise<PurchaseOrder> {
  return apiFetch<PurchaseOrder>(PURCHASE_ORDERS_API, {
    method: "POST",
    body: input,
  });
}

export async function updatePurchaseOrder(
  id: string,
  input: UpdatePurchaseOrderInput,
): Promise<PurchaseOrder> {
  return apiFetch<PurchaseOrder>(`${PURCHASE_ORDERS_API}/${id}`, {
    method: "PUT",
    body: input,
  });
}

export async function cancelPurchaseOrder(id: string): Promise<PurchaseOrder> {
  return apiFetch<PurchaseOrder>(`${PURCHASE_ORDERS_API}/${id}/cancel`, {
    method: "POST",
    body: {},
  });
}

export async function getPurchaseOrderDocumentFlow(
  id: string,
): Promise<ProcurementDocumentFlow> {
  return apiFetch<ProcurementDocumentFlow>(
    `${PURCHASE_ORDERS_API}/${id}/document-flow`,
  );
}
