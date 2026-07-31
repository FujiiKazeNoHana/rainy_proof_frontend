import { apiFetch } from "@/shared/lib/api-client";
import type { ApiError } from "@/shared/lib/api-client";
import { SALES_ORDERS_API } from "../constants";
import type {
  CreateSalesOrderInput,
  SalesOrder,
  SalesOrderListItem,
  SalesOrderListQuery,
  UpdateSalesOrderInput,
} from "../lib/types";

function toQuery(params: SalesOrderListQuery): string {
  const q = new URLSearchParams();
  if (params.number?.trim()) q.set("number", params.number.trim());
  if (params.customerCode?.trim()) q.set("customerCode", params.customerCode.trim());
  if (params.status?.trim()) q.set("status", params.status.trim());
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function listSalesOrders(
  query: SalesOrderListQuery = {},
): Promise<SalesOrderListItem[]> {
  return apiFetch<SalesOrderListItem[]>(`${SALES_ORDERS_API}${toQuery(query)}`);
}

export async function getSalesOrder(id: string): Promise<SalesOrder> {
  return apiFetch<SalesOrder>(`${SALES_ORDERS_API}/${id}`);
}

export async function createSalesOrder(
  input: CreateSalesOrderInput,
  idempotencyKey?: string,
): Promise<SalesOrder> {
  return apiFetch<SalesOrder>(SALES_ORDERS_API, {
    method: "POST",
    body: input,
    headers: idempotencyKey
      ? { "Idempotency-Key": idempotencyKey }
      : undefined,
  });
}

export async function updateSalesOrder(
  id: string,
  input: UpdateSalesOrderInput,
): Promise<SalesOrder> {
  return apiFetch<SalesOrder>(`${SALES_ORDERS_API}/${id}`, {
    method: "PUT",
    body: input,
  });
}

export async function cancelSalesOrder(id: string): Promise<SalesOrder> {
  return apiFetch<SalesOrder>(`${SALES_ORDERS_API}/${id}/cancel`, {
    method: "POST",
    body: {},
  });
}

export function formatApiError(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const apiErr = err as ApiError;
    if (apiErr.errors?.length) {
      const lines = apiErr.errors
        .map((e) => {
          const loc = e.lineNo != null ? `行${e.lineNo}` : e.field || "";
          return `${loc ? `${loc}: ` : ""}${e.message || e.code || ""}`;
        })
        .filter(Boolean);
      if (lines.length) {
        return `${apiErr.message}\n${lines.join("\n")}`;
      }
    }
    return apiErr.message || "请求失败";
  }
  if (err instanceof Error) return err.message;
  return "请求失败";
}
