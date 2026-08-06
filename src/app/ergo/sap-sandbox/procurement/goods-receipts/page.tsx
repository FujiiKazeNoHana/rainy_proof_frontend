"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ApiError } from "@/shared/lib/api-client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { listGoodsReceipts } from "@/features/ergo/sap_sandbox/api/goodsReceipts";
import { ApiErrorBanner } from "@/features/ergo/sap_sandbox/components/ApiErrorBanner";
import { GoodsReceiptStatusBadge } from "@/features/ergo/sap_sandbox/components/PurchaseOrderStatusBadge";
import { RequireAuth } from "@/features/ergo/sap_sandbox/components/RequireAuth";
import {
  GOODS_RECEIPTS_ROUTE,
  PURCHASE_ORDERS_ROUTE,
} from "@/features/ergo/sap_sandbox/constants";
import { useSapI18n } from "@/features/ergo/sap_sandbox/i18n";
import type { GoodsReceiptListItem } from "@/features/ergo/sap_sandbox/lib/procurementTypes";

function GoodsReceiptsListInner() {
  const { t, goodsReceiptStatus } = useSapI18n();
  const [items, setItems] = useState<GoodsReceiptListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listGoodsReceipts();
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

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">
          {t("goodsReceipts.list.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("goodsReceipts.list.hint")}
        </p>
      </div>

      <ApiErrorBanner error={error} />

      {loading ? (
        <p className="text-sm text-muted-foreground">
          {t("goodsReceipts.list.loading")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("goodsReceipts.list.table.number")}</TableHead>
                <TableHead>{t("goodsReceipts.list.table.po")}</TableHead>
                <TableHead>{t("goodsReceipts.list.table.sloc")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>{t("goodsReceipts.list.table.postedAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    {t("goodsReceipts.list.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link
                        href={`${GOODS_RECEIPTS_ROUTE}/${row.id}`}
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
                    <TableCell>{row.storageLocationCode ?? emDash}</TableCell>
                    <TableCell>
                      <GoodsReceiptStatusBadge
                        status={row.status}
                        label={goodsReceiptStatus(row.status, row.statusLabel)}
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

export default function GoodsReceiptsPage() {
  return (
    <RequireAuth>
      <GoodsReceiptsListInner />
    </RequireAuth>
  );
}
