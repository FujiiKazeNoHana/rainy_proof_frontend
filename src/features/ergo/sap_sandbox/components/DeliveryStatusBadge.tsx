"use client";

import { Badge } from "@/shared/components/ui/badge";
import { deliveryStatusBadgeVariant } from "../lib/deliveryRules";

export function DeliveryStatusBadge({
  status,
  label,
}: {
  status: string;
  label?: string;
}) {
  return (
    <Badge variant={deliveryStatusBadgeVariant(status)}>
      {label || status}
    </Badge>
  );
}
