"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ApiError } from "@/shared/lib/api-client";
import { buttonVariants } from "@/shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/utils";
import { listInvoiceReceipts } from "@/features/ergo/sap_sandbox/api/invoiceReceipts";
import { ApiErrorBanner } from "@/features/ergo/sap_sandbox/components/ApiErrorBanner";
import { InvoiceReceiptStatusBadge } from "@/features/ergo/sap_sandbox/components/PurchaseOrderStatusBadge";
import { RequireAuth } from "@/features/ergo/sap_sandbox/components/RequireAuth";
import {
  INVOICE_RECEIPTS_ROUTE,
  INVOICE_RECEIPTS_UI_ENABLED,
  PURCHASE_ORDERS_ROUTE,
} from "@/features/ergo/sap_sandbox/constants";
import { useSapI18n } from "@/features/ergo/sap_sandbox/i18n";
import type { InvoiceReceiptListItem } from "@/features/ergo/sap_sandbox/lib/procurementTypes";

function InvoiceReceiptsListInner() {
  const { t, invoiceReceiptStatus } = useSapI18n();
  const [items, setItems] = useState<InvoiceReceiptListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    if (!INVOICE_RECEIPTS_UI_ENABLED) {
      setLoading(false);
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await listInvoiceReceipts();
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

  const emDash = t("common.emDash");

  if (!INVOICE_RECEIPTS_UI_ENABLED) {
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">
          {t("invoiceReceipts.list.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("invoiceReceipts.new.uiDisabled")}
        </p>
        <Link
          href={PURCHASE_ORDERS_ROUTE}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {t("common.back")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">
          {t("invoiceReceipts.list.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("invoiceReceipts.list.hint")}
        </p>
      </div>

      <ApiErrorBanner error={error} />

      {loading ? (
        <p className="text-sm text-muted-foreground">
          {t("invoiceReceipts.list.loading")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("invoiceReceipts.list.table.number")}</TableHead>
                <TableHead>{t("invoiceReceipts.list.table.po")}</TableHead>
                <TableHead className="text-right">
                  {t("invoiceReceipts.list.table.netAmount")}
                </TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>
                  {t("invoiceReceipts.list.table.postedAt")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    {t("invoiceReceipts.list.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link
                        href={`${INVOICE_RECEIPTS_ROUTE}/${row.id}`}
                        className="font-mono font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {row.number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {row.purchaseOrderId ? (
                        <Link
                          href={`${PURCHASE_ORDERS_ROUTE}/${row.purchaseOrderId}`}
                          className="font-mono text-primary underline-offset-4 hover:underline"
                        >
                          {row.purchaseOrderNumber ?? row.purchaseOrderId}
                        </Link>
                      ) : (
                        emDash
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {row.netAmount} {row.currency}
                    </TableCell>
                    <TableCell>
                      <InvoiceReceiptStatusBadge
                        status={row.status}
                        label={invoiceReceiptStatus(
                          row.status,
                          row.statusLabel,
                        )}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.postedAt
                        ? new Date(row.postedAt).toLocaleString()
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

export default function InvoiceReceiptsPage() {
  return (
    <RequireAuth>
      <InvoiceReceiptsListInner />
    </RequireAuth>
  );
}
