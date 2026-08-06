import { apiFetch } from "@/shared/lib/api-client";
import { SALES_BILLING_API, SALES_ORDERS_API } from "../constants";
import type {
  BillingDocument,
  BillingDocumentListItem,
  BillingListQuery,
  CreateBillingDocumentInput,
  DocumentFlow,
} from "../lib/billingTypes";

function toQuery(params: BillingListQuery): string {
  const q = new URLSearchParams();
  if (params.number?.trim()) q.set("number", params.number.trim());
  if (params.salesOrderId?.trim()) {
    q.set("salesOrderId", params.salesOrderId.trim());
  }
  if (params.salesOrderNumber?.trim()) {
    q.set("salesOrderNumber", params.salesOrderNumber.trim());
  }
  if (params.postedFrom?.trim()) q.set("postedFrom", params.postedFrom.trim());
  if (params.postedTo?.trim()) q.set("postedTo", params.postedTo.trim());
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function listBillingDocuments(
  query: BillingListQuery = {},
): Promise<BillingDocumentListItem[]> {
  return apiFetch<BillingDocumentListItem[]>(
    `${SALES_BILLING_API}${toQuery(query)}`,
  );
}

export async function getBillingDocument(id: string): Promise<BillingDocument> {
  return apiFetch<BillingDocument>(`${SALES_BILLING_API}/${id}`);
}

export async function createBillingDocument(
  input: CreateBillingDocumentInput,
  idempotencyKey?: string,
): Promise<BillingDocument> {
  const key = idempotencyKey?.trim() || crypto.randomUUID();
  return apiFetch<BillingDocument>(SALES_BILLING_API, {
    method: "POST",
    body: input,
    headers: {
      "Idempotency-Key": key,
    },
  });
}

export async function listOrderBillingDocuments(
  orderId: string,
): Promise<BillingDocumentListItem[]> {
  return apiFetch<BillingDocumentListItem[]>(
    `${SALES_ORDERS_API}/${orderId}/billing-documents`,
  );
}

export async function getDocumentFlow(orderId: string): Promise<DocumentFlow> {
  return apiFetch<DocumentFlow>(
    `${SALES_ORDERS_API}/${orderId}/document-flow`,
  );
}
