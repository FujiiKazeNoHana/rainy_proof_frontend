import { apiFetch } from "@/shared/lib/api-client";
import { INVOICE_RECEIPTS_API } from "../constants";
import type {
  CreateInvoiceReceiptInput,
  InvoiceReceipt,
  InvoiceReceiptListItem,
} from "../lib/procurementTypes";

export async function listInvoiceReceipts(): Promise<InvoiceReceiptListItem[]> {
  return apiFetch<InvoiceReceiptListItem[]>(INVOICE_RECEIPTS_API);
}

export async function getInvoiceReceipt(id: string): Promise<InvoiceReceipt> {
  return apiFetch<InvoiceReceipt>(`${INVOICE_RECEIPTS_API}/${id}`);
}

/** Idempotency-Key required. First create 201; same key+body replay 200. */
export async function createInvoiceReceipt(
  input: CreateInvoiceReceiptInput,
  idempotencyKey: string,
): Promise<InvoiceReceipt> {
  const key = idempotencyKey.trim();
  return apiFetch<InvoiceReceipt>(INVOICE_RECEIPTS_API, {
    method: "POST",
    body: input,
    headers: {
      "Idempotency-Key": key,
    },
  });
}
