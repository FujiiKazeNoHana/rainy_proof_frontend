"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
import { getGoodsReceipt } from "@/features/ergo/sap_sandbox/api/goodsReceipts";
import { ApiErrorBanner } from "@/features/ergo/sap_sandbox/components/ApiErrorBanner";
import { GoodsReceiptStatusBadge } from "@/features/ergo/sap_sandbox/components/PurchaseOrderStatusBadge";
import { RequireAuth } from "@/features/ergo/sap_sandbox/components/RequireAuth";
import {
  GOODS_RECEIPTS_ROUTE,
  PURCHASE_ORDERS_ROUTE,
} from "@/features/ergo/sap_sandbox/constants";
import { useSapI18n } from "@/features/ergo/sap_sandbox/i18n";
import type { GoodsReceipt } from "@/features/ergo/sap_sandbox/lib/procurementTypes";

function GoodsReceiptDetailInner() {
  const { t, goodsReceiptStatus } = useSapI18n();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [gr, setGr] = useState<GoodsReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getGoodsReceipt(id);
        if (!cancelled) setGr(data);
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setGr(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("goodsReceipts.detail.loading")}
      </p>
    );
  }

  if (!gr) {
    return (
      <div className="space-y-4">
        <ApiErrorBanner error={error} />
        <Link
          href={GOODS_RECEIPTS_ROUTE}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {t("common.backToList")}
        </Link>
      </div>
    );
  }

  const emDash = t("common.emDash");
  const lines = gr.lines ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-mono text-xl font-semibold tracking-tight">
              {gr.number}
            </h2>
            <GoodsReceiptStatusBadge
              status={gr.status}
              label={goodsReceiptStatus(gr.status, gr.statusLabel)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {t("goodsReceipts.detail.meta.po")}{" "}
            {gr.purchaseOrderNumber ?? gr.purchaseOrderId} ·{" "}
            {t("goodsReceipts.detail.meta.plant")} {gr.plantCode} ·{" "}
            {t("goodsReceipts.detail.meta.sloc")} {gr.storageLocationCode}
            {gr.postedAt
              ? ` · ${new Date(gr.postedAt).toLocaleString()}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={GOODS_RECEIPTS_ROUTE}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {t("common.list")}
          </Link>
          <Link
            href={`${PURCHASE_ORDERS_ROUTE}/${gr.purchaseOrderId}`}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            {t("goodsReceipts.detail.backPo")}
          </Link>
        </div>
      </div>

      <ApiErrorBanner error={error} />

      <section className="space-y-3">
        <h3 className="text-base font-medium">
          {t("goodsReceipts.detail.lines.title")}
        </h3>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.material")}</TableHead>
                <TableHead className="text-right">
                  {t("goodsReceipts.new.col.qty")}
                </TableHead>
                <TableHead>{t("purchaseOrderLines.unit")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    {t("goodsReceipts.detail.lines.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                lines.map((line, idx) => (
                  <TableRow
                    key={line.id ?? line.purchaseOrderLineId ?? String(idx)}
                  >
                    <TableCell className="font-medium">
                      {line.materialCode ?? emDash}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {line.quantity}
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

export default function GoodsReceiptDetailPage() {
  return (
    <RequireAuth>
      <GoodsReceiptDetailInner />
    </RequireAuth>
  );
}
