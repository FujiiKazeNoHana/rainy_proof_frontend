"use client";

import { Badge } from "@/shared/components/ui/badge";
import { billingStatusBadgeVariant } from "../lib/billingRules";

export function BillingStatusBadge({
  status,
  label,
}: {
  status: string;
  label?: string;
}) {
  return (
    <Badge variant={billingStatusBadgeVariant(status)}>
      {label || status}
    </Badge>
  );
}
