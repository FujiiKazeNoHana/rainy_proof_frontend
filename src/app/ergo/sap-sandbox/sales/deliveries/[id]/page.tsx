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
  cancelDelivery,
  getDelivery,
  postGoodsIssue,
} from "@/features/ergo/sap_sandbox/api/deliveries";
import { ApiErrorBanner } from "@/features/ergo/sap_sandbox/components/ApiErrorBanner";
import { DeliveryStatusBadge } from "@/features/ergo/sap_sandbox/components/DeliveryStatusBadge";
import { RequireAuth } from "@/features/ergo/sap_sandbox/components/RequireAuth";
import {
  INVENTORY_STOCK_ROUTE,
  SALES_DELIVERIES_ROUTE,
  SALES_ORDERS_ROUTE,
} from "@/features/ergo/sap_sandbox/constants";
import { useSapI18n } from "@/features/ergo/sap_sandbox/i18n";
import {
  canCancelDelivery,
  canPostPgi,
} from "@/features/ergo/sap_sandbox/lib/deliveryRules";
import type { Delivery } from "@/features/ergo/sap_sandbox/lib/deliveryTypes";

function DeliveryDetailInner() {
  const { t, deliveryStatus, errorMessage } = useSapI18n();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { canWriteDelivery } = useAuth();

  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [pgiOpen, setPgiOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      setDelivery(await getDelivery(id));
    } catch (err) {
      setError(err);
      setDelivery(null);
      if (err instanceof ApiError && err.status === 404) {
        toast.error(t("deliveries.detail.toast.notFound"));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const showCancel =
    canWriteDelivery && delivery && canCancelDelivery(delivery.status);
  const showPgi =
    canWriteDelivery && delivery && canPostPgi(delivery.status);

  const mapDeliveryActionError = (err: ApiError, action: "cancel" | "pgi") => {
    toast.error(
      errorMessage(err.errorCode, err.message, { deliveryAction: action }),
    );
  };

  const onCancel = async () => {
    if (!delivery) return;
    setBusy(true);
    try {
      const next = await cancelDelivery(delivery.id, {
        version: delivery.version,
      });
      setDelivery(next);
      setCancelOpen(false);
      toast.success(t("deliveries.detail.toast.cancelled"));
    } catch (err) {
      setError(err);
      if (err instanceof ApiError) mapDeliveryActionError(err, "cancel");
    } finally {
      setBusy(false);
    }
  };

  const onPgi = async () => {
    if (!delivery) return;
    setBusy(true);
    try {
      const next = await postGoodsIssue(delivery.id, {
        version: delivery.version,
      });
      setDelivery(next);
      setPgiOpen(false);
      if (next.idempotentReplayed) {
        toast.message(t("deliveries.detail.toast.pgiIdempotentTitle"), {
          description: t("deliveries.detail.toast.pgiIdempotentDesc"),
        });
      } else {
        toast.success(t("deliveries.detail.toast.pgiSuccess"));
      }
    } catch (err) {
      setError(err);
      if (err instanceof ApiError) mapDeliveryActionError(err, "pgi");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        {t("deliveries.detail.loading")}
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="space-y-4">
        <ApiErrorBanner error={error} />
        <Link
          href={SALES_DELIVERIES_ROUTE}
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
              {delivery.number}
            </h2>
            <DeliveryStatusBadge
              status={delivery.status}
              label={deliveryStatus(delivery.status, delivery.statusLabel)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {t("deliveries.detail.meta.linkedOrder")}{" "}
            <Link
              href={`${SALES_ORDERS_ROUTE}/${delivery.salesOrderId}`}
              className="text-primary hover:underline"
            >
              {delivery.salesOrderNumber || delivery.salesOrderId}
            </Link>
            {t("deliveries.detail.meta.plantSloc", {
              plant: delivery.plantCode,
              sloc: delivery.storageLocationCode,
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={SALES_DELIVERIES_ROUTE}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {t("common.list")}
          </Link>
          {delivery.lines?.[0]?.materialCode ? (
            <Link
              href={`${INVENTORY_STOCK_ROUTE}?materialCode=${encodeURIComponent(delivery.lines[0].materialCode)}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              {t("deliveries.detail.linkStock")}
            </Link>
          ) : null}
          <Link
            href={`${SALES_ORDERS_ROUTE}/${delivery.salesOrderId}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {t("deliveries.detail.actions.salesOrder")}
          </Link>
          {showCancel ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setCancelOpen(true)}
            >
              {t("common.cancel")}
            </Button>
          ) : null}
          {showPgi ? (
            <Button size="sm" onClick={() => setPgiOpen(true)}>
              {delivery.status === "GoodsIssued"
                ? t("deliveries.detail.actions.postPgiAgain")
                : t("deliveries.detail.actions.postPgi")}
            </Button>
          ) : null}
        </div>
      </div>

      <ApiErrorBanner error={error} />

      <dl className="grid gap-3 text-sm sm:grid-cols-2 md:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">{t("common.version")}</dt>
          <dd className="font-mono">{delivery.version}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">
            {t("deliveries.detail.field.postedAt")}
          </dt>
          <dd>
            {delivery.postedAt
              ? new Date(delivery.postedAt).toLocaleString()
              : emDash}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">
            {t("deliveries.detail.field.cancelledAt")}
          </dt>
          <dd>
            {delivery.cancelledAt
              ? new Date(delivery.cancelledAt).toLocaleString()
              : emDash}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("common.created")}</dt>
          <dd>
            {delivery.createdBy || emDash} ·{" "}
            {delivery.createdAt
              ? new Date(delivery.createdAt).toLocaleString()
              : emDash}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("common.updated")}</dt>
          <dd>
            {delivery.updatedBy || emDash} ·{" "}
            {delivery.updatedAt
              ? new Date(delivery.updatedAt).toLocaleString()
              : emDash}
          </dd>
        </div>
        <div className="sm:col-span-2 md:col-span-3">
          <dt className="text-muted-foreground">{t("common.remark")}</dt>
          <dd>{delivery.remark || emDash}</dd>
        </div>
      </dl>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>{t("deliveries.detail.lines.soLine")}</TableHead>
              <TableHead>{t("common.material")}</TableHead>
              <TableHead className="text-right">
                {t("deliveries.detail.lines.quantity")}
              </TableHead>
              <TableHead>{t("common.plant")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(delivery.lines ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  {t("deliveries.detail.lines.empty")}
                </TableCell>
              </TableRow>
            ) : (
              (delivery.lines ?? []).map((line) => (
                <TableRow key={line.id || line.lineNo}>
                  <TableCell>{line.lineNo}</TableCell>
                  <TableCell>{line.salesOrderLineNo}</TableCell>
                  <TableCell>
                    <div className="font-mono text-xs">{line.materialCode}</div>
                    <div className="text-muted-foreground">
                      {line.materialDesc}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {line.quantity} {line.unit}
                  </TableCell>
                  <TableCell>{line.plantCode}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deliveries.detail.cancelDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("deliveries.detail.cancelDialog.body", {
                number: delivery.number,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelOpen(false)}
              disabled={busy}
            >
              {t("common.back")}
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => void onCancel()}
            >
              {t("deliveries.detail.cancelDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pgiOpen} onOpenChange={setPgiOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {delivery.status === "GoodsIssued"
                ? t("deliveries.detail.pgiDialog.titleRetry")
                : t("deliveries.detail.pgiDialog.titleFirst")}
            </DialogTitle>
            <DialogDescription>
              {t("deliveries.detail.pgiDialog.body", {
                number: delivery.number,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPgiOpen(false)}
              disabled={busy}
            >
              {t("common.back")}
            </Button>
            <Button disabled={busy} onClick={() => void onPgi()}>
              {t("deliveries.detail.pgiDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DeliveryDetailPage() {
  return (
    <RequireAuth>
      <DeliveryDetailInner />
    </RequireAuth>
  );
}
