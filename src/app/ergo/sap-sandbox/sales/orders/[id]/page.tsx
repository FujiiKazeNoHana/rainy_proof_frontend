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
import { listOrderDeliveries } from "@/features/ergo/sap_sandbox/api/deliveries";
import {
  getDocumentFlow,
  listOrderBillingDocuments,
} from "@/features/ergo/sap_sandbox/api/billing";
import {
  cancelSalesOrder,
  getSalesOrder,
} from "@/features/ergo/sap_sandbox/api/salesOrders";
import { ApiErrorBanner } from "@/features/ergo/sap_sandbox/components/ApiErrorBanner";
import { BillingStatusBadge } from "@/features/ergo/sap_sandbox/components/BillingStatusBadge";
import { DeliveryStatusBadge } from "@/features/ergo/sap_sandbox/components/DeliveryStatusBadge";
import { OrderStatusBadge } from "@/features/ergo/sap_sandbox/components/OrderStatusBadge";
import { RequireAuth } from "@/features/ergo/sap_sandbox/components/RequireAuth";
import {
  SALES_BILLING_ROUTE,
  SALES_DELIVERIES_ROUTE,
  SALES_ORDERS_ROUTE,
} from "@/features/ergo/sap_sandbox/constants";
import { useSapI18n } from "@/features/ergo/sap_sandbox/i18n";
import {
  canCreateBillingFromOrder,
  documentFlowNodeHref,
} from "@/features/ergo/sap_sandbox/lib/billingRules";
import type {
  BillingDocumentListItem,
  DocumentFlowNode,
  DocumentFlowNodeType,
} from "@/features/ergo/sap_sandbox/lib/billingTypes";
import { canCreateFromOrderStatus } from "@/features/ergo/sap_sandbox/lib/deliveryRules";
import type { DeliveryListItem } from "@/features/ergo/sap_sandbox/lib/deliveryTypes";
import { isFinanceAccountingUiEnabled } from "@/features/ergo/sap_sandbox/lib/financeRules";
import {
  canCancelOrder,
  canEditOrder,
} from "@/features/ergo/sap_sandbox/lib/orderRules";
import type { SalesOrder } from "@/features/ergo/sap_sandbox/lib/types";

function OrderDetailInner() {
  const {
    t,
    orderStatus,
    deliveryStatus,
    billingStatus,
    accountingDocumentStatus,
    errorMessage,
  } = useSapI18n();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { canWriteSales, canWriteDelivery, canWriteBilling, canReadAr } =
    useAuth();

  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryListItem[]>([]);
  const [deliveriesError, setDeliveriesError] = useState<unknown>(null);
  const [billingDocs, setBillingDocs] = useState<BillingDocumentListItem[]>(
    [],
  );
  const [billingError, setBillingError] = useState<unknown>(null);
  const [flowNodes, setFlowNodes] = useState<DocumentFlowNode[]>([]);
  const [flowError, setFlowError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const reload = async () => {
    setLoading(true);
    setError(null);
    setDeliveriesError(null);
    setBillingError(null);
    setFlowError(null);
    try {
      const [so, dns, bills, flow] = await Promise.all([
        getSalesOrder(id),
        listOrderDeliveries(id).catch((err) => {
          setDeliveriesError(err);
          return [] as DeliveryListItem[];
        }),
        listOrderBillingDocuments(id).catch((err) => {
          setBillingError(err);
          return [] as BillingDocumentListItem[];
        }),
        getDocumentFlow(id).catch((err) => {
          setFlowError(err);
          return { salesOrderId: id, nodes: [] };
        }),
      ]);
      setOrder(so);
      setDeliveries(dns ?? []);
      setBillingDocs(bills ?? []);
      setFlowNodes(flow?.nodes ?? []);
    } catch (err) {
      setError(err);
      setOrder(null);
      setDeliveries([]);
      setBillingDocs([]);
      setFlowNodes([]);
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
  const canCreateDn =
    canWriteDelivery && order && canCreateFromOrderStatus(order.status);
  const canCreateBill =
    canWriteBilling && order && canCreateBillingFromOrder(order);

  const flowTypeLabel = (type: DocumentFlowNodeType) => {
    switch (type) {
      case "SalesOrder":
        return t("orders.detail.flow.type.SalesOrder");
      case "OutboundDelivery":
        return t("orders.detail.flow.type.OutboundDelivery");
      case "BillingDocument":
        return t("orders.detail.flow.type.BillingDocument");
      case "AccountingDocumentAr":
        return t("finance.flow.AccountingDocumentAr");
      default:
        return type;
    }
  };

  const onCancel = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      const next = await cancelSalesOrder(order.id);
      setOrder(next);
      setCancelOpen(false);
      toast.success(t("orders.detail.toast.cancelled"));
    } catch (err) {
      setError(err);
      if (err instanceof ApiError) {
        toast.error(errorMessage(err.errorCode, err.message));
      }
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        {t("orders.detail.loading")}
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

  const emDash = t("common.emDash");

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
              label={orderStatus(order.status, order.statusLabel)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {order.customerCode} · {order.customerName} · {t("orders.detail.meta.org")}{" "}
            {order.salesOrgCode}
            {order.salesOrgName ? `（${order.salesOrgName}）` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={SALES_ORDERS_ROUTE}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {t("common.list")}
          </Link>
          {editable ? (
            <Link
              href={`${SALES_ORDERS_ROUTE}/${order.id}/edit`}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              {t("orders.detail.actions.edit")}
            </Link>
          ) : null}
          {canCreateDn ? (
            <Link
              href={`${SALES_DELIVERIES_ROUTE}/new?orderId=${order.id}`}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              {t("orders.detail.actions.createDelivery")}
            </Link>
          ) : null}
          {canCreateBill ? (
            <Link
              href={`${SALES_BILLING_ROUTE}/new?orderId=${order.id}`}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              {t("orders.detail.billing.create")}
            </Link>
          ) : null}
          {canWriteSales ? (
            <Button
              size="sm"
              variant="destructive"
              disabled={!cancellable}
              title={
                cancelBlocked
                  ? t("orders.detail.actions.cancelBlocked")
                  : order.status === "Cancelled"
                    ? t("orders.detail.actions.alreadyCancelled")
                    : t("orders.detail.actions.cancelOrder")
              }
              onClick={() => setCancelOpen(true)}
            >
              {t("common.cancel")}
            </Button>
          ) : null}
        </div>
      </div>

      <ApiErrorBanner error={error} />

      <dl className="grid gap-3 text-sm sm:grid-cols-2 md:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">
            {t("orders.detail.field.currency")}
          </dt>
          <dd>{order.currency || emDash}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">
            {t("orders.detail.field.requestedDeliveryDate")}
          </dt>
          <dd>{order.requestedDeliveryDate || emDash}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("common.version")}</dt>
          <dd className="font-mono">{order.version}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("common.created")}</dt>
          <dd>
            {order.createdBy || emDash} ·{" "}
            {order.createdAt
              ? new Date(order.createdAt).toLocaleString()
              : emDash}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("common.updated")}</dt>
          <dd>
            {order.updatedBy || emDash} ·{" "}
            {order.updatedAt
              ? new Date(order.updatedAt).toLocaleString()
              : emDash}
          </dd>
        </div>
        <div className="sm:col-span-2 md:col-span-3">
          <dt className="text-muted-foreground">{t("common.remark")}</dt>
          <dd>{order.remark || emDash}</dd>
        </div>
      </dl>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>{t("common.material")}</TableHead>
              <TableHead className="text-right">
                {t("orders.detail.lines.ordered")}
              </TableHead>
              <TableHead className="text-right">
                {t("orders.detail.lines.delivered")}
              </TableHead>
              <TableHead className="text-right">
                {t("orders.detail.lines.billed")}
              </TableHead>
              <TableHead>{t("common.plant")}</TableHead>
              <TableHead className="text-right">
                {t("orders.detail.lines.unitPrice")}
              </TableHead>
              <TableHead className="text-right">
                {t("orders.detail.lines.amount")}
              </TableHead>
              <TableHead>{t("common.remark")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(order.lines ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-muted-foreground">
                  {t("orders.detail.lines.empty")}
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
                    {line.unitPrice ?? emDash}
                  </TableCell>
                  <TableCell className="text-right">{line.amount}</TableCell>
                  <TableCell>{line.remark || emDash}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="space-y-1">
            <h3 className="text-base font-semibold tracking-tight">
              {t("orders.detail.deliveries.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("orders.detail.deliveries.hint")}
            </p>
          </div>
          {canCreateDn ? (
            <Link
              href={`${SALES_DELIVERIES_ROUTE}/new?orderId=${order.id}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              {t("orders.detail.actions.createDelivery")}
            </Link>
          ) : null}
        </div>
        <ApiErrorBanner error={deliveriesError} />
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("orders.detail.deliveries.number")}</TableHead>
                <TableHead>{t("common.plant")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead className="text-right">{t("common.lineCount")}</TableHead>
                <TableHead>{t("common.createdAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    {t("orders.detail.deliveries.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                deliveries.map((dn) => (
                  <TableRow key={dn.id}>
                    <TableCell>
                      <Link
                        href={`${SALES_DELIVERIES_ROUTE}/${dn.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {dn.number}
                      </Link>
                    </TableCell>
                    <TableCell>{dn.plantCode}</TableCell>
                    <TableCell>
                      <DeliveryStatusBadge
                        status={dn.status}
                        label={deliveryStatus(dn.status, dn.statusLabel)}
                      />
                    </TableCell>
                    <TableCell className="text-right">{dn.lineCount}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {dn.createdAt
                        ? new Date(dn.createdAt).toLocaleString()
                        : emDash}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="space-y-1">
            <h3 className="text-base font-semibold tracking-tight">
              {t("orders.detail.billing.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("orders.detail.billing.hint")}
            </p>
          </div>
          {canCreateBill ? (
            <Link
              href={`${SALES_BILLING_ROUTE}/new?orderId=${order.id}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              {t("orders.detail.billing.create")}
            </Link>
          ) : null}
        </div>
        <ApiErrorBanner error={billingError} />
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("orders.detail.billing.number")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead className="text-right">
                  {t("orders.detail.billing.amount")}
                </TableHead>
                <TableHead className="text-right">{t("common.lineCount")}</TableHead>
                <TableHead>{t("billing.list.table.postedAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billingDocs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    {t("orders.detail.billing.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                billingDocs.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell>
                      <Link
                        href={`${SALES_BILLING_ROUTE}/${bill.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {bill.number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <BillingStatusBadge
                        status={bill.status}
                        label={billingStatus(bill.status, bill.statusLabel)}
                      />
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {bill.headerAmount} {bill.currency}
                    </TableCell>
                    <TableCell className="text-right">{bill.lineCount}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {bill.postedAt
                        ? new Date(bill.postedAt).toLocaleString()
                        : emDash}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold tracking-tight">
            {t("orders.detail.flow.title")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("orders.detail.flow.hint")}
          </p>
        </div>
        <ApiErrorBanner error={flowError} />
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>No.</TableHead>
                <TableHead>{t("orders.detail.flow.occurredAt")}</TableHead>
                <TableHead className="text-right">
                  {t("orders.detail.flow.amount")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flowNodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    {t("orders.detail.flow.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                flowNodes.map((node) => {
                  const statusLabel =
                    node.type === "BillingDocument"
                      ? billingStatus(node.status, node.statusLabel)
                      : node.type === "OutboundDelivery"
                        ? deliveryStatus(node.status, node.statusLabel)
                        : node.type === "AccountingDocumentAr"
                          ? accountingDocumentStatus(
                              node.status,
                              node.statusLabel,
                            )
                          : orderStatus(node.status, node.statusLabel);
                  const arClickable =
                    node.type === "AccountingDocumentAr" &&
                    isFinanceAccountingUiEnabled() &&
                    canReadAr;
                  const linkable =
                    node.type !== "AccountingDocumentAr" || arClickable;
                  return (
                  <TableRow key={`${node.type}-${node.id}`}>
                    <TableCell>{statusLabel}</TableCell>
                    <TableCell>{flowTypeLabel(node.type)}</TableCell>
                    <TableCell>
                      {linkable ? (
                        <Link
                          href={documentFlowNodeHref(node)}
                          className="font-medium text-primary hover:underline"
                        >
                          {node.number}
                        </Link>
                      ) : (
                        <span className="font-medium text-muted-foreground">
                          {node.number}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {node.occurredAt
                        ? new Date(node.occurredAt).toLocaleString()
                        : emDash}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {node.amount != null ? node.amount : emDash}
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("orders.detail.cancelDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("orders.detail.cancelDialog.body", { number: order.number })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelOpen(false)}
              disabled={cancelling}
            >
              {t("common.back")}
            </Button>
            <Button
              variant="destructive"
              disabled={cancelling}
              onClick={() => void onCancel()}
            >
              {t("orders.detail.cancelDialog.confirm")}
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
