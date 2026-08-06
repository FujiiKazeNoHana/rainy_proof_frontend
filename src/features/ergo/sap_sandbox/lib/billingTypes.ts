export type BillingStatus = "Posted";

export type BillingDocumentListItem = {
  id: string;
  number: string;
  salesOrderId: string;
  salesOrderNumber: string;
  status: BillingStatus | string;
  statusLabel: string;
  headerAmount: number;
  currency: string;
  postedAt: string;
  lineCount: number;
};

export type BillingDocumentLine = {
  id: string;
  lineNo: number;
  salesOrderLineId: string;
  deliveryId: string | null;
  deliveryLineId: string | null;
  materialCode: string;
  materialName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  remark: string | null;
};

export type BillingDocument = {
  id: string;
  number: string;
  salesOrderId: string;
  salesOrderNumber: string;
  customerCode: string;
  customerName: string;
  status: BillingStatus | string;
  statusLabel: string;
  currency: string;
  headerAmount: number;
  postedAt: string;
  remark: string | null;
  idempotentReplayed?: boolean | null;
  lines: BillingDocumentLine[] | null;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string | null;
};

export type CreateBillingLineInput = {
  salesOrderLineId: string;
  quantity: number;
  unitPrice?: number | null;
  deliveryId?: string | null;
  deliveryLineId?: string | null;
  remark?: string | null;
};

export type CreateBillingDocumentInput = {
  salesOrderId: string;
  currency?: string | null;
  remark?: string | null;
  lines: CreateBillingLineInput[];
};

export type BillingListQuery = {
  number?: string;
  salesOrderId?: string;
  salesOrderNumber?: string;
  postedFrom?: string;
  postedTo?: string;
};

export type DocumentFlowNodeType =
  | "SalesOrder"
  | "OutboundDelivery"
  | "BillingDocument";

export type DocumentFlowNode = {
  type: DocumentFlowNodeType;
  id: string;
  number: string;
  status: string;
  statusLabel: string;
  occurredAt: string;
  amount: number | null;
  href: string;
};

export type DocumentFlow = {
  salesOrderId: string;
  nodes: DocumentFlowNode[] | null;
};

export const BILLING_STATUS_CODES: BillingStatus[] = ["Posted"];
