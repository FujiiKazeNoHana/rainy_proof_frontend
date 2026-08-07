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
  cancelPurchaseOrder,
  getPurchaseOrder,
  getPurchaseOrderDocumentFlow,
} from "@/features/ergo/sap_sandbox/api/purchaseOrders";
import { ApiErrorBanner } from "@/features/ergo/sap_sandbox/components/ApiErrorBanner";
import { PurchaseOrderStatusBadge } from "@/features/ergo/sap_sandbox/components/PurchaseOrderStatusBadge";
import { RequireAuth } from "@/features/ergo/sap_sandbox/components/RequireAuth";
import {
  GOODS_RECEIPTS_ROUTE,
  INVOICE_RECEIPTS_ROUTE,
  INVOICE_RECEIPTS_UI_ENABLED,
  PURCHASE_ORDERS_ROUTE,
} from "@/features/ergo/sap_sandbox/constants";
import { useSapI18n } from "@/features/ergo/sap_sandbox/i18n";
import { isFinanceAccountingUiEnabled } from "@/features/ergo/sap_sandbox/lib/financeRules";
import {
  canCancelPo,
  canEditPo,
  canInvoicePo,
  canReceivePo,
  invoiceableQty,
  normalizeInvoicedQty,
  procurementFlowNodeHref,
  remainingQty,
} from "@/features/ergo/sap_sandbox/lib/procurementRules";
import type {
  ProcurementDocumentFlowNode,
  ProcurementDocumentFlowNodeType,
  PurchaseOrder,
} from "@/features/ergo/sap_sandbox/lib/procurementTypes";

function PurchaseOrderDetailInner() {
  const {
    t,
    purchaseOrderStatus,
    goodsReceiptStatus,
    invoiceReceiptStatus,
    accountingDocumentStatus,
    errorMessage,
  } = useSapI18n();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const {
    canWritePurchaseOrder,
    canPostGoodsReceipt,
    canPostInvoiceReceipt,
    canReadAp,
  } = useAuth();

  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [flowNodes, setFlowNodes] = useState<ProcurementDocumentFlowNode[]>(
    [],
  );
  const [flowError, setFlowError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const reload = async () => {
    setLoading(true);
    setError(null);
    setFlowError(null);
    try {
      const [po, flow] = await Promise.all([
        getPurchaseOrder(id),
        getPurchaseOrderDocumentFlow(id).catch((err) => {
          setFlowError(err);
          return { purchaseOrderId: id, nodes: [] };
        }),
      ]);
      setOrder(po);
      setFlowNodes(flow?.nodes ?? []);
    } catch (err) {
      setError(err);
      setOrder(null);
      setFlowNodes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const editable = canWritePurchaseOrder && canEditPo(order);
  const cancellable = canWritePurchaseOrder && canCancelPo(order);
  const cancelBlocked =
    canWritePurchaseOrder &&
    order?.status === "Open" &&
    !canCancelPo(order);
  const receivable = canPostGoodsReceipt && canReceivePo(order);
  const invoiceable =
    INVOICE_RECEIPTS_UI_ENABLED &&
    canPostInvoiceReceipt &&
    canInvoicePo(order);

  const flowTypeLabel = (type: ProcurementDocumentFlowNodeType) => {
    switch (type) {
      case "PurchaseOrder":
        return t("purchaseOrders.detail.flow.type.PurchaseOrder");
      case "GoodsReceipt":
        return t("purchaseOrders.detail.flow.type.GoodsReceipt");
      case "InvoiceReceipt":
        return t("purchaseOrders.detail.flow.type.InvoiceReceipt");
      case "AccountingDocumentAp":
        return t("finance.flow.AccountingDocumentAp");
      default:
        return type;
    }
  };

  const flowStatusLabel = (node: ProcurementDocumentFlowNode) => {
    if (node.type === "GoodsReceipt") {
      return goodsReceiptStatus(node.status, node.statusLabel);
    }
    if (node.type === "InvoiceReceipt") {
      return invoiceReceiptStatus(node.status, node.statusLabel);
    }
    if (node.type === "AccountingDocumentAp") {
      return accountingDocumentStatus(node.status, node.statusLabel);
    }
    return purchaseOrderStatus(node.status, node.statusLabel);
  };

  const onCancel = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      const next = await cancelPurchaseOrder(order.id);
      setOrder(next);
      setCancelOpen(false);
      toast.success(t("purchaseOrders.detail.toast.cancelled"));
      void reload();
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
        {t("purchaseOrders.detail.loading")}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <ApiErrorBanner error={error} />
        <Link
          href={PURCHASE_ORDERS_ROUTE}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {t("common.backToList")}
        </Link>
      </div>
    );
  }

  const emDash = t("common.emDash");
  const lines = order.lines ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-mono text-xl font-semibold tracking-tight">
              {order.number}
            </h2>
            <PurchaseOrderStatusBadge
              status={order.status}
              label={purchaseOrderStatus(order.status, order.statusLabel)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {t("purchaseOrders.detail.meta.org")} {order.purchasingOrgCode} ·{" "}
            {t("purchaseOrders.detail.meta.vendor")} {order.vendorCode} ·{" "}
            {t("purchaseOrders.detail.meta.plant")} {order.plantCode} ·{" "}
            {t("purchaseOrders.detail.meta.currency")} {order.currency}
          </p>
          {order.remark ? (
            <p className="text-sm text-muted-foreground">
              {t("common.remark")}: {order.remark}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={PURCHASE_ORDERS_ROUTE}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {t("common.list")}
          </Link>
          {editable ? (
            <Link
              href={`${PURCHASE_ORDERS_ROUTE}/${order.id}/edit`}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              {t("purchaseOrders.detail.actions.edit")}
            </Link>
          ) : null}
          {receivable ? (
            <Link
              href={`${GOODS_RECEIPTS_ROUTE}/new?purchaseOrderId=${order.id}`}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              {t("purchaseOrders.detail.actions.receive")}
            </Link>
          ) : null}
          {invoiceable ? (
            <Link
              href={`${INVOICE_RECEIPTS_ROUTE}/new?purchaseOrderId=${order.id}`}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              {t("purchaseOrders.detail.actions.invoice")}
            </Link>
          ) : null}
          {canWritePurchaseOrder ? (
            <Button
              size="sm"
              variant="destructive"
              disabled={!cancellable}
              title={
                cancelBlocked
                  ? t("purchaseOrders.detail.cancel.blocked")
                  : undefined
              }
              onClick={() => setCancelOpen(true)}
            >
              {t("purchaseOrders.detail.actions.cancel")}
            </Button>
          ) : null}
        </div>
      </div>

      <ApiErrorBanner error={error} />

      <section className="space-y-3">
        <h3 className="text-base font-medium">
          {t("purchaseOrders.detail.lines.title")}
        </h3>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {t("purchaseOrders.detail.lines.lineNumber")}
                </TableHead>
                <TableHead>{t("common.material")}</TableHead>
                <TableHead className="text-right">
                  {t("purchaseOrders.detail.lines.ordered")}
                </TableHead>
                <TableHead className="text-right">
                  {t("purchaseOrders.detail.lines.received")}
                </TableHead>
                <TableHead className="text-right">
                  {t("purchaseOrders.detail.lines.invoiced")}
                </TableHead>
                <TableHead className="text-right">
                  {t("purchaseOrders.detail.lines.invoiceable")}
                </TableHead>
                <TableHead className="text-right">
                  {t("purchaseOrders.detail.lines.remaining")}
                </TableHead>
                <TableHead>{t("purchaseOrders.detail.lines.unit")}</TableHead>
                <TableHead className="text-right">
                  {t("purchaseOrders.detail.lines.unitPrice")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-muted-foreground">
                    {t("purchaseOrders.detail.lines.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>{line.lineNumber}</TableCell>
                    <TableCell className="font-medium">
                      {line.materialCode}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {line.orderedQty}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {line.receivedQty}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {normalizeInvoicedQty(line)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {invoiceableQty(line)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {remainingQty(line)}
                    </TableCell>
                    <TableCell>{line.unit}</TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {line.unitPrice}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-base font-medium">
            {t("purchaseOrders.detail.flow.title")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("purchaseOrders.detail.flow.hint")}
          </p>
        </div>
        <ApiErrorBanner error={flowError} />
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>
                  {t("purchaseOrders.detail.flow.occurredAt")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flowNodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    {t("purchaseOrders.detail.flow.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                flowNodes.map((node) => {
                  const apClickable =
                    node.type === "AccountingDocumentAp" &&
                    isFinanceAccountingUiEnabled() &&
                    canReadAp;
                  const linkable =
                    node.type !== "AccountingDocumentAp" || apClickable;
                  return (
                  <TableRow key={`${node.type}-${node.id}`}>
                    <TableCell>{flowStatusLabel(node)}</TableCell>
                    <TableCell>{flowTypeLabel(node.type)}</TableCell>
                    <TableCell>
                      {linkable ? (
                        <Link
                          href={procurementFlowNodeHref(node)}
                          className="font-mono text-primary underline-offset-4 hover:underline"
                        >
                          {node.number}
                        </Link>
                      ) : (
                        <span className="font-mono text-muted-foreground">
                          {node.number}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {node.occurredAt
                        ? new Date(node.occurredAt).toLocaleString()
                        : emDash}
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
            <DialogTitle>
              {t("purchaseOrders.detail.cancel.title")}
            </DialogTitle>
            <DialogDescription>
              {t("purchaseOrders.detail.cancel.body")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={cancelling}
              onClick={() => void onCancel()}
            >
              {t("purchaseOrders.detail.cancel.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PurchaseOrderDetailPage() {
  return (
    <RequireAuth>
      <PurchaseOrderDetailInner />
    </RequireAuth>
  );
}
