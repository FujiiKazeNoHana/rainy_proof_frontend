"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { listPurchaseOrders } from "@/features/ergo/sap_sandbox/api/purchaseOrders";
import { ApiErrorBanner } from "@/features/ergo/sap_sandbox/components/ApiErrorBanner";
import { PurchaseOrderStatusBadge } from "@/features/ergo/sap_sandbox/components/PurchaseOrderStatusBadge";
import { RequireAuth } from "@/features/ergo/sap_sandbox/components/RequireAuth";
import { PURCHASE_ORDERS_ROUTE } from "@/features/ergo/sap_sandbox/constants";
import { useSapI18n } from "@/features/ergo/sap_sandbox/i18n";
import {
  PO_STATUS_CODES,
  type PurchaseOrderListItem,
} from "@/features/ergo/sap_sandbox/lib/procurementTypes";

function PurchaseOrdersListInner() {
  const { t, purchaseOrderStatus } = useSapI18n();
  const { canWritePurchaseOrder } = useAuth();
  const [number, setNumber] = useState("");
  const [status, setStatus] = useState("");
  const [items, setItems] = useState<PurchaseOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listPurchaseOrders();
      setItems(data ?? []);
    } catch (err) {
      setError(err);
      setItems([]);
      if (err instanceof ApiError && err.status === 403) {
        toast.error(t("errors.http.forbiddenProcurementView"));
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const n = number.trim().toLowerCase();
    return items.filter((row) => {
      if (status && row.status !== status) return false;
      if (n && !row.number.toLowerCase().includes(n)) return false;
      return true;
    });
  }, [items, number, status]);

  const emDash = t("common.emDash");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("purchaseOrders.list.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("purchaseOrders.list.hint")}
          </p>
        </div>
        {canWritePurchaseOrder ? (
          <Link
            href={`${PURCHASE_ORDERS_ROUTE}/new`}
            className={cn(buttonVariants())}
          >
            {t("purchaseOrders.list.new")}
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
          <Label htmlFor="po-number">
            {t("purchaseOrders.list.filter.number")}
          </Label>
          <Input
            id="po-number"
            className="w-40"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="po-status">
            {t("purchaseOrders.list.filter.status")}
          </Label>
          <select
            id="po-status"
            className="h-8 min-w-36 rounded-lg border border-input bg-transparent px-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">{t("common.all")}</option>
            {PO_STATUS_CODES.map((code) => (
              <option key={code} value={code}>
                {purchaseOrderStatus(code)}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="outline" disabled={loading}>
          {t("common.search")}
        </Button>
      </form>

      <ApiErrorBanner error={error} />

      {loading ? (
        <p className="text-sm text-muted-foreground">
          {t("purchaseOrders.list.loading")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("purchaseOrders.list.table.number")}</TableHead>
                <TableHead>{t("purchaseOrders.list.table.vendor")}</TableHead>
                <TableHead>
                  {t("purchaseOrders.list.table.purchasingOrg")}
                </TableHead>
                <TableHead>{t("purchaseOrders.list.table.plant")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>{t("common.createdAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    {t("purchaseOrders.list.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link
                        href={`${PURCHASE_ORDERS_ROUTE}/${row.id}`}
                        className="font-mono font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {row.number}
                      </Link>
                    </TableCell>
                    <TableCell>{row.vendorCode}</TableCell>
                    <TableCell>{row.purchasingOrgCode}</TableCell>
                    <TableCell>{row.plantCode}</TableCell>
                    <TableCell>
                      <PurchaseOrderStatusBadge
                        status={row.status}
                        label={purchaseOrderStatus(
                          row.status,
                          row.statusLabel,
                        )}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleString()
                        : emDash}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default function PurchaseOrdersPage() {
  return (
    <RequireAuth>
      <PurchaseOrdersListInner />
    </RequireAuth>
  );
}
