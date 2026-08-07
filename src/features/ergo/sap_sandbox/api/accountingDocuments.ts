import { apiFetch } from "@/shared/lib/api-client";
import { ACCOUNTING_DOCUMENTS_API } from "../constants";
import type {
  AccountingDocument,
  AccountingDocumentListItem,
  AccountingDocumentListQuery,
} from "../lib/financeTypes";

function toQuery(params: AccountingDocumentListQuery): string {
  const q = new URLSearchParams();
  q.set("side", params.side);
  if (params.sourceId?.trim()) {
    q.set("sourceId", params.sourceId.trim());
  }
  return `?${q.toString()}`;
}

export async function listAccountingDocuments(
  query: AccountingDocumentListQuery,
): Promise<AccountingDocumentListItem[]> {
  return apiFetch<AccountingDocumentListItem[]>(
    `${ACCOUNTING_DOCUMENTS_API}${toQuery(query)}`,
  );
}

export async function getAccountingDocument(
  id: string,
): Promise<AccountingDocument> {
  return apiFetch<AccountingDocument>(`${ACCOUNTING_DOCUMENTS_API}/${id}`);
}
