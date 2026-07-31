"use client";

import { Badge } from "@/shared/components/ui/badge";
import { statusBadgeVariant } from "../lib/orderRules";

export function OrderStatusBadge({
  status,
  label,
}: {
  status: string;
  label?: string;
}) {
  return <Badge variant={statusBadgeVariant(status)}>{label || status}</Badge>;
}
