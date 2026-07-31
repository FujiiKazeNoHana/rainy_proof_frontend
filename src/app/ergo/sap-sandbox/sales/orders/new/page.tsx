"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/shared/auth";
import { ApiError } from "@/shared/lib/api-client";
import { Button, buttonVariants } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/lib/utils";
import { createSalesOrder } from "@/features/ergo/sap_sandbox/api/salesOrders";
import { ApiErrorBanner } from "@/features/ergo/sap_sandbox/components/ApiErrorBanner";
import {
  createEmptyLines,
  OrderLineEditor,
  type LineDraft,
} from "@/features/ergo/sap_sandbox/components/OrderLineEditor";
import { RequireAuth } from "@/features/ergo/sap_sandbox/components/RequireAuth";
import { SALES_ORDERS_ROUTE } from "@/features/ergo/sap_sandbox/constants";
import {
  CURRENCIES,
  CUSTOMERS,
  SALES_ORGS,
} from "@/features/ergo/sap_sandbox/lib/masterDataStub";

function NewOrderInner() {
  const router = useRouter();
  const { canWriteSales } = useAuth();
  const [salesOrgCode, setSalesOrgCode] = useState(SALES_ORGS[0].code);
  const [customerCode, setCustomerCode] = useState(CUSTOMERS[0].code);
  const [requestedDeliveryDate, setRequestedDeliveryDate] = useState("");
  const [currency, setCurrency] = useState<string>(CURRENCIES[0]);
  const [remark, setRemark] = useState("");
  const [lines, setLines] = useState<LineDraft[]>(() => createEmptyLines(1));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  if (!canWriteSales) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          当前角色无写权限（需要 Admin 或 SalesClerk）。
        </p>
        <Link
          href={SALES_ORDERS_ROUTE}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          返回列表
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
    setBusy(true);
    setError(null);
    try {
      const order = await createSalesOrder(
        {
          salesOrgCode,
          customerCode,
          requestedDeliveryDate: requestedDeliveryDate || null,
          remark: remark || null,
          currency,
          lines: lines.map((l) => ({
            materialCode: l.materialCode,
            orderedQty: l.orderedQty,
            unit: l.unit || null,
            plantCode: l.plantCode,
            unitPrice: l.unitPrice,
            remark: l.remark || null,
          })),
        },
        crypto.randomUUID(),
      );
      toast.success(`已创建 ${order.number}`);
      router.replace(`${SALES_ORDERS_ROUTE}/${order.id}`);
    } catch (err) {
      setError(err);
      if (err instanceof ApiError) {
        if (err.errorCode === "VALIDATION_FAILED") {
          toast.error("校验失败，请查看明细");
        } else if (err.status === 403) {
          toast.error("无权限创建订单");
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">新建销售订单</h2>
          <p className="text-sm text-muted-foreground">
            保存后状态为 Open；主数据使用 Stub 正例。
          </p>
        </div>
        <Link
          href={SALES_ORDERS_ROUTE}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          取消
        </Link>
      </div>

      <ApiErrorBanner error={error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="salesOrg">销售组织</Label>
          <select
            id="salesOrg"
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
            value={salesOrgCode}
            onChange={(e) => setSalesOrgCode(e.target.value)}
          >
            {SALES_ORGS.map((o) => (
              <option key={o.code} value={o.code}>
                {o.code} · {o.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="customer">客户</Label>
          <select
            id="customer"
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
            value={customerCode}
            onChange={(e) => setCustomerCode(e.target.value)}
          >
            {CUSTOMERS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} · {c.name}
              </option>
            ))}
          </select>
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
        <div className="grid gap-1.5">
          <Label htmlFor="currency">币种</Label>
          <select
            id="currency"
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
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
          {busy ? "提交中…" : "创建订单"}
        </Button>
      </div>
    </form>
  );
}

export default function NewSalesOrderPage() {
  return (
    <RequireAuth>
      <NewOrderInner />
    </RequireAuth>
  );
}
