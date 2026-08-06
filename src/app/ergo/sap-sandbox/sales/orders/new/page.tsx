"use client";

import { useEffect, useRef, useState } from "react";
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
import { useSalesOrderMasterData } from "@/features/ergo/sap_sandbox/hooks/useSalesOrderMasterData";
import { SALES_ORDERS_ROUTE } from "@/features/ergo/sap_sandbox/constants";
import { useSapI18n } from "@/features/ergo/sap_sandbox/i18n";
import { CURRENCIES } from "@/features/ergo/sap_sandbox/lib/masterDataStub";

function NewOrderInner() {
  const { t, errorMessage } = useSapI18n();
  const router = useRouter();
  const { canWriteSales } = useAuth();
  const [salesOrgCode, setSalesOrgCode] = useState("");
  const [customerCode, setCustomerCode] = useState("");
  const [requestedDeliveryDate, setRequestedDeliveryDate] = useState("");
  const [currency, setCurrency] = useState<string>(CURRENCIES[0]);
  const [remark, setRemark] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const seededOrg = useRef(false);

  const {
    salesOrgs,
    plants,
    customers,
    materials,
    loading,
    loadingCascade,
    error: mdError,
    source,
  } = useSalesOrderMasterData(salesOrgCode);

  useEffect(() => {
    if (seededOrg.current) return;
    if (salesOrgs.length === 0) return;
    seededOrg.current = true;
    setSalesOrgCode(salesOrgs[0].code);
  }, [salesOrgs]);

  useEffect(() => {
    if (!salesOrgCode || loadingCascade) return;
    setCustomerCode((prev) =>
      customers.some((c) => c.code === prev)
        ? prev
        : (customers[0]?.code ?? ""),
    );
    setLines((prev) => {
      const material = materials[0];
      const plant = plants[0];
      if (prev.length === 0) {
        if (!material || !plant) return prev;
        return createEmptyLines(1, {
          materialCode: material.code,
          unit: material.baseUnit,
          plantCode: plant.code,
        });
      }
      return prev.map((line) => {
        const materialOk = materials.some((m) => m.code === line.materialCode);
        const plantOk = plants.some((p) => p.code === line.plantCode);
        const nextMaterial = materialOk
          ? materials.find((m) => m.code === line.materialCode)!
          : materials[0];
        return {
          ...line,
          materialCode: nextMaterial?.code ?? "",
          unit: nextMaterial?.baseUnit ?? line.unit,
          plantCode: plantOk ? line.plantCode : (plant?.code ?? ""),
        };
      });
    });
  }, [salesOrgCode, customers, materials, plants, loadingCascade]);

  if (!canWriteSales) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t("orders.new.noWritePermission")}
        </p>
        <Link
          href={SALES_ORDERS_ROUTE}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {t("common.backToList")}
        </Link>
      </div>
    );
  }

  const onSalesOrgChange = (code: string) => {
    setSalesOrgCode(code);
    setCustomerCode("");
    setLines([]);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salesOrgCode || !customerCode) {
      toast.error(t("orders.new.toast.selectOrgAndCustomer"));
      return;
    }
    if (lines.length === 0) {
      toast.error(t("orders.new.toast.atLeastOneLine"));
      return;
    }
    if (lines.some((l) => !l.materialCode || !l.plantCode)) {
      toast.error(t("orders.new.toast.completeLineMaterialPlant"));
      return;
    }
    if (lines.some((l) => !l.orderedQty || l.orderedQty <= 0)) {
      toast.error(t("orders.new.toast.qtyMustBePositive"));
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
      toast.success(t("orders.new.toast.created", { number: order.number }));
      router.replace(`${SALES_ORDERS_ROUTE}/${order.id}`);
    } catch (err) {
      setError(err);
      if (err instanceof ApiError) {
        toast.error(errorMessage(err.errorCode, err.message));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => void onSubmit(e)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("orders.new.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {source === "api"
              ? t("orders.new.hint.api")
              : t("orders.new.hint.stub")}
          </p>
        </div>
        <Link
          href={SALES_ORDERS_ROUTE}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          {t("common.cancel")}
        </Link>
      </div>

      <ApiErrorBanner error={error ?? (source === "stub" ? mdError : null)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="salesOrg">{t("orders.new.field.salesOrg")}</Label>
          <select
            id="salesOrg"
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
            value={salesOrgCode}
            disabled={loading && salesOrgs.length === 0}
            onChange={(e) => onSalesOrgChange(e.target.value)}
          >
            {salesOrgs.length === 0 ? (
              <option value="">{t("common.loading")}</option>
            ) : (
              salesOrgs.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.code} · {o.name}
                </option>
              ))
            )}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="customer">{t("orders.new.field.customer")}</Label>
          <select
            id="customer"
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
            value={customerCode}
            disabled={loadingCascade || customers.length === 0}
            onChange={(e) => setCustomerCode(e.target.value)}
          >
            {customers.length === 0 ? (
              <option value="">
                {loadingCascade
                  ? t("orders.new.loadingCustomers")
                  : t("orders.new.noCustomers")}
              </option>
            ) : (
              customers.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} · {c.name}
                </option>
              ))
            )}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="deliveryDate">
            {t("orders.new.field.requestedDeliveryDate")}
          </Label>
          <Input
            id="deliveryDate"
            type="date"
            value={requestedDeliveryDate}
            onChange={(e) => setRequestedDeliveryDate(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="currency">{t("orders.new.field.currency")}</Label>
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
        <Button type="submit" disabled={busy || loading}>
          {busy ? t("orders.new.submitting") : t("orders.new.submit")}
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
