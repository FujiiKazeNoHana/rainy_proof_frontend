import { apiFetch } from "@/shared/lib/api-client";
import { SALES_DELIVERIES_API, SALES_ORDERS_API } from "../constants";
import type {
  CreateDeliveryInput,
  Delivery,
  DeliveryListItem,
  DeliveryListQuery,
  DeliveryVersionBody,
} from "../lib/deliveryTypes";

function toQuery(params: DeliveryListQuery): string {
  const q = new URLSearchParams();
  if (params.number?.trim()) q.set("number", params.number.trim());
  if (params.salesOrderId?.trim()) q.set("salesOrderId", params.salesOrderId.trim());
  if (params.status?.trim()) q.set("status", params.status.trim());
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function listDeliveries(
  query: DeliveryListQuery = {},
): Promise<DeliveryListItem[]> {
  return apiFetch<DeliveryListItem[]>(
    `${SALES_DELIVERIES_API}${toQuery(query)}`,
  );
}

export async function getDelivery(id: string): Promise<Delivery> {
  return apiFetch<Delivery>(`${SALES_DELIVERIES_API}/${id}`);
}

export async function createDelivery(
  input: CreateDeliveryInput,
): Promise<Delivery> {
  return apiFetch<Delivery>(SALES_DELIVERIES_API, {
    method: "POST",
    body: input,
  });
}

export async function cancelDelivery(
  id: string,
  body: DeliveryVersionBody = {},
): Promise<Delivery> {
  return apiFetch<Delivery>(`${SALES_DELIVERIES_API}/${id}/cancel`, {
    method: "POST",
    body,
  });
}

export async function postGoodsIssue(
  id: string,
  body: DeliveryVersionBody = {},
): Promise<Delivery> {
  return apiFetch<Delivery>(`${SALES_DELIVERIES_API}/${id}/pgi`, {
    method: "POST",
    body,
  });
}

export async function listOrderDeliveries(
  orderId: string,
): Promise<DeliveryListItem[]> {
  return apiFetch<DeliveryListItem[]>(
    `${SALES_ORDERS_API}/${orderId}/deliveries`,
  );
}
