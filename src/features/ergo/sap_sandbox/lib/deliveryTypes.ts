export type DeliveryStatus = "Open" | "GoodsIssued" | "Cancelled";

export type DeliveryListItem = {
  id: string;
  number: string;
  salesOrderId: string;
  salesOrderNumber: string;
  plantCode: string;
  status: DeliveryStatus | string;
  statusLabel: string;
  postedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  lineCount: number;
  version: number;
};

export type DeliveryLine = {
  id: string;
  lineNo: number;
  salesOrderLineId: string;
  salesOrderLineNo: number;
  materialCode: string;
  materialDesc: string;
  quantity: number;
  unit: string;
  plantCode: string;
};

export type Delivery = {
  id: string;
  number: string;
  salesOrderId: string;
  salesOrderNumber: string;
  plantCode: string;
  storageLocationCode: string;
  status: DeliveryStatus | string;
  statusLabel: string;
  remark: string | null;
  postedAt: string | null;
  cancelledAt: string | null;
  version: number;
  idempotentReplayed?: boolean | null;
  lines: DeliveryLine[] | null;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string | null;
};

export type CreateDeliveryLineInput = {
  salesOrderLineId: string;
  quantity: number;
  unit: string;
};

export type CreateDeliveryInput = {
  salesOrderId: string;
  plantCode: string;
  storageLocationCode: string;
  remark?: string | null;
  lines: CreateDeliveryLineInput[];
};

export type DeliveryListQuery = {
  number?: string;
  salesOrderId?: string;
  status?: string;
};

export type DeliveryVersionBody = {
  version?: number | null;
};

/** Status codes for filters; labels via i18n `status.delivery.*`. */
export const DELIVERY_STATUS_CODES: DeliveryStatus[] = [
  "Open",
  "GoodsIssued",
  "Cancelled",
];

/** @deprecated Prefer DELIVERY_STATUS_CODES + i18n labels */
export const DELIVERY_STATUSES: { code: DeliveryStatus; label: string }[] =
  DELIVERY_STATUS_CODES.map((code) => ({ code, label: code }));
