export type PoStatus =
  | "Open"
  | "PartiallyReceived"
  | "Received"
  | "PartiallyInvoiced"
  | "Invoiced"
  | "Cancelled";

export const PO_STATUS_CODES: PoStatus[] = [
  "Open",
  "PartiallyReceived",
  "Received",
  "PartiallyInvoiced",
  "Invoiced",
  "Cancelled",
];

export type PurchaseOrderLine = {
  id: string;
  lineNumber: number;
  materialCode: string;
  orderedQty: number;
  receivedQty: number;
  /** D-FE-INV-QTY: always present in contract; may be missing on old backends. */
  invoicedQty?: number;
  unit: string;
  unitPrice: number;
};

export type PurchaseOrder = {
  id: string;
  number: string;
  purchasingOrgCode: string;
  vendorCode: string;
  plantCode: string;
  currency: string;
  status: PoStatus | string;
  statusLabel?: string | null;
  remark?: string | null;
  createdAt?: string;
  updatedAt?: string;
  lines: PurchaseOrderLine[] | null;
};

export type PurchaseOrderListItem = {
  id: string;
  number: string;
  purchasingOrgCode: string;
  vendorCode: string;
  plantCode: string;
  status: PoStatus | string;
  statusLabel?: string | null;
  currency?: string;
  lineCount?: number;
  createdAt?: string;
};

export type CreatePurchaseOrderLineInput = {
  materialCode: string;
  orderedQty: number;
  unit: string;
  unitPrice: number;
};

export type CreatePurchaseOrderInput = {
  purchasingOrgCode: string;
  vendorCode: string;
  plantCode: string;
  remark?: string | null;
  lines: CreatePurchaseOrderLineInput[];
};

export type UpdatePurchaseOrderLineInput = {
  lineId?: string | null;
  materialCode: string;
  orderedQty: number;
  unit: string;
  unitPrice: number;
};

export type UpdatePurchaseOrderInput = {
  remark?: string | null;
  lines: UpdatePurchaseOrderLineInput[];
};

export type GrStatus = "Posted";
export type IrStatus = "Posted";

export type GoodsReceiptLine = {
  id?: string;
  purchaseOrderLineId?: string;
  lineNumber?: number;
  materialCode?: string;
  quantity: number;
  unit?: string;
};

export type GoodsReceipt = {
  id: string;
  number: string;
  purchaseOrderId: string;
  purchaseOrderNumber?: string | null;
  plantCode: string;
  storageLocationCode: string;
  status: GrStatus | string;
  statusLabel?: string | null;
  postedAt?: string | null;
  lines: GoodsReceiptLine[] | null;
};

export type GoodsReceiptListItem = {
  id: string;
  number: string;
  purchaseOrderId: string;
  purchaseOrderNumber?: string | null;
  plantCode?: string;
  storageLocationCode?: string;
  status: GrStatus | string;
  statusLabel?: string | null;
  postedAt?: string | null;
};

export type CreateGoodsReceiptLineInput = {
  purchaseOrderLineId: string;
  quantity: number;
};

export type CreateGoodsReceiptInput = {
  purchaseOrderId: string;
  storageLocationCode: string;
  /** Omit/null = receive all remaining. Never send []. */
  lines?: CreateGoodsReceiptLineInput[] | null;
};

export type InvoiceReceiptLine = {
  lineNumber: number;
  purchaseOrderLineId: string;
  materialCode: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

export type InvoiceReceiptListItem = {
  id: string;
  number: string;
  purchaseOrderId: string;
  purchaseOrderNumber?: string | null;
  status: IrStatus | string;
  statusLabel?: string | null;
  netAmount: number;
  currency: string;
  postedAt?: string | null;
  lineCount?: number;
};

export type InvoiceReceipt = InvoiceReceiptListItem & {
  vendorCode?: string;
  lines: InvoiceReceiptLine[] | null;
};

export type CreateInvoiceReceiptLineInput = {
  purchaseOrderLineId: string;
  quantity: number;
  unitPrice?: number;
};

export type CreateInvoiceReceiptInput = {
  purchaseOrderId: string;
  /** Omit/null = invoice all invoiceable lines. Never send []. */
  lines?: CreateInvoiceReceiptLineInput[] | null;
};

export type ProcurementDocumentFlowNodeType =
  | "PurchaseOrder"
  | "GoodsReceipt"
  | "InvoiceReceipt";

export type ProcurementDocumentFlowNode = {
  type: ProcurementDocumentFlowNodeType;
  id: string;
  number: string;
  status: string;
  statusLabel?: string | null;
  occurredAt: string;
  href: string;
};

export type ProcurementDocumentFlow = {
  purchaseOrderId: string;
  nodes: ProcurementDocumentFlowNode[];
};
