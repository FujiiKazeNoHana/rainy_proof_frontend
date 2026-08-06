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
import { listBillingDocuments } from "@/features/ergo/sap_sandbox/api/billing";
import { ApiErrorBanner } from "@/features/ergo/sap_sandbox/components/ApiErrorBanner";
import { BillingStatusBadge } from "@/features/ergo/sap_sandbox/components/BillingStatusBadge";
import { RequireAuth } from "@/features/ergo/sap_sandbox/components/RequireAuth";
import {
  SALES_BILLING_ROUTE,
  SALES_ORDERS_ROUTE,
} from "@/features/ergo/sap_sandbox/constants";
import { useSapI18n } from "@/features/ergo/sap_sandbox/i18n";
import type { BillingDocumentListItem } from "@/features/ergo/sap_sandbox/lib/billingTypes";

function BillingListInner() {
  const { t, billingStatus } = useSapI18n();
  const { canWriteBilling } = useAuth();
  const [number, setNumber] = useState("");
  const [salesOrderId, setSalesOrderId] = useState("");
  const [postedFrom, setPostedFrom] = useState("");
  const [postedTo, setPostedTo] = useState("");
  const [items, setItems] = useState<BillingDocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listBillingDocuments({
        number: number.trim() || undefined,
        salesOrderId: salesOrderId.trim() || undefined,
        postedFrom: postedFrom.trim() || undefined,
        postedTo: postedTo.trim() || undefined,
      });
      setItems(data ?? []);
    } catch (err) {
      setError(err);
      setItems([]);
      if (err instanceof ApiError && err.status === 403) {
        toast.error(t("errors.http.forbiddenBillingView"));
      }
    } finally {
      setLoading(false);
    }
  }, [number, salesOrderId, postedFrom, postedTo, t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("billing.list.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("billing.list.hint")}
          </p>
        </div>
        {canWriteBilling ? (
          <Link
            href={SALES_ORDERS_ROUTE}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            {t("billing.list.createFromOrder")}
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
          <Label htmlFor="bill-number">{t("billing.list.filter.number")}</Label>
          <Input
            id="bill-number"
            className="w-44"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder={t("billing.list.filter.numberPlaceholder")}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="bill-so">{t("billing.list.filter.salesOrderId")}</Label>
          <Input
            id="bill-so"
            className="w-64 font-mono text-xs"
            value={salesOrderId}
            onChange={(e) => setSalesOrderId(e.target.value)}
            placeholder="Guid"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="bill-from">{t("billing.list.filter.postedFrom")}</Label>
          <Input
            id="bill-from"
            type="datetime-local"
            className="w-48"
            value={postedFrom}
            onChange={(e) => setPostedFrom(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="bill-to">{t("billing.list.filter.postedTo")}</Label>
          <Input
            id="bill-to"
            type="datetime-local"
            className="w-48"
            value={postedTo}
            onChange={(e) => setPostedTo(e.target.value)}
          />
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
              <TableHead>{t("billing.list.table.number")}</TableHead>
              <TableHead>{t("billing.list.table.salesOrder")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead className="text-right">
                {t("billing.list.table.amount")}
              </TableHead>
              <TableHead className="text-right">{t("common.lineCount")}</TableHead>
              <TableHead>{t("billing.list.table.postedAt")}</TableHead>
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
                  {t("billing.list.empty")}
                </TableCell>
              </TableRow>
            ) : (
              items.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/40">
                  <TableCell>
                    <Link
                      href={`${SALES_BILLING_ROUTE}/${row.id}`}
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
                  <TableCell>
                    <BillingStatusBadge
                      status={row.status}
                      label={billingStatus(row.status, row.statusLabel)}
                    />
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {row.headerAmount} {row.currency}
                  </TableCell>
                  <TableCell className="text-right">{row.lineCount}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.postedAt
                      ? new Date(row.postedAt).toLocaleString()
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

export default function BillingListPage() {
  return (
    <RequireAuth>
      <BillingListInner />
    </RequireAuth>
  );
}
