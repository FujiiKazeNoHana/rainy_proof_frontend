"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/utils";
import {
  cancelSalesOrder,
  getSalesOrder,
} from "@/features/ergo/sap_sandbox/api/salesOrders";
import { ApiErrorBanner } from "@/features/ergo/sap_sandbox/components/ApiErrorBanner";
import { OrderStatusBadge } from "@/features/ergo/sap_sandbox/components/OrderStatusBadge";
import { RequireAuth } from "@/features/ergo/sap_sandbox/components/RequireAuth";
import { SALES_ORDERS_ROUTE } from "@/features/ergo/sap_sandbox/constants";
import {
  canCancelOrder,
  canEditOrder,
} from "@/features/ergo/sap_sandbox/lib/orderRules";
import type { SalesOrder } from "@/features/ergo/sap_sandbox/lib/types";

function OrderDetailInner() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { canWriteSales } = useAuth();

  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      setOrder(await getSalesOrder(id));
    } catch (err) {
      setError(err);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const editable =
    canWriteSales && order && canEditOrder(order.status);
  const cancellable =
    canWriteSales && order && canCancelOrder(order.status, order.lines);
  const cancelBlocked =
    canWriteSales &&
    order &&
    order.status === "Open" &&
    !canCancelOrder(order.status, order.lines);

  const onCancel = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      const next = await cancelSalesOrder(order.id);
      setOrder(next);
      setCancelOpen(false);
      toast.success("订单已取消");
    } catch (err) {
      setError(err);
      if (err instanceof ApiError) {
        if (err.errorCode === "CANCEL_BLOCKED") {
          toast.error("有交货记录，无法取消");
        } else if (err.status === 403) {
          toast.error("无权限取消订单");
        } else {
          toast.error(err.message);
        }
      }
    } finally {
      setCancelling(false);
    }
  };

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-mono text-xl font-semibold tracking-tight">
              {order.number}
            </h2>
            <OrderStatusBadge
              status={order.status}
              label={order.statusLabel || order.status}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {order.customerCode} · {order.customerName} · 组织{" "}
            {order.salesOrgCode}
            {order.salesOrgName ? `（${order.salesOrgName}）` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={SALES_ORDERS_ROUTE}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            列表
          </Link>
          {editable ? (
            <Link
              href={`${SALES_ORDERS_ROUTE}/${order.id}/edit`}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              编辑
            </Link>
          ) : null}
          {canWriteSales ? (
            <Button
              size="sm"
              variant="destructive"
              disabled={!cancellable}
              title={
                cancelBlocked
                  ? "已有交货，不可取消（CANCEL_BLOCKED）"
                  : order.status === "Cancelled"
                    ? "已取消"
                    : "取消订单"
              }
              onClick={() => setCancelOpen(true)}
            >
              取消
            </Button>
          ) : null}
        </div>
      </div>

      <ApiErrorBanner error={error} />

      <dl className="grid gap-3 text-sm sm:grid-cols-2 md:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">币种</dt>
          <dd>{order.currency || "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">要求交货日</dt>
          <dd>{order.requestedDeliveryDate || "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">版本</dt>
          <dd className="font-mono">{order.version}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">创建</dt>
          <dd>
            {order.createdBy || "—"} ·{" "}
            {order.createdAt
              ? new Date(order.createdAt).toLocaleString()
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">更新</dt>
          <dd>
            {order.updatedBy || "—"} ·{" "}
            {order.updatedAt
              ? new Date(order.updatedAt).toLocaleString()
              : "—"}
          </dd>
        </div>
        <div className="sm:col-span-2 md:col-span-3">
          <dt className="text-muted-foreground">备注</dt>
          <dd>{order.remark || "—"}</dd>
        </div>
      </dl>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>物料</TableHead>
              <TableHead className="text-right">订购</TableHead>
              <TableHead className="text-right">已交</TableHead>
              <TableHead className="text-right">已开</TableHead>
              <TableHead>工厂</TableHead>
              <TableHead className="text-right">单价</TableHead>
              <TableHead className="text-right">金额</TableHead>
              <TableHead>备注</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(order.lines ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-muted-foreground">
                  无行项目
                </TableCell>
              </TableRow>
            ) : (
              (order.lines ?? []).map((line) => (
                <TableRow key={line.id || line.lineNo}>
                  <TableCell>{line.lineNo}</TableCell>
                  <TableCell>
                    <div className="font-mono text-xs">{line.materialCode}</div>
                    <div className="text-muted-foreground">
                      {line.materialDesc}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {line.orderedQty} {line.unit}
                  </TableCell>
                  <TableCell className="text-right">{line.deliveredQty}</TableCell>
                  <TableCell className="text-right">{line.billedQty}</TableCell>
                  <TableCell>{line.plantCode}</TableCell>
                  <TableCell className="text-right">
                    {line.unitPrice ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">{line.amount}</TableCell>
                  <TableCell>{line.remark || "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认取消订单？</DialogTitle>
            <DialogDescription>
              取消后订单只读，不可再改。单号 {order.number}。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelOpen(false)}
              disabled={cancelling}
            >
              返回
            </Button>
            <Button
              variant="destructive"
              disabled={cancelling}
              onClick={() => void onCancel()}
            >
              确认取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SalesOrderDetailPage() {
  return (
    <RequireAuth>
      <OrderDetailInner />
    </RequireAuth>
  );
}
