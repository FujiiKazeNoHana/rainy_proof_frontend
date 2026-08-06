"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/shared/auth";
import { ApiError } from "@/shared/lib/api-client";
import { Button, buttonVariants } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
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
import { createInvoiceReceipt } from "@/features/ergo/sap_sandbox/api/invoiceReceipts";
import { getPurchaseOrder } from "@/features/ergo/sap_sandbox/api/purchaseOrders";
import { ApiErrorBanner } from "@/features/ergo/sap_sandbox/components/ApiErrorBanner";
import { RequireAuth } from "@/features/ergo/sap_sandbox/components/RequireAuth";
import {
  INVOICE_RECEIPTS_ROUTE,
  INVOICE_RECEIPTS_UI_ENABLED,
  PURCHASE_ORDERS_ROUTE,
} from "@/features/ergo/sap_sandbox/constants";
import { useSapI18n } from "@/features/ergo/sap_sandbox/i18n";
import {
  canInvoicePo,
  invoiceableQty,
  normalizeInvoicedQty,
} from "@/features/ergo/sap_sandbox/lib/procurementRules";
import type { PurchaseOrder } from "@/features/ergo/sap_sandbox/lib/procurementTypes";

type Mode = "partial" | "full";

function NewInvoiceReceiptInner() {
  const { t, errorMessage } = useSapI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const purchaseOrderId = searchParams.get("purchaseOrderId")?.trim() ?? "";
  const { canPostInvoiceReceipt } = useAuth();

  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [mode, setMode] = useState<Mode>("full");
  const [qtyByLine, setQtyByLine] = useState<Record<string, string>>({});
  const [priceByLine, setPriceByLine] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [lastPostedId, setLastPostedId] = useState<string | null>(null);

  useEffect(() => {
    if (
      !INVOICE_RECEIPTS_UI_ENABLED ||
      !canPostInvoiceReceipt ||
      !purchaseOrderId
    ) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const po = await getPurchaseOrder(purchaseOrderId);
        if (cancelled) return;
        setOrder(po);
        const qtyDrafts: Record<string, string> = {};
        const priceDrafts: Record<string, string> = {};
        for (const line of po.lines ?? []) {
          const inv = invoiceableQty(line);
          if (inv > 0) {
            qtyDrafts[line.id] = String(inv);
            priceDrafts[line.id] = String(line.unitPrice);
          }
        }
        setQtyByLine(qtyDrafts);
        setPriceByLine(priceDrafts);
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setOrder(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canPostInvoiceReceipt, purchaseOrderId]);

  const invoiceableLines = useMemo(
    () => (order?.lines ?? []).filter((l) => invoiceableQty(l) > 0),
    [order],
  );

  if (!INVOICE_RECEIPTS_UI_ENABLED) {
    return (
      <div className="space-y-3">
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

  if (!canPostInvoiceReceipt) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t("invoiceReceipts.new.noPermission")}
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

  if (!purchaseOrderId) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t("invoiceReceipts.new.needPo")}
        </p>
        <Link
          href={PURCHASE_ORDERS_ROUTE}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {t("common.backToList")}
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("purchaseOrders.detail.loading")}
      </p>
    );
  }

  if (!order || !canInvoicePo(order)) {
    return (
      <div className="space-y-3">
        <ApiErrorBanner error={error} />
        <p className="text-sm text-muted-foreground">
          {t("invoiceReceipts.new.toast.cannotInvoice")}
        </p>
        <Link
          href={`${PURCHASE_ORDERS_ROUTE}/${purchaseOrderId}`}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {t("common.back")}
        </Link>
      </div>
    );
  }

  const trySubmit = () => {
    if (mode === "partial") {
      const lines = invoiceableLines
        .map((line) => {
          const raw = qtyByLine[line.id]?.trim() ?? "";
          if (!raw) return null;
          const quantity = Number(raw);
          if (!Number.isFinite(quantity) || quantity <= 0) return null;
          const priceRaw = priceByLine[line.id]?.trim() ?? "";
          const unitPrice =
            priceRaw === "" ? undefined : Number(priceRaw);
          if (
            unitPrice != null &&
            (!Number.isFinite(unitPrice) || unitPrice < 0)
          ) {
            return null;
          }
          return {
            purchaseOrderLineId: line.id,
            quantity,
            ...(unitPrice != null ? { unitPrice } : {}),
          };
        })
        .filter(Boolean);
      if (lines.length === 0) {
        toast.error(t("invoiceReceipts.new.toast.nothingSelected"));
        return;
      }
    }
    setConfirmOpen(true);
  };

  const onSubmit = async () => {
    let body: {
      purchaseOrderId: string;
      lines?: {
        purchaseOrderLineId: string;
        quantity: number;
        unitPrice?: number;
      }[];
    } = { purchaseOrderId: order.id };

    if (mode === "partial") {
      const lines = invoiceableLines
        .map((line) => {
          const raw = qtyByLine[line.id]?.trim() ?? "";
          if (!raw) return null;
          const quantity = Number(raw);
          if (!Number.isFinite(quantity) || quantity <= 0) return null;
          const priceRaw = priceByLine[line.id]?.trim() ?? "";
          const unitPrice =
            priceRaw === "" ? undefined : Number(priceRaw);
          return {
            purchaseOrderLineId: line.id,
            quantity,
            ...(unitPrice != null && Number.isFinite(unitPrice)
              ? { unitPrice }
              : {}),
          };
        })
        .filter(Boolean) as {
        purchaseOrderLineId: string;
        quantity: number;
        unitPrice?: number;
      }[];
      body = { ...body, lines };
    }

    setBusy(true);
    setError(null);
    try {
      const ir = await createInvoiceReceipt(body, idempotencyKey);
      const replayed = lastPostedId != null && lastPostedId === ir.id;
      setLastPostedId(ir.id);
      if (replayed) {
        toast.message(
          t("invoiceReceipts.new.toast.replayed", { number: ir.number }),
        );
      } else {
        toast.success(
          t("invoiceReceipts.new.toast.posted", { number: ir.number }),
        );
      }
      setConfirmOpen(false);
      router.replace(`${INVOICE_RECEIPTS_ROUTE}/${ir.id}`);
    } catch (err) {
      setError(err);
      setConfirmOpen(false);
      if (err instanceof ApiError) {
        if (err.status === 403) {
          toast.error(t("errors.http.forbiddenIrPost"));
        } else {
          toast.error(errorMessage(err.errorCode, err.message));
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          trySubmit();
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">
              {t("invoiceReceipts.new.title")} · {order.number}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("invoiceReceipts.new.hint")}
            </p>
          </div>
          <Link
            href={`${PURCHASE_ORDERS_ROUTE}/${order.id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {t("common.cancel")}
          </Link>
        </div>

        <ApiErrorBanner error={error} />

        <div className="grid gap-1.5">
          <Label>{t("common.status")}</Label>
          <div className="flex flex-wrap gap-3 pt-1 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="ir-mode"
                checked={mode === "full"}
                onChange={() => setMode("full")}
              />
              {t("invoiceReceipts.new.mode.full")}
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="ir-mode"
                checked={mode === "partial"}
                onChange={() => setMode("partial")}
              />
              {t("invoiceReceipts.new.mode.partial")}
            </label>
          </div>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {t("purchaseOrders.detail.lines.lineNumber")}
                </TableHead>
                <TableHead>{t("common.material")}</TableHead>
                <TableHead className="text-right">
                  {t("purchaseOrders.detail.lines.received")}
                </TableHead>
                <TableHead className="text-right">
                  {t("purchaseOrders.detail.lines.invoiced")}
                </TableHead>
                <TableHead className="text-right">
                  {t("invoiceReceipts.new.col.invoiceable")}
                </TableHead>
                {mode === "partial" ? (
                  <>
                    <TableHead>{t("invoiceReceipts.new.col.qty")}</TableHead>
                    <TableHead>
                      {t("invoiceReceipts.new.col.unitPrice")}
                    </TableHead>
                  </>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoiceableLines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>{line.lineNumber}</TableCell>
                  <TableCell className="font-medium">
                    {line.materialCode}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {line.receivedQty}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {normalizeInvoicedQty(line)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {invoiceableQty(line)}
                  </TableCell>
                  {mode === "partial" ? (
                    <>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          className="w-28"
                          value={qtyByLine[line.id] ?? ""}
                          onChange={(e) =>
                            setQtyByLine((prev) => ({
                              ...prev,
                              [line.id]: e.target.value,
                            }))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          className="w-28"
                          value={priceByLine[line.id] ?? ""}
                          onChange={(e) =>
                            setPriceByLine((prev) => ({
                              ...prev,
                              [line.id]: e.target.value,
                            }))
                          }
                        />
                      </TableCell>
                    </>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Button type="submit" disabled={busy}>
          {busy
            ? t("invoiceReceipts.new.submitting")
            : t("invoiceReceipts.new.submit")}
        </Button>
      </form>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("invoiceReceipts.new.confirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("invoiceReceipts.new.confirmBody")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => void onSubmit()}
            >
              {t("invoiceReceipts.new.confirmSubmit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function NewInvoiceReceiptPage() {
  return (
    <RequireAuth>
      <Suspense
        fallback={
          <p className="p-4 text-sm text-muted-foreground">…</p>
        }
      >
        <NewInvoiceReceiptInner />
      </Suspense>
    </RequireAuth>
  );
}
