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
import { listSalesOrders } from "@/features/ergo/sap_sandbox/api/salesOrders";
import { ApiErrorBanner } from "@/features/ergo/sap_sandbox/components/ApiErrorBanner";
import { OrderStatusBadge } from "@/features/ergo/sap_sandbox/components/OrderStatusBadge";
import { RequireAuth } from "@/features/ergo/sap_sandbox/components/RequireAuth";
import { SALES_ORDERS_ROUTE } from "@/features/ergo/sap_sandbox/constants";
import { useSapI18n } from "@/features/ergo/sap_sandbox/i18n";
import { ORDER_STATUS_CODES } from "@/features/ergo/sap_sandbox/lib/masterDataStub";
import type { SalesOrderListItem } from "@/features/ergo/sap_sandbox/lib/types";

function OrdersListInner() {
  const { t, orderStatus } = useSapI18n();
  const { canWriteSales } = useAuth();
  const [number, setNumber] = useState("");
  const [customerCode, setCustomerCode] = useState("");
  const [status, setStatus] = useState("");
  const [items, setItems] = useState<SalesOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listSalesOrders({
        number: number.trim() || undefined,
        customerCode: customerCode.trim() || undefined,
        status: status || undefined,
      });
      setItems(data ?? []);
    } catch (err) {
      setError(err);
      setItems([]);
      if (err instanceof ApiError && err.status === 403) {
        toast.error(t("errors.http.forbiddenOrdersView"));
      }
    } finally {
      setLoading(false);
    }
  }, [number, customerCode, status, t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("orders.list.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("orders.list.hint")}
          </p>
        </div>
        {canWriteSales ? (
          <Link
            href={`${SALES_ORDERS_ROUTE}/new`}
            className={cn(buttonVariants())}
          >
            {t("orders.list.newOrder")}
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
          <Label htmlFor="number">{t("orders.list.filter.number")}</Label>
          <Input
            id="number"
            className="w-40"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder={t("orders.list.filter.numberPlaceholder")}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="customerCode">
            {t("orders.list.filter.customerCode")}
          </Label>
          <Input
            id="customerCode"
            className="w-40"
            value={customerCode}
            onChange={(e) => setCustomerCode(e.target.value)}
            placeholder={t("orders.list.filter.customerCodePlaceholder")}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="status">{t("common.status")}</Label>
          <select
            id="status"
            className="h-8 min-w-36 rounded-lg border border-input bg-transparent px-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">{t("common.all")}</option>
            {ORDER_STATUS_CODES.map((code) => (
              <option key={code} value={code}>
                {orderStatus(code)}
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
              <TableHead>{t("orders.list.table.number")}</TableHead>
              <TableHead>{t("orders.list.table.customer")}</TableHead>
              <TableHead>{t("orders.list.table.salesOrg")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead className="text-right">{t("common.lineCount")}</TableHead>
              <TableHead>{t("common.createdAt")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  {t("common.loading")}
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  {t("orders.list.empty")}
                </TableCell>
              </TableRow>
            ) : (
              items.map((row) => (
                <TableRow key={row.id} className="cursor-pointer hover:bg-muted/40">
                  <TableCell>
                    <Link
                      href={`${SALES_ORDERS_ROUTE}/${row.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {row.number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-xs">{row.customerCode}</div>
                    <div className="text-muted-foreground">{row.customerName}</div>
                  </TableCell>
                  <TableCell>{row.salesOrgCode}</TableCell>
                  <TableCell>
                    <OrderStatusBadge
                      status={row.status}
                      label={orderStatus(row.status, row.statusLabel)}
                    />
                  </TableCell>
                  <TableCell className="text-right">{row.lineCount}</TableCell>
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

export default function SalesOrdersListPage() {
  return (
    <RequireAuth>
      <OrdersListInner />
    </RequireAuth>
  );
}
