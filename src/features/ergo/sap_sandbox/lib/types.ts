export type SalesOrderStatus =
  | "Open"
  | "PartiallyDelivered"
  | "Delivered"
  | "PartiallyBilled"
  | "Billed"
  | "Cancelled";

export type SalesOrderListItem = {
  id: string;
  number: string;
  salesOrgCode: string;
  customerCode: string;
  customerName: string;
  status: SalesOrderStatus | string;
  statusLabel: string;
  lineCount: number;
  createdAt: string;
  version: number;
};

export type SalesOrderLine = {
  id: string;
  lineNo: number;
  materialCode: string;
  materialDesc: string;
  orderedQty: number;
  unit: string;
  plantCode: string;
  unitPrice: number | null;
  amount: number;
  deliveredQty: number;
  billedQty: number;
  remark: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type SalesOrder = {
  id: string;
  number: string;
  salesOrgCode: string;
  salesOrgName: string;
  customerCode: string;
  customerName: string;
  requestedDeliveryDate: string | null;
  status: SalesOrderStatus | string;
  statusLabel: string;
  currency: string;
  remark: string | null;
  quotationNumber: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedBy: string | null;
  updatedAt: string;
  version: number;
  lineCount: number;
  lines: SalesOrderLine[] | null;
};

export type CreateSalesOrderLineInput = {
  materialCode: string;
  orderedQty: number;
  unit?: string | null;
  plantCode: string;
  unitPrice?: number | null;
  remark?: string | null;
};

export type CreateSalesOrderInput = {
  salesOrgCode: string;
  customerCode: string;
  requestedDeliveryDate?: string | null;
  remark?: string | null;
  currency?: string | null;
  lines: CreateSalesOrderLineInput[];
};

export type UpdateSalesOrderLineInput = {
  id?: string | null;
  materialCode: string;
  orderedQty: number;
  unit?: string | null;
  plantCode: string;
  unitPrice?: number | null;
  remark?: string | null;
};

export type UpdateSalesOrderInput = {
  version: number;
  requestedDeliveryDate?: string | null;
  remark?: string | null;
  lines: UpdateSalesOrderLineInput[];
};

export type SalesOrderListQuery = {
  number?: string;
  customerCode?: string;
  status?: string;
};
