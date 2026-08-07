"use client";

import { Badge } from "@/shared/components/ui/badge";
import { accountingDocumentStatusBadgeVariant } from "../lib/financeRules";

export function AccountingDocumentStatusBadge({
  status,
  label,
}: {
  status: string;
  label?: string;
}) {
  return (
    <Badge variant={accountingDocumentStatusBadgeVariant(status)}>
      {label || status}
    </Badge>
  );
}
