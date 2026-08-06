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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/utils";
import {
  createDelivery,
  getDelivery,
  listOrderDeliveries,
} from "@/features/ergo/sap_sandbox/api/deliveries";
import { listPlants } from "@/features/ergo/sap_sandbox/api/masterData";
import { getSalesOrder } from "@/features/ergo/sap_sandbox/api/salesOrders";
import { ApiErrorBanner } from "@/features/ergo/sap_sandbox/components/ApiErrorBanner";
import { RequireAuth } from "@/features/ergo/sap_sandbox/components/RequireAuth";
import {
  SALES_DELIVERIES_ROUTE,
  SALES_ORDERS_ROUTE,
} from "@/features/ergo/sap_sandbox/constants";
import { useSapI18n } from "@/features/ergo/sap_sandbox/i18n";
import {
  canCreateFromOrderStatus,
  remainingDeliverableQty,
} from "@/features/ergo/sap_sandbox/lib/deliveryRules";
import type { CodeNameItem } from "@/features/ergo/sap_sandbox/lib/masterDataTypes";
import type { SalesOrder } from "@/features/ergo/sap_sandbox/lib/types";

type LineDraft = {
  selected: boolean;
  quantity: string;
};

function CreateDeliveryInner() {
  const { t, orderStatus, errorMessage } = useSapI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId")?.trim() ?? "";
  const { canWriteDelivery } = useAuth();

  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [plants, setPlants] = useState<CodeNameItem[]>([]);
  const [openReserved, setOpenReserved] = useState<Map<string, number>>(
    () => new Map(),
  );
  const [plantCode, setPlantCode] = useState("");
  const [storageLocationCode, setStorageLocationCode] = useState("0001");
  const [remark, setRemark] = useState("");
  const [lineDrafts, setLineDrafts] = useState<Record<string, LineDraft>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!canWriteDelivery) return;
    if (!orderId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [so, plantList, dns] = await Promise.all([
          getSalesOrder(orderId),
          listPlants(),
          listOrderDeliveries(orderId),
        ]);
        if (cancelled) return;

        const openDns = (dns ?? []).filter((d) => d.status === "Open");
        const details = await Promise.all(
          openDns.map((d) => getDelivery(d.id).catch(() => null)),
        );
        if (cancelled) return;

        const reserved = new Map<string, number>();
        for (const dn of details) {
          if (!dn?.lines) continue;
          for (const line of dn.lines) {
            const prev = reserved.get(line.salesOrderLineId) ?? 0;
            reserved.set(line.salesOrderLineId, prev + Number(line.quantity));
          }
        }

        const drafts: Record<string, LineDraft> = {};
        for (const line of so.lines ?? []) {
          const rem = remainingDeliverableQty(
            line.orderedQty,
            line.deliveredQty,
            reserved.get(line.id) ?? 0,
          );
          drafts[line.id] = {
            selected: false,
            quantity: rem > 0 ? String(rem) : "",
          };
        }

        const plantCodes = [
          ...new Set((so.lines ?? []).map((l) => l.plantCode).filter(Boolean)),
        ];
        setOrder(so);
        setPlants(plantList ?? []);
        setOpenReserved(reserved);
        setLineDrafts(drafts);
        setPlantCode(plantCodes[0] ?? "");
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
  }, [orderId, canWriteDelivery]);

  const plantOptions = useMemo(() => {
    const fromOrder = [
      ...new Set((order?.lines ?? []).map((l) => l.plantCode).filter(Boolean)),
    ];
    const codes = new Set(plants.map((p) => p.code));
    const extras = fromOrder.filter((c) => !codes.has(c));
    return [
      ...plants,
      ...extras.map((code) => ({ code, name: code })),
    ];
  }, [order, plants]);

  const visibleLines = useMemo(() => {
    if (!order?.lines) return [];
    if (!plantCode) return order.lines;
    return order.lines.filter((l) => l.plantCode === plantCode);
  }, [order, plantCode]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    const lines = visibleLines
      .filter((l) => lineDrafts[l.id]?.selected)
      .map((l) => ({
        salesOrderLineId: l.id,
        quantity: Number(lineDrafts[l.id]?.quantity),
        unit: l.unit,
      }));

    if (!plantCode.trim()) {
      toast.error(t("deliveries.new.toast.selectPlant"));
      return;
    }
    if (!storageLocationCode.trim()) {
      toast.error(t("deliveries.new.toast.storageLocationRequired"));
      return;
    }
    if (lines.length === 0) {
      toast.error(t("deliveries.new.toast.selectLinesWithQty"));
      return;
    }
    if (lines.some((l) => !(l.quantity > 0))) {
      toast.error(t("deliveries.new.toast.qtyMustBePositive"));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const created = await createDelivery({
        salesOrderId: order.id,
        plantCode: plantCode.trim(),
        storageLocationCode: storageLocationCode.trim(),
        remark: remark.trim() || null,
        lines,
      });
      toast.success(t("deliveries.new.toast.created"));
      router.push(`${SALES_DELIVERIES_ROUTE}/${created.id}`);
    } catch (err) {
      setError(err);
      if (err instanceof ApiError) {
        toast.error(errorMessage(err.errorCode, err.message));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!canWriteDelivery) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t("deliveries.new.noPermission")}
        </p>
        <Link
          href={SALES_DELIVERIES_ROUTE}
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
          {t("deliveries.new.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("deliveries.new.hintNoOrderId")}
        </p>
        <Link href={SALES_ORDERS_ROUTE} className={cn(buttonVariants())}>
          {t("deliveries.new.goToOrders")}
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        {t("deliveries.new.loadingOrder")}
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
          {t("deliveries.new.backToOrder")}
        </Link>
      </div>
    );
  }

  const deliverable = canCreateFromOrderStatus(order.status);

  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => void onSubmit(e)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("deliveries.new.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("deliveries.new.hintWithOrder", {
              number: order.number,
              status: orderStatus(order.status, order.statusLabel),
            })}
          </p>
        </div>
        <Link
          href={`${SALES_ORDERS_ROUTE}/${order.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          {t("deliveries.new.backToOrder")}
        </Link>
      </div>

      <ApiErrorBanner error={error} />

      {!deliverable ? (
        <p className="text-sm text-destructive">
          {t("deliveries.new.orderNotDeliverable")}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="plant">{t("common.plant")}</Label>
          <select
            id="plant"
            className="h-8 min-w-40 rounded-lg border border-input bg-transparent px-2 text-sm"
            value={plantCode}
            onChange={(e) => setPlantCode(e.target.value)}
            disabled={!deliverable}
          >
            <option value="">{t("common.selectPlaceholder")}</option>
            {plantOptions.map((p) => (
              <option key={p.code} value={p.code}>
                {p.code}
                {p.name && p.name !== p.code ? ` · ${p.name}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="sloc">{t("deliveries.new.field.storageLocation")}</Label>
          <Input
            id="sloc"
            className="w-28"
            value={storageLocationCode}
            onChange={(e) => setStorageLocationCode(e.target.value)}
            disabled={!deliverable}
          />
        </div>
        <div className="grid min-w-64 flex-1 gap-1.5">
          <Label htmlFor="remark">{t("common.remark")}</Label>
          <Input
            id="remark"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            disabled={!deliverable}
            maxLength={500}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                {t("deliveries.new.lines.select")}
              </TableHead>
              <TableHead>#</TableHead>
              <TableHead>{t("common.material")}</TableHead>
              <TableHead>{t("common.plant")}</TableHead>
              <TableHead className="text-right">
                {t("deliveries.new.lines.ordered")}
              </TableHead>
              <TableHead className="text-right">
                {t("deliveries.new.lines.delivered")}
              </TableHead>
              <TableHead className="text-right">
                {t("deliveries.new.lines.openReserved")}
              </TableHead>
              <TableHead className="text-right">
                {t("deliveries.new.lines.remaining")}
              </TableHead>
              <TableHead className="text-right">
                {t("deliveries.new.lines.thisQty")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleLines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-muted-foreground">
                  {plantCode
                    ? t("deliveries.new.lines.noLinesForPlant")
                    : t("deliveries.new.lines.empty")}
                </TableCell>
              </TableRow>
            ) : (
              visibleLines.map((line) => {
                const reserved = openReserved.get(line.id) ?? 0;
                const remaining = remainingDeliverableQty(
                  line.orderedQty,
                  line.deliveredQty,
                  reserved,
                );
                const draft = lineDrafts[line.id] ?? {
                  selected: false,
                  quantity: "",
                };
                const disabledRow = !deliverable || remaining <= 0;
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
                    <TableCell>{line.plantCode}</TableCell>
                    <TableCell className="text-right">
                      {line.orderedQty} {line.unit}
                    </TableCell>
                    <TableCell className="text-right">
                      {line.deliveredQty}
                    </TableCell>
                    <TableCell className="text-right">{reserved}</TableCell>
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
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={!deliverable || submitting}>
          {submitting ? t("deliveries.new.submitting") : t("deliveries.new.submit")}
        </Button>
        <Link
          href={`${SALES_ORDERS_ROUTE}/${order.id}`}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {t("common.cancel")}
        </Link>
      </div>
    </form>
  );
}

export default function CreateDeliveryPage() {
  const { t } = useSapI18n();

  return (
    <RequireAuth>
      <Suspense
        fallback={
          <div className="p-4 text-sm text-muted-foreground">
            {t("common.loading")}
          </div>
        }
      >
        <CreateDeliveryInner />
      </Suspense>
    </RequireAuth>
  );
}
