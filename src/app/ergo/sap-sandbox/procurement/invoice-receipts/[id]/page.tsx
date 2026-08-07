"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/shared/auth";
import { ApiError } from "@/shared/lib/api-client";
import { Button, buttonVariants } from "@/shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/utils";
import { listAccountingDocuments } from "@/features/ergo/sap_sandbox/api/accountingDocuments";
import { getInvoiceReceipt } from "@/features/ergo/sap_sandbox/api/invoiceReceipts";
import { ApiErrorBanner } from "@/features/ergo/sap_sandbox/components/ApiErrorBanner";
import { InvoiceReceiptStatusBadge } from "@/features/ergo/sap_sandbox/components/PurchaseOrderStatusBadge";
import { RequireAuth } from "@/features/ergo/sap_sandbox/components/RequireAuth";
import {
  FINANCE_AP_ROUTE,
  INVOICE_RECEIPTS_ROUTE,
  PURCHASE_ORDERS_ROUTE,
} from "@/features/ergo/sap_sandbox/constants";
import { useSapI18n } from "@/features/ergo/sap_sandbox/i18n";
import {
  FI_POLL,
  isFinanceAccountingUiEnabled,
} from "@/features/ergo/sap_sandbox/lib/financeRules";
import type { InvoiceReceipt } from "@/features/ergo/sap_sandbox/lib/procurementTypes";

function InvoiceReceiptDetailInner() {
  const { t, invoiceReceiptStatus, errorMessage } = useSapI18n();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { canReadAp } = useAuth();

  const [ir, setIr] = useState<InvoiceReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [apId, setApId] = useState<string | null>(null);
  const [apNumber, setApNumber] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  /** Invalidate in-flight polls on unmount / restart (avoid stuck「加载中」). */
  const pollGenRef = useRef(0);

  const applyEmbed = useCallback((doc: InvoiceReceipt) => {
    if (doc.accountingDocumentId) {
      setApId(doc.accountingDocumentId);
      setApNumber(doc.accountingDocumentNumber ?? null);
      return true;
    }
    return false;
  }, []);

  const pollForAp = useCallback(
    async (sourceId: string) => {
      if (!isFinanceAccountingUiEnabled() || !canReadAp) return;
      const gen = ++pollGenRef.current;
      setPolling(true);
      try {
        for (let attempt = 0; attempt < FI_POLL.maxAttempts; attempt++) {
          if (gen !== pollGenRef.current) return;
          try {
            const rows = await listAccountingDocuments({
              side: "AP",
              sourceId,
            });
            if (gen !== pollGenRef.current) return;
            const first = rows?.[0];
            if (first) {
              setApId(first.id);
              setApNumber(first.number);
              return;
            }
          } catch (err) {
            if (gen !== pollGenRef.current) return;
            if (err instanceof ApiError) {
              toast.error(errorMessage(err.errorCode, err.message));
            } else {
              toast.error(t("errors.generic.requestFailed"));
            }
            return;
          }
          if (attempt < FI_POLL.maxAttempts - 1) {
            await new Promise((r) => setTimeout(r, FI_POLL.intervalMs));
          }
        }
        if (gen === pollGenRef.current) {
          toast.message(t("finance.ir.pollTimeout"));
        }
      } finally {
        if (gen === pollGenRef.current) {
          setPolling(false);
        }
      }
    },
    [canReadAp, errorMessage, t],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      setApId(null);
      setApNumber(null);
      try {
        const data = await getInvoiceReceipt(id);
        if (cancelled) return;
        setIr(data);
        if (isFinanceAccountingUiEnabled() && canReadAp) {
          if (!applyEmbed(data)) {
            // D-FE-FI-EMBED-UI: after Core merge embed should be non-null; POLL is defensive only.
            toast.error(t("finance.ir.embedMissing"));
            void pollForAp(data.id);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setIr(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      pollGenRef.current += 1;
      setPolling(false);
    };
  }, [applyEmbed, canReadAp, id, pollForAp]);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("invoiceReceipts.detail.loading")}
      </p>
    );
  }

  if (!ir) {
    return (
      <div className="space-y-4">
        <ApiErrorBanner error={error} />
        <Link
          href={INVOICE_RECEIPTS_ROUTE}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {t("common.backToList")}
        </Link>
      </div>
    );
  }

  const emDash = t("common.emDash");
  const lines = ir.lines ?? [];
  const showFi = isFinanceAccountingUiEnabled() && canReadAp;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-mono text-xl font-semibold tracking-tight">
              {ir.number}
            </h2>
            <InvoiceReceiptStatusBadge
              status={ir.status}
              label={invoiceReceiptStatus(ir.status, ir.statusLabel)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {t("invoiceReceipts.detail.meta.po")}{" "}
            {ir.purchaseOrderNumber ?? ir.purchaseOrderId}
            {ir.vendorCode
              ? ` · ${t("invoiceReceipts.detail.meta.vendor")} ${ir.vendorCode}`
              : ""}{" "}
            · {t("invoiceReceipts.detail.meta.amount")} {ir.netAmount}{" "}
            {ir.currency}
            {ir.postedAt
              ? ` · ${new Date(ir.postedAt).toLocaleString()}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={INVOICE_RECEIPTS_ROUTE}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {t("common.list")}
          </Link>
          <Link
            href={`${PURCHASE_ORDERS_ROUTE}/${ir.purchaseOrderId}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {t("invoiceReceipts.detail.backPo")}
          </Link>
          {showFi && apId ? (
            <Link
              href={`${FINANCE_AP_ROUTE}/${apId}`}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              {t("finance.ir.viewAp")}
              {apNumber ? ` ${apNumber}` : ""}
            </Link>
          ) : null}
          {showFi && !apId ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={polling}
              onClick={() => void pollForAp(ir.id)}
            >
              {polling
                ? t("finance.ir.pollInProgress")
                : t("finance.ir.pollManual")}
            </Button>
          ) : null}
        </div>
      </div>

      <ApiErrorBanner error={error} />

      <section className="space-y-3">
        <h3 className="text-base font-medium">
          {t("invoiceReceipts.detail.lines.title")}
        </h3>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {t("purchaseOrders.detail.lines.lineNumber")}
                </TableHead>
                <TableHead>{t("common.material")}</TableHead>
                <TableHead className="text-right">
                  {t("invoiceReceipts.new.col.qty")}
                </TableHead>
                <TableHead className="text-right">
                  {t("invoiceReceipts.new.col.unitPrice")}
                </TableHead>
                <TableHead className="text-right">
                  {t("invoiceReceipts.list.table.netAmount")}
                </TableHead>
                <TableHead>{t("purchaseOrderLines.unit")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    {t("invoiceReceipts.detail.lines.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                lines.map((line) => (
                  <TableRow
                    key={`${line.purchaseOrderLineId}-${line.lineNumber}`}
                  >
                    <TableCell>{line.lineNumber}</TableCell>
                    <TableCell className="font-medium">
                      {line.materialCode ?? emDash}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {line.quantity}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {line.unitPrice}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {line.amount}
                    </TableCell>
                    <TableCell>{line.unit ?? emDash}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}

export default function InvoiceReceiptDetailPage() {
  return (
    <RequireAuth>
      <InvoiceReceiptDetailInner />
    </RequireAuth>
  );
}
