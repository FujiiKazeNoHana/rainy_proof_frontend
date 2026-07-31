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
import { SALES_ORDERS_ROUTE } from "@/features/ergo/sap_sandbox/constants";
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
      <div className="p-4 text-sm text-muted-foreground">加载订单…</div>
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
          返回列表
        </Link>
      </div>
    );
  }

  if (!canWriteSales || !canEditOrder(order.status)) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          当前不可编辑（角色或状态限制）。
        </p>
        <Link
          href={`${SALES_ORDERS_ROUTE}/${order.id}`}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          返回详情
        </Link>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      toast.error("至少一行");
      return;
    }
    if (lines.some((l) => !l.orderedQty || l.orderedQty <= 0)) {
      toast.error("数量必须大于 0");
      return;
    }
    if (
      lines.some((l) => l.orderedQty < (l.deliveredQty ?? 0))
    ) {
      toast.error("订购量不能小于已交量");
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
      toast.success("订单已更新");
      router.replace(`${SALES_ORDERS_ROUTE}/${next.id}`);
    } catch (err) {
      setError(err);
      if (err instanceof ApiError) {
        if (err.errorCode === "CONCURRENCY_CONFLICT") {
          toast.error("版本冲突，请刷新后重试");
        } else if (err.errorCode === "VALIDATION_FAILED") {
          toast.error("校验失败，请查看明细");
        } else if (err.status === 403) {
          toast.error("无权限修改订单");
        } else {
          toast.error(err.message);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => void onSubmit(e)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-mono text-xl font-semibold tracking-tight">
              编辑 {order.number}
            </h2>
            <OrderStatusBadge
              status={order.status}
              label={order.statusLabel || order.status}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            PUT 整单替换 · version={order.version} · {order.customerCode}
          </p>
        </div>
        <Link
          href={`${SALES_ORDERS_ROUTE}/${order.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          返回详情
        </Link>
      </div>

      <ApiErrorBanner error={error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label>销售组织</Label>
          <Input value={`${order.salesOrgCode}（只读）`} disabled />
        </div>
        <div className="grid gap-1.5">
          <Label>客户</Label>
          <Input
            value={`${order.customerCode} · ${order.customerName}`}
            disabled
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="deliveryDate">要求交货日</Label>
          <Input
            id="deliveryDate"
            type="date"
            value={requestedDeliveryDate}
            onChange={(e) => setRequestedDeliveryDate(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="remark">备注</Label>
          <Textarea
            id="remark"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={2}
          />
        </div>
      </div>

      <OrderLineEditor lines={lines} onChange={setLines} />

      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>
          {busy ? "保存中…" : "保存变更"}
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
