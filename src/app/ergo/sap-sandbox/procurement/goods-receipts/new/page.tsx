"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { createGoodsReceipt } from "@/features/ergo/sap_sandbox/api/goodsReceipts";
import { getPurchaseOrder } from "@/features/ergo/sap_sandbox/api/purchaseOrders";
import { ApiErrorBanner } from "@/features/ergo/sap_sandbox/components/ApiErrorBanner";
import { RequireAuth } from "@/features/ergo/sap_sandbox/components/RequireAuth";
import {
  GOODS_RECEIPTS_ROUTE,
  PURCHASE_ORDERS_ROUTE,
} from "@/features/ergo/sap_sandbox/constants";
import { useSapI18n } from "@/features/ergo/sap_sandbox/i18n";
import {
  canReceivePo,
  remainingQty,
} from "@/features/ergo/sap_sandbox/lib/procurementRules";
import type { PurchaseOrder } from "@/features/ergo/sap_sandbox/lib/procurementTypes";

type Mode = "partial" | "full";

function NewGoodsReceiptInner() {
  const { t, errorMessage } = useSapI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const purchaseOrderId = searchParams.get("purchaseOrderId")?.trim() ?? "";
  const { canPostGoodsReceipt } = useAuth();

  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [storageLocationCode, setStorageLocationCode] = useState("0001");
  const [mode, setMode] = useState<Mode>("partial");
  const [qtyByLine, setQtyByLine] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [lastPostedId, setLastPostedId] = useState<string | null>(null);

  useEffect(() => {
    if (!canPostGoodsReceipt || !purchaseOrderId) {
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
        const drafts: Record<string, string> = {};
        for (const line of po.lines ?? []) {
          const rem = remainingQty(line);
          if (rem > 0) drafts[line.id] = String(rem);
        }
        setQtyByLine(drafts);
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
  }, [canPostGoodsReceipt, purchaseOrderId]);

  const receivableLines = useMemo(
    () => (order?.lines ?? []).filter((l) => remainingQty(l) > 0),
    [order],
  );

  if (!canPostGoodsReceipt) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t("goodsReceipts.new.noPermission")}
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
          {t("goodsReceipts.new.needPo")}
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

  if (!order || !canReceivePo(order)) {
    return (
      <div className="space-y-3">
        <ApiErrorBanner error={error} />
        <p className="text-sm text-muted-foreground">
          {t("goodsReceipts.new.toast.cannotReceive")}
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sloc = storageLocationCode.trim();
    if (!sloc) {
      toast.error(t("goodsReceipts.new.toast.slocRequired"));
      return;
    }

    let body: {
      purchaseOrderId: string;
      storageLocationCode: string;
      lines?: { purchaseOrderLineId: string; quantity: number }[];
    } = {
      purchaseOrderId: order.id,
      storageLocationCode: sloc,
    };

    if (mode === "partial") {
      const lines = receivableLines
        .map((line) => {
          const raw = qtyByLine[line.id]?.trim() ?? "";
          if (!raw) return null;
          const quantity = Number(raw);
          if (!Number.isFinite(quantity) || quantity <= 0) return null;
          return { purchaseOrderLineId: line.id, quantity };
        })
        .filter(Boolean) as { purchaseOrderLineId: string; quantity: number }[];

      if (lines.length === 0) {
        toast.error(t("goodsReceipts.new.toast.nothingSelected"));
        return;
      }
      body = { ...body, lines };
    }
    // mode === "full": omit lines entirely (never send [])

    setBusy(true);
    setError(null);
    try {
      const gr = await createGoodsReceipt(body, idempotencyKey);
      const replayed = lastPostedId != null && lastPostedId === gr.id;
      setLastPostedId(gr.id);
      if (replayed) {
        toast.message(
          t("goodsReceipts.new.toast.replayed", { number: gr.number }),
        );
      } else {
        toast.success(
          t("goodsReceipts.new.toast.posted", { number: gr.number }),
        );
      }
      router.replace(`${GOODS_RECEIPTS_ROUTE}/${gr.id}`);
    } catch (err) {
      setError(err);
      if (err instanceof ApiError) {
        toast.error(errorMessage(err.errorCode, err.message));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => void onSubmit(e)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("goodsReceipts.new.title")} · {order.number}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("goodsReceipts.new.hint")}
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="sloc">{t("goodsReceipts.new.field.sloc")}</Label>
          <Input
            id="sloc"
            value={storageLocationCode}
            onChange={(e) => setStorageLocationCode(e.target.value)}
            placeholder="0001"
          />
        </div>
        <div className="grid gap-1.5">
          <Label>{t("common.status")}</Label>
          <div className="flex flex-wrap gap-3 pt-1 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="gr-mode"
                checked={mode === "partial"}
                onChange={() => setMode("partial")}
              />
              {t("goodsReceipts.new.mode.partial")}
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="gr-mode"
                checked={mode === "full"}
                onChange={() => setMode("full")}
              />
              {t("goodsReceipts.new.mode.full")}
            </label>
          </div>
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
                {t("goodsReceipts.new.col.remaining")}
              </TableHead>
              <TableHead>{t("purchaseOrderLines.unit")}</TableHead>
              {mode === "partial" ? (
                <TableHead>{t("goodsReceipts.new.col.qty")}</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {receivableLines.map((line) => (
              <TableRow key={line.id}>
                <TableCell>{line.lineNumber}</TableCell>
                <TableCell className="font-medium">{line.materialCode}</TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {remainingQty(line)}
                </TableCell>
                <TableCell>{line.unit}</TableCell>
                {mode === "partial" ? (
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
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Button type="submit" disabled={busy}>
        {busy
          ? t("goodsReceipts.new.submitting")
          : t("goodsReceipts.new.submit")}
      </Button>
    </form>
  );
}

export default function NewGoodsReceiptPage() {
  return (
    <RequireAuth>
      <Suspense
        fallback={
          <p className="p-4 text-sm text-muted-foreground">…</p>
        }
      >
        <NewGoodsReceiptInner />
      </Suspense>
    </RequireAuth>
  );
}
