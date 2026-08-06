import { apiFetch } from "@/shared/lib/api-client";
import { GOODS_RECEIPTS_API } from "../constants";
import type {
  CreateGoodsReceiptInput,
  GoodsReceipt,
  GoodsReceiptListItem,
} from "../lib/procurementTypes";

export async function listGoodsReceipts(): Promise<GoodsReceiptListItem[]> {
  return apiFetch<GoodsReceiptListItem[]>(GOODS_RECEIPTS_API);
}

export async function getGoodsReceipt(id: string): Promise<GoodsReceipt> {
  return apiFetch<GoodsReceipt>(`${GOODS_RECEIPTS_API}/${id}`);
}

/** Idempotency-Key required (trim length ≥ 16). Reuse same key on retries. */
export async function createGoodsReceipt(
  input: CreateGoodsReceiptInput,
  idempotencyKey: string,
): Promise<GoodsReceipt> {
  const key = idempotencyKey.trim();
  return apiFetch<GoodsReceipt>(GOODS_RECEIPTS_API, {
    method: "POST",
    body: input,
    headers: {
      "Idempotency-Key": key,
    },
  });
}
