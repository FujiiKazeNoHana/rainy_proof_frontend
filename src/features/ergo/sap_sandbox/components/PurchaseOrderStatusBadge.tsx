"use client";

import { Badge } from "@/shared/components/ui/badge";
import {
  goodsReceiptStatusBadgeVariant,
  invoiceReceiptStatusBadgeVariant,
  purchaseOrderStatusBadgeVariant,
} from "../lib/procurementRules";

export function PurchaseOrderStatusBadge({
  status,
  label,
}: {
  status: string;
  label?: string;
}) {
  return (
    <Badge variant={purchaseOrderStatusBadgeVariant(status)}>
      {label || status}
    </Badge>
  );
}

export function GoodsReceiptStatusBadge({
  status,
  label,
}: {
  status: string;
  label?: string;
}) {
  return (
    <Badge variant={goodsReceiptStatusBadgeVariant(status)}>
      {label || status}
    </Badge>
  );
}

export function InvoiceReceiptStatusBadge({
  status,
  label,
}: {
  status: string;
  label?: string;
}) {
  return (
    <Badge variant={invoiceReceiptStatusBadgeVariant(status)}>
      {label || status}
    </Badge>
  );
}
