export type FiSide = "AR" | "AP";
export type FiSourceType = "Billing" | "InvoiceReceipt";
export type FiStatus = "Open";

export type AccountingDocumentListItem = {
  id: string;
  number: string;
  side: FiSide;
  sourceType: FiSourceType;
  sourceId: string;
  sourceNumber: string;
  businessDocId: string;
  businessDocNumber: string;
  partnerCode: string;
  amount: number;
  currency: string;
  status: FiStatus | string;
  occurredAt: string;
};

export type AccountingDocumentLine = {
  lineNumber: number;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  text: string;
};

export type AccountingDocument = AccountingDocumentListItem & {
  partnerName?: string | null;
  lines: AccountingDocumentLine[] | null;
};

export type AccountingDocumentListQuery = {
  side: FiSide;
  sourceId?: string;
};
