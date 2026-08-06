"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/shared/auth";
import { ApiError } from "@/shared/lib/api-client";
import { Button, buttonVariants } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/lib/utils";
import {
  getPurchaseOrder,
  updatePurchaseOrder,
} from "@/features/ergo/sap_sandbox/api/purchaseOrders";
import { ApiErrorBanner } from "@/features/ergo/sap_sandbox/components/ApiErrorBanner";
import {
  createEmptyPoLines,
  PurchaseOrderLineEditor,
  type PoLineDraft,
} from "@/features/ergo/sap_sandbox/components/PurchaseOrderLineEditor";
import { RequireAuth } from "@/features/ergo/sap_sandbox/components/RequireAuth";
import { PURCHASE_ORDERS_ROUTE } from "@/features/ergo/sap_sandbox/constants";
import { usePurchaseOrderMasterData } from "@/features/ergo/sap_sandbox/hooks/usePurchaseOrderMasterData";
import { useSapI18n } from "@/features/ergo/sap_sandbox/i18n";
import { canEditPo } from "@/features/ergo/sap_sandbox/lib/procurementRules";
import type { PurchaseOrder } from "@/features/ergo/sap_sandbox/lib/procurementTypes";

function EditPurchaseOrderInner() {
  const { t, errorMessage } = useSapI18n();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { canWritePurchaseOrder } = useAuth();

  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [remark, setRemark] = useState("");
  const [lines, setLines] = useState<PoLineDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const { materials, loading: mdLoading, error: mdError } =
    usePurchaseOrderMasterData(order?.purchasingOrgCode ?? "");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const po = await getPurchaseOrder(id);
        if (cancelled) return;
        setOrder(po);
        setRemark(po.remark ?? "");
        setLines(
          (po.lines ?? []).map((l) => ({
            key: l.id,
            lineId: l.id,
            materialCode: l.materialCode,
            orderedQty: l.orderedQty,
            unit: l.unit,
            unitPrice: l.unitPrice,
            receivedQty: l.receivedQty,
          })),
        );
      } catch (err) {
        if (cancelled) return;
        setError(err);
        setOrder(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const allowed =
    canWritePurchaseOrder && order != null && canEditPo(order);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("purchaseOrders.detail.loading")}
      </p>
    );
  }

  if (!order || !allowed) {
    return (
      <div className="space-y-3">
        <ApiErrorBanner error={error} />
        <p className="text-sm text-muted-foreground">
          {t("purchaseOrders.edit.noPermission")}
        </p>
        <Link
          href={
            order
              ? `${PURCHASE_ORDERS_ROUTE}/${order.id}`
              : PURCHASE_ORDERS_ROUTE
          }
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {t("common.back")}
        </Link>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      toast.error(t("purchaseOrders.new.toast.atLeastOneLine"));
      return;
    }
    if (lines.some((l) => !l.materialCode.trim() || !l.unit.trim())) {
      toast.error(t("purchaseOrders.new.toast.completeLine"));
      return;
    }
    if (
      lines.some(
        (l) =>
          !l.orderedQty ||
          l.orderedQty <= 0 ||
          l.orderedQty < l.receivedQty,
      )
    ) {
      toast.error(t("purchaseOrders.new.toast.qtyMustBePositive"));
      return;
    }
    if (lines.some((l) => !Number.isFinite(l.unitPrice) || l.unitPrice < 0)) {
      toast.error(t("purchaseOrders.new.toast.priceRequired"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const next = await updatePurchaseOrder(order.id, {
        remark: remark.trim() || null,
        lines: lines.map((l) => ({
          lineId: l.lineId ?? null,
          materialCode: l.materialCode.trim(),
          orderedQty: l.orderedQty,
          unit: l.unit.trim(),
          unitPrice: l.unitPrice,
        })),
      });
      toast.success(t("purchaseOrders.edit.toast.saved"));
      router.replace(`${PURCHASE_ORDERS_ROUTE}/${next.id}`);
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
            {t("purchaseOrders.edit.title")} · {order.number}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("purchaseOrders.edit.hint")}
          </p>
        </div>
        <Link
          href={`${PURCHASE_ORDERS_ROUTE}/${order.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          {t("common.cancel")}
        </Link>
      </div>

      <ApiErrorBanner error={error ?? mdError} />

      <div className="grid gap-2 rounded-md border p-3 text-sm">
        <p className="font-medium">{t("purchaseOrders.edit.headerFrozen")}</p>
        <p className="text-muted-foreground">
          {t("purchaseOrders.detail.meta.org")} {order.purchasingOrgCode} ·{" "}
          {t("purchaseOrders.detail.meta.vendor")} {order.vendorCode} ·{" "}
          {t("purchaseOrders.detail.meta.plant")} {order.plantCode}
        </p>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="remark">{t("common.remark")}</Label>
        <Textarea
          id="remark"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          rows={2}
        />
      </div>

      <PurchaseOrderLineEditor
        lines={lines}
        onChange={(next) => {
          if (next.length === 0 && materials[0]) {
            setLines(
              createEmptyPoLines(1, {
                materialCode: materials[0].code,
                unit: materials[0].baseUnit,
              }),
            );
            return;
          }
          setLines(next);
        }}
        materials={materials}
      />

      <Button type="submit" disabled={busy || mdLoading}>
        {busy
          ? t("purchaseOrders.edit.submitting")
          : t("purchaseOrders.edit.submit")}
      </Button>
    </form>
  );
}

export default function EditPurchaseOrderPage() {
  return (
    <RequireAuth>
      <EditPurchaseOrderInner />
    </RequireAuth>
  );
}
