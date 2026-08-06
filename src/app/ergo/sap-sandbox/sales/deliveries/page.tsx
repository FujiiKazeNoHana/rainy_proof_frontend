"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/shared/auth";
import { ApiError } from "@/shared/lib/api-client";
import { Button, buttonVariants } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/utils";
import { listDeliveries } from "@/features/ergo/sap_sandbox/api/deliveries";
import { ApiErrorBanner } from "@/features/ergo/sap_sandbox/components/ApiErrorBanner";
import { DeliveryStatusBadge } from "@/features/ergo/sap_sandbox/components/DeliveryStatusBadge";
import { RequireAuth } from "@/features/ergo/sap_sandbox/components/RequireAuth";
import {
  SALES_DELIVERIES_ROUTE,
  SALES_ORDERS_ROUTE,
} from "@/features/ergo/sap_sandbox/constants";
import { useSapI18n } from "@/features/ergo/sap_sandbox/i18n";
import {
  DELIVERY_STATUS_CODES,
  type DeliveryListItem,
} from "@/features/ergo/sap_sandbox/lib/deliveryTypes";

function DeliveriesListInner() {
  const { t, deliveryStatus } = useSapI18n();
  const { canWriteDelivery } = useAuth();
  const [number, setNumber] = useState("");
  const [salesOrderId, setSalesOrderId] = useState("");
  const [status, setStatus] = useState("");
  const [items, setItems] = useState<DeliveryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listDeliveries({
        number: number.trim() || undefined,
        salesOrderId: salesOrderId.trim() || undefined,
        status: status || undefined,
      });
      setItems(data ?? []);
    } catch (err) {
      setError(err);
      setItems([]);
      if (err instanceof ApiError && err.status === 403) {
        toast.error(t("errors.http.forbiddenDeliveriesView"));
      }
    } finally {
      setLoading(false);
    }
  }, [number, salesOrderId, status, t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("deliveries.list.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("deliveries.list.hint")}
          </p>
        </div>
        {canWriteDelivery ? (
          <Link
            href={SALES_ORDERS_ROUTE}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            {t("deliveries.list.createFromOrder")}
          </Link>
        ) : null}
      </div>

      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <div className="grid gap-1.5">
          <Label htmlFor="dn-number">{t("deliveries.list.filter.number")}</Label>
          <Input
            id="dn-number"
            className="w-44"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder={t("deliveries.list.filter.numberPlaceholder")}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="dn-so">{t("deliveries.list.filter.salesOrderId")}</Label>
          <Input
            id="dn-so"
            className="w-64 font-mono text-xs"
            value={salesOrderId}
            onChange={(e) => setSalesOrderId(e.target.value)}
            placeholder="Guid"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="dn-status">{t("common.status")}</Label>
          <select
            id="dn-status"
            className="h-8 min-w-36 rounded-lg border border-input bg-transparent px-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">{t("common.all")}</option>
            {DELIVERY_STATUS_CODES.map((code) => (
              <option key={code} value={code}>
                {deliveryStatus(code)}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="outline" disabled={loading}>
          {t("common.search")}
        </Button>
      </form>

      <ApiErrorBanner error={error} />

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("deliveries.list.table.number")}</TableHead>
              <TableHead>{t("deliveries.list.table.salesOrder")}</TableHead>
              <TableHead>{t("common.plant")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead className="text-right">{t("common.lineCount")}</TableHead>
              <TableHead>{t("deliveries.list.table.postedAt")}</TableHead>
              <TableHead>{t("common.createdAt")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  {t("common.loading")}
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  {t("deliveries.list.empty")}
                </TableCell>
              </TableRow>
            ) : (
              items.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/40">
                  <TableCell>
                    <Link
                      href={`${SALES_DELIVERIES_ROUTE}/${row.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {row.number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`${SALES_ORDERS_ROUTE}/${row.salesOrderId}`}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {row.salesOrderNumber || row.salesOrderId}
                    </Link>
                  </TableCell>
                  <TableCell>{row.plantCode}</TableCell>
                  <TableCell>
                    <DeliveryStatusBadge
                      status={row.status}
                      label={deliveryStatus(row.status, row.statusLabel)}
                    />
                  </TableCell>
                  <TableCell className="text-right">{row.lineCount}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.postedAt
                      ? new Date(row.postedAt).toLocaleString()
                      : t("common.emDash")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.createdAt
                      ? new Date(row.createdAt).toLocaleString()
                      : t("common.emDash")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function DeliveriesListPage() {
  return (
    <RequireAuth>
      <DeliveriesListInner />
    </RequireAuth>
  );
}
