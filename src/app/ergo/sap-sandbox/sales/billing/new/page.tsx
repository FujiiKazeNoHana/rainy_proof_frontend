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
import { createBillingDocument } from "@/features/ergo/sap_sandbox/api/billing";
import { listOrderDeliveries } from "@/features/ergo/sap_sandbox/api/deliveries";
import { getSalesOrder } from "@/features/ergo/sap_sandbox/api/salesOrders";
import { ApiErrorBanner } from "@/features/ergo/sap_sandbox/components/ApiErrorBanner";
import { RequireAuth } from "@/features/ergo/sap_sandbox/components/RequireAuth";
import {
  SALES_BILLING_ROUTE,
  SALES_ORDERS_ROUTE,
} from "@/features/ergo/sap_sandbox/constants";
import { useSapI18n } from "@/features/ergo/sap_sandbox/i18n";
import {
  billableQty,
  canCreateBillingFromOrder,
} from "@/features/ergo/sap_sandbox/lib/billingRules";
import type { DeliveryListItem } from "@/features/ergo/sap_sandbox/lib/deliveryTypes";
import type { SalesOrder } from "@/features/ergo/sap_sandbox/lib/types";

type LineDraft = {
  selected: boolean;
  quantity: string;
  unitPrice: string;
};

function CreateBillingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId")?.trim() ?? "";
  const { canWriteBilling } = useAuth();
  const { t, orderStatus, errorMessage } = useSapI18n();

  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryListItem[]>([]);
  const [deliveryId, setDeliveryId] = useState("");
  const [remark, setRemark] = useState("");
  const [lineDrafts, setLineDrafts] = useState<Record<string, LineDraft>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  useEffect(() => {
    if (!canWriteBilling) return;
    if (!orderId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [so, dns] = await Promise.all([
          getSalesOrder(orderId),
          listOrderDeliveries(orderId).catch(() => [] as DeliveryListItem[]),
        ]);
        if (cancelled) return;

        const drafts: Record<string, LineDraft> = {};
        for (const line of so.lines ?? []) {
          const billable = billableQty(line.deliveredQty, line.billedQty);
          drafts[line.id] = {
            selected: billable > 0,
            quantity: billable > 0 ? String(billable) : "",
            unitPrice:
              line.unitPrice != null && line.unitPrice !== undefined
                ? String(line.unitPrice)
                : "",
          };
        }

        setOrder(so);
        setDeliveries((dns ?? []).filter((d) => d.status === "GoodsIssued"));
        setLineDrafts(drafts);
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
  }, [orderId, canWriteBilling]);

  const billable = useMemo(
    () => canCreateBillingFromOrder(order),
    [order],
  );

  const submit = async () => {
    if (!order) return;
    const lines = (order.lines ?? [])
      .filter((l) => lineDrafts[l.id]?.selected)
      .map((l) => {
        const draft = lineDrafts[l.id];
        const qty = Number(draft?.quantity);
        const priceRaw = draft?.unitPrice?.trim();
        return {
          salesOrderLineId: l.id,
          quantity: qty,
          unitPrice:
            priceRaw === "" || priceRaw == null ? null : Number(priceRaw),
          deliveryId: deliveryId || null,
          deliveryLineId: null,
        };
      });

    if (lines.length === 0) {
      toast.error(t("billing.new.toast.selectLines"));
      return;
    }
    if (lines.some((l) => !(l.quantity > 0))) {
      toast.error(t("billing.new.toast.qtyMustBePositive"));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const created = await createBillingDocument(
        {
          salesOrderId: order.id,
          currency: "CNY",
          remark: remark.trim() || null,
          lines,
        },
        idempotencyKey,
      );
      setConfirmOpen(false);
      if (created.idempotentReplayed) {
        toast.message(t("billing.new.toast.idempotentTitle"), {
          description: t("billing.new.toast.idempotentDesc"),
        });
      } else {
        toast.success(t("billing.new.toast.created"));
      }
      router.push(`${SALES_BILLING_ROUTE}/${created.id}`);
    } catch (err) {
      setError(err);
      if (err instanceof ApiError) {
        if (err.status === 403) {
          toast.error(t("errors.http.forbiddenBillingWrite"));
        } else {
          toast.error(errorMessage(err.errorCode, err.message));
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!canWriteBilling) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t("billing.new.noPermission")}
        </p>
        <Link
          href={SALES_BILLING_ROUTE}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {t("common.backToList")}
        </Link>
      </div>
    );
  }

  if (!orderId) {
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">
          {t("billing.new.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("billing.new.hintNoOrderId")}
        </p>
        <Link href={SALES_ORDERS_ROUTE} className={cn(buttonVariants())}>
          {t("billing.new.goToOrders")}
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        {t("billing.new.loadingOrder")}
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
          {t("billing.new.backToOrder")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("billing.new.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("billing.new.hintWithOrder", {
              number: order.number,
              status: orderStatus(order.status, order.statusLabel),
            })}
          </p>
        </div>
        <Link
          href={`${SALES_ORDERS_ROUTE}/${order.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          {t("billing.new.backToOrder")}
        </Link>
      </div>

      <ApiErrorBanner error={error} />

      {!billable ? (
        <p className="text-sm text-destructive">
          {t("billing.new.orderNotBillable")}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="currency">{t("billing.new.field.currency")}</Label>
          <Input id="currency" className="w-24" value="CNY" disabled />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="dn">{t("billing.new.field.deliveryOptional")}</Label>
          <select
            id="dn"
            className="h-8 min-w-48 rounded-lg border border-input bg-transparent px-2 text-sm"
            value={deliveryId}
            onChange={(e) => setDeliveryId(e.target.value)}
            disabled={!billable}
          >
            <option value="">{t("billing.new.field.none")}</option>
            {deliveries.map((d) => (
              <option key={d.id} value={d.id}>
                {d.number}
              </option>
            ))}
          </select>
        </div>
        <div className="grid min-w-64 flex-1 gap-1.5">
          <Label htmlFor="remark">{t("common.remark")}</Label>
          <Input
            id="remark"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            disabled={!billable}
            maxLength={500}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">{t("billing.new.lines.select")}</TableHead>
              <TableHead>#</TableHead>
              <TableHead>{t("common.material")}</TableHead>
              <TableHead className="text-right">
                {t("billing.new.lines.ordered")}
              </TableHead>
              <TableHead className="text-right">
                {t("billing.new.lines.delivered")}
              </TableHead>
              <TableHead className="text-right">
                {t("billing.new.lines.billed")}
              </TableHead>
              <TableHead className="text-right">
                {t("billing.new.lines.billable")}
              </TableHead>
              <TableHead className="text-right">
                {t("billing.new.lines.thisQty")}
              </TableHead>
              <TableHead className="text-right">
                {t("billing.new.lines.unitPrice")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(order.lines ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-muted-foreground">
                  {t("billing.new.lines.empty")}
                </TableCell>
              </TableRow>
            ) : (
              (order.lines ?? []).map((line) => {
                const remaining = billableQty(
                  line.deliveredQty,
                  line.billedQty,
                );
                const draft = lineDrafts[line.id] ?? {
                  selected: false,
                  quantity: "",
                  unitPrice: "",
                };
                const disabledRow = !billable || remaining <= 0;
                return (
                  <TableRow key={line.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={draft.selected}
                        disabled={disabledRow}
                        onChange={(e) =>
                          setLineDrafts((prev) => ({
                            ...prev,
                            [line.id]: {
                              ...draft,
                              selected: e.target.checked,
                            },
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell>{line.lineNo}</TableCell>
                    <TableCell>
                      <div className="font-mono text-xs">
                        {line.materialCode}
                      </div>
                      <div className="text-muted-foreground">
                        {line.materialDesc}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {line.orderedQty} {line.unit}
                    </TableCell>
                    <TableCell className="text-right">
                      {line.deliveredQty}
                    </TableCell>
                    <TableCell className="text-right">{line.billedQty}</TableCell>
                    <TableCell className="text-right">{remaining}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        className="ml-auto w-24 text-right"
                        value={draft.quantity}
                        disabled={disabledRow || !draft.selected}
                        onChange={(e) =>
                          setLineDrafts((prev) => ({
                            ...prev,
                            [line.id]: {
                              ...draft,
                              quantity: e.target.value,
                            },
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        className="ml-auto w-24 text-right"
                        value={draft.unitPrice}
                        disabled={disabledRow || !draft.selected}
                        onChange={(e) =>
                          setLineDrafts((prev) => ({
                            ...prev,
                            [line.id]: {
                              ...draft,
                              unitPrice: e.target.value,
                            },
                          }))
                        }
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          disabled={!billable || submitting}
          onClick={() => setConfirmOpen(true)}
        >
          {submitting ? t("billing.new.submitting") : t("billing.new.submit")}
        </Button>
        <Link
          href={`${SALES_ORDERS_ROUTE}/${order.id}`}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {t("common.cancel")}
        </Link>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("billing.new.confirmTitle")}</DialogTitle>
            <DialogDescription>{t("billing.new.confirmBody")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={submitting}
            >
              {t("common.back")}
            </Button>
            <Button disabled={submitting} onClick={() => void submit()}>
              {t("billing.new.confirmSubmit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CreateBillingPage() {
  return (
    <RequireAuth>
      <Suspense
        fallback={
          <div className="p-4 text-sm text-muted-foreground">
            Loading…
          </div>
        }
      >
        <CreateBillingInner />
      </Suspense>
    </RequireAuth>
  );
}
