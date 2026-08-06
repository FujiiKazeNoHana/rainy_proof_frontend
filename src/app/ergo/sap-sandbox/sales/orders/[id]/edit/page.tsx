"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/shared/auth";
import { ApiError } from "@/shared/lib/api-client";
import { Button, buttonVariants } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/lib/utils";
import {
  getSalesOrder,
  updateSalesOrder,
} from "@/features/ergo/sap_sandbox/api/salesOrders";
import { ApiErrorBanner } from "@/features/ergo/sap_sandbox/components/ApiErrorBanner";
import {
  OrderLineEditor,
  type LineDraft,
} from "@/features/ergo/sap_sandbox/components/OrderLineEditor";
import { OrderStatusBadge } from "@/features/ergo/sap_sandbox/components/OrderStatusBadge";
import { RequireAuth } from "@/features/ergo/sap_sandbox/components/RequireAuth";
import { useSalesOrderMasterData } from "@/features/ergo/sap_sandbox/hooks/useSalesOrderMasterData";
import { SALES_ORDERS_ROUTE } from "@/features/ergo/sap_sandbox/constants";
import { useSapI18n } from "@/features/ergo/sap_sandbox/i18n";
import { canEditOrder } from "@/features/ergo/sap_sandbox/lib/orderRules";
import type { SalesOrder } from "@/features/ergo/sap_sandbox/lib/types";

function toDrafts(order: SalesOrder): LineDraft[] {
  return (order.lines ?? []).map((l) => ({
    key: l.id || `line-${l.lineNo}`,
    id: l.id,
    materialCode: l.materialCode,
    orderedQty: l.orderedQty,
    unit: l.unit,
    plantCode: l.plantCode,
    unitPrice: l.unitPrice,
    remark: l.remark || "",
    deliveredQty: l.deliveredQty ?? 0,
    billedQty: l.billedQty ?? 0,
  }));
}

function EditOrderInner() {
  const { t, orderStatus, errorMessage } = useSapI18n();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { canWriteSales } = useAuth();

  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [requestedDeliveryDate, setRequestedDeliveryDate] = useState("");
  const [remark, setRemark] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const salesOrgForMd = order?.salesOrgCode ?? "";
  const {
    plants,
    materials,
    loading: mdLoading,
    source: mdSource,
  } = useSalesOrderMasterData(salesOrgForMd);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getSalesOrder(id);
        setOrder(data);
        setRequestedDeliveryDate(data.requestedDeliveryDate || "");
        setRemark(data.remark || "");
        setLines(toDrafts(data));
      } catch (err) {
        setError(err);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        {t("orders.edit.loading")}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <ApiErrorBanner error={error} />
        <Link
          href={SALES_ORDERS_ROUTE}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {t("common.backToList")}
        </Link>
      </div>
    );
  }

  if (!canWriteSales || !canEditOrder(order.status)) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t("orders.edit.notEditable")}
        </p>
        <Link
          href={`${SALES_ORDERS_ROUTE}/${order.id}`}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {t("orders.edit.backToDetail")}
        </Link>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      toast.error(t("orders.edit.toast.atLeastOneLine"));
      return;
    }
    if (lines.some((l) => !l.orderedQty || l.orderedQty <= 0)) {
      toast.error(t("orders.edit.toast.qtyMustBePositive"));
      return;
    }
    if (
      lines.some((l) => l.orderedQty < (l.deliveredQty ?? 0))
    ) {
      toast.error(t("orders.edit.toast.qtyBelowDelivered"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const next = await updateSalesOrder(order.id, {
        version: order.version,
        requestedDeliveryDate: requestedDeliveryDate || null,
        remark: remark || null,
        lines: lines.map((l) => ({
          id: l.id || null,
          materialCode: l.materialCode,
          orderedQty: l.orderedQty,
          unit: l.unit || null,
          plantCode: l.plantCode,
          unitPrice: l.unitPrice,
          remark: l.remark || null,
        })),
      });
      toast.success(t("orders.edit.toast.updated"));
      router.replace(`${SALES_ORDERS_ROUTE}/${next.id}`);
    } catch (err) {
      setError(err);
      if (err instanceof ApiError) {
        toast.error(errorMessage(err.errorCode, err.message));
      }
    } finally {
      setBusy(false);
    }
  };

  const metaSuffix =
    mdSource === "api"
      ? t("orders.edit.meta.masterDataApi")
      : t("orders.edit.meta.masterDataStub");

  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => void onSubmit(e)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-mono text-xl font-semibold tracking-tight">
              {t("orders.edit.title", { number: order.number })}
            </h2>
            <OrderStatusBadge
              status={order.status}
              label={orderStatus(order.status, order.statusLabel)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {t("orders.edit.meta.putReplace", {
              version: order.version,
              customerCode: order.customerCode,
            })}
            {metaSuffix}
            {mdLoading ? t("orders.edit.meta.loadingMasterData") : ""}
          </p>
        </div>
        <Link
          href={`${SALES_ORDERS_ROUTE}/${order.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          {t("orders.edit.backToDetail")}
        </Link>
      </div>

      <ApiErrorBanner error={error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label>{t("orders.edit.field.salesOrg")}</Label>
          <Input
            value={t("orders.edit.field.salesOrgReadonly", {
              code: order.salesOrgCode,
            })}
            disabled
          />
        </div>
        <div className="grid gap-1.5">
          <Label>{t("orders.edit.field.customer")}</Label>
          <Input
            value={`${order.customerCode} · ${order.customerName}`}
            disabled
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="deliveryDate">
            {t("orders.edit.field.requestedDeliveryDate")}
          </Label>
          <Input
            id="deliveryDate"
            type="date"
            value={requestedDeliveryDate}
            onChange={(e) => setRequestedDeliveryDate(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="remark">{t("common.remark")}</Label>
          <Textarea
            id="remark"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={2}
          />
        </div>
      </div>

      <OrderLineEditor
        lines={lines}
        onChange={setLines}
        materials={materials}
        plants={plants}
      />

      <div className="flex gap-2">
        <Button type="submit" disabled={busy || mdLoading}>
          {busy ? t("orders.edit.saving") : t("orders.edit.save")}
        </Button>
      </div>
    </form>
  );
}

export default function EditSalesOrderPage() {
  return (
    <RequireAuth>
      <EditOrderInner />
    </RequireAuth>
  );
}
