"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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
import { listSalesOrders } from "@/features/ergo/sap_sandbox/api/salesOrders";
import { ApiErrorBanner } from "@/features/ergo/sap_sandbox/components/ApiErrorBanner";
import { OrderStatusBadge } from "@/features/ergo/sap_sandbox/components/OrderStatusBadge";
import { RequireAuth } from "@/features/ergo/sap_sandbox/components/RequireAuth";
import { SALES_ORDERS_ROUTE } from "@/features/ergo/sap_sandbox/constants";
import { ORDER_STATUSES } from "@/features/ergo/sap_sandbox/lib/masterDataStub";
import type { SalesOrderListItem } from "@/features/ergo/sap_sandbox/lib/types";

function OrdersListInner() {
  const { canWriteSales } = useAuth();
  const [number, setNumber] = useState("");
  const [customerCode, setCustomerCode] = useState("");
  const [status, setStatus] = useState("");
  const [items, setItems] = useState<SalesOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listSalesOrders({
        number: number.trim() || undefined,
        customerCode: customerCode.trim() || undefined,
        status: status || undefined,
      });
      setItems(data ?? []);
    } catch (err) {
      setError(err);
      setItems([]);
      if (err instanceof ApiError && err.status === 403) {
        toast.error("无权限查看销售订单");
      }
    } finally {
      setLoading(false);
    }
  }, [number, customerCode, status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">销售订单</h2>
          <p className="text-sm text-muted-foreground">
            单号、客户编码支持部分匹配；状态为精确筛选。点击行进入详情。
          </p>
        </div>
        {canWriteSales ? (
          <Link
            href={`${SALES_ORDERS_ROUTE}/new`}
            className={cn(buttonVariants())}
          >
            新建订单
          </Link>
        ) : null}
      </div>

      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <div className="grid gap-1.5">
          <Label htmlFor="number">单号</Label>
          <Input
            id="number"
            className="w-40"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="如 20002 或 SO2026"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="customerCode">客户编码</Label>
          <Input
            id="customerCode"
            className="w-40"
            value={customerCode}
            onChange={(e) => setCustomerCode(e.target.value)}
            placeholder="如 1001 或 C-10"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="status">状态</Label>
          <select
            id="status"
            className="h-8 min-w-36 rounded-lg border border-input bg-transparent px-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">全部</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="outline" disabled={loading}>
          查询
        </Button>
      </form>

      <ApiErrorBanner error={error} />

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>单号</TableHead>
              <TableHead>客户</TableHead>
              <TableHead>销售组织</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">行数</TableHead>
              <TableHead>创建时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  加载中…
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  暂无订单
                </TableCell>
              </TableRow>
            ) : (
              items.map((row) => (
                <TableRow key={row.id} className="cursor-pointer hover:bg-muted/40">
                  <TableCell>
                    <Link
                      href={`${SALES_ORDERS_ROUTE}/${row.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {row.number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-xs">{row.customerCode}</div>
                    <div className="text-muted-foreground">{row.customerName}</div>
                  </TableCell>
                  <TableCell>{row.salesOrgCode}</TableCell>
                  <TableCell>
                    <OrderStatusBadge
                      status={row.status}
                      label={row.statusLabel || row.status}
                    />
                  </TableCell>
                  <TableCell className="text-right">{row.lineCount}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.createdAt
                      ? new Date(row.createdAt).toLocaleString()
                      : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function SalesOrdersListPage() {
  return (
    <RequireAuth>
      <OrdersListInner />
    </RequireAuth>
  );
}
