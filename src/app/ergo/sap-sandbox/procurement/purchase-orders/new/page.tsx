"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/shared/auth";
import { ApiError } from "@/shared/lib/api-client";
import { Button, buttonVariants } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/lib/utils";
import { createPurchaseOrder } from "@/features/ergo/sap_sandbox/api/purchaseOrders";
import { ApiErrorBanner } from "@/features/ergo/sap_sandbox/components/ApiErrorBanner";
import {
  createEmptyPoLines,
  PurchaseOrderLineEditor,
  type PoLineDraft,
} from "@/features/ergo/sap_sandbox/components/PurchaseOrderLineEditor";
import { RequireAuth } from "@/features/ergo/sap_sandbox/components/RequireAuth";
import { PURCHASE_ORDERS_ROUTE } from "@/features/ergo/sap_sandbox/constants";
import { usePurchaseOrderMasterData } from "@/features/ergo/sap_sandbox/hooks/usePurchaseOrderMasterData";
import { useSapI18n } from "@/features/ergo/sap_sandbox/i18n";

function NewPurchaseOrderInner() {
  const { t, errorMessage } = useSapI18n();
  const router = useRouter();
  const { canWritePurchaseOrder } = useAuth();
  const [purchasingOrgCode, setPurchasingOrgCode] = useState("");
  const [vendorCode, setVendorCode] = useState("");
  const [plantCode, setPlantCode] = useState("");
  const [remark, setRemark] = useState("");
  const [lines, setLines] = useState<PoLineDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const seededOrg = useRef(false);

  const {
    purchasingOrgs,
    plants,
    vendors,
    materials,
    loading,
    loadingVendors,
    error: mdError,
  } = usePurchaseOrderMasterData(purchasingOrgCode);

  useEffect(() => {
    if (seededOrg.current) return;
    if (purchasingOrgs.length === 0) return;
    seededOrg.current = true;
    setPurchasingOrgCode(purchasingOrgs[0].code);
  }, [purchasingOrgs]);

  useEffect(() => {
    if (plants.length === 0) return;
    setPlantCode((prev) =>
      plants.some((p) => p.code === prev) ? prev : plants[0].code,
    );
  }, [plants]);

  useEffect(() => {
    if (!purchasingOrgCode || loadingVendors) return;
    setVendorCode((prev) =>
      vendors.some((v) => v.code === prev) ? prev : (vendors[0]?.code ?? ""),
    );
  }, [purchasingOrgCode, vendors, loadingVendors]);

  useEffect(() => {
    if (loading || materials.length === 0) return;
    setLines((prev) => {
      if (prev.length > 0) return prev;
      const material = materials[0];
      return createEmptyPoLines(1, {
        materialCode: material.code,
        unit: material.baseUnit,
        unitPrice: 0,
      });
    });
  }, [loading, materials]);

  if (!canWritePurchaseOrder) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t("purchaseOrders.new.noWritePermission")}
        </p>
        <Link
          href={PURCHASE_ORDERS_ROUTE}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {t("common.backToList")}
        </Link>
      </div>
    );
  }

  const onPurchasingOrgChange = (code: string) => {
    setPurchasingOrgCode(code);
    setVendorCode("");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchasingOrgCode || !vendorCode || !plantCode) {
      toast.error(t("purchaseOrders.new.toast.selectHeader"));
      return;
    }
    if (lines.length === 0) {
      toast.error(t("purchaseOrders.new.toast.atLeastOneLine"));
      return;
    }
    if (lines.some((l) => !l.materialCode.trim() || !l.unit.trim())) {
      toast.error(t("purchaseOrders.new.toast.completeLine"));
      return;
    }
    if (lines.some((l) => !l.orderedQty || l.orderedQty <= 0)) {
      toast.error(t("purchaseOrders.new.toast.qtyMustBePositive"));
      return;
    }
    if (lines.some((l) => !Number.isFinite(l.unitPrice) || l.unitPrice < 0)) {
      toast.error(t("purchaseOrders.new.toast.priceRequired"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const order = await createPurchaseOrder({
        purchasingOrgCode,
        vendorCode,
        plantCode,
        remark: remark.trim() || null,
        lines: lines.map((l) => ({
          materialCode: l.materialCode.trim(),
          orderedQty: l.orderedQty,
          unit: l.unit.trim(),
          unitPrice: l.unitPrice,
        })),
      });
      toast.success(
        t("purchaseOrders.new.toast.created", { number: order.number }),
      );
      router.replace(`${PURCHASE_ORDERS_ROUTE}/${order.id}`);
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
            {t("purchaseOrders.new.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("purchaseOrders.new.hint")}
          </p>
        </div>
        <Link
          href={PURCHASE_ORDERS_ROUTE}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          {t("common.cancel")}
        </Link>
      </div>

      <ApiErrorBanner error={error ?? mdError} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="purchasingOrg">
            {t("purchaseOrders.new.field.purchasingOrg")}
          </Label>
          <select
            id="purchasingOrg"
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
            value={purchasingOrgCode}
            disabled={loading && purchasingOrgs.length === 0}
            onChange={(e) => onPurchasingOrgChange(e.target.value)}
          >
            {purchasingOrgs.length === 0 ? (
              <option value="">{t("common.loading")}</option>
            ) : (
              purchasingOrgs.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.code} · {o.name}
                </option>
              ))
            )}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="vendor">
            {t("purchaseOrders.new.field.vendor")}
          </Label>
          <select
            id="vendor"
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
            value={vendorCode}
            disabled={loadingVendors || vendors.length === 0}
            onChange={(e) => setVendorCode(e.target.value)}
          >
            {vendors.length === 0 ? (
              <option value="">
                {loadingVendors
                  ? t("purchaseOrders.new.loadingVendors")
                  : t("purchaseOrders.new.noVendors")}
              </option>
            ) : (
              vendors.map((v) => (
                <option key={v.code} value={v.code}>
                  {v.code} · {v.name}
                </option>
              ))
            )}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="plant">{t("purchaseOrders.new.field.plant")}</Label>
          <select
            id="plant"
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
            value={plantCode}
            disabled={plants.length === 0}
            onChange={(e) => setPlantCode(e.target.value)}
          >
            {plants.map((p) => (
              <option key={p.code} value={p.code}>
                {p.code} · {p.name}
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

      <PurchaseOrderLineEditor
        lines={lines}
        onChange={setLines}
        materials={materials}
      />

      <div className="flex gap-2">
        <Button type="submit" disabled={busy || loading}>
          {busy
            ? t("purchaseOrders.new.submitting")
            : t("purchaseOrders.new.submit")}
        </Button>
      </div>
    </form>
  );
}

export default function NewPurchaseOrderPage() {
  return (
    <RequireAuth>
      <NewPurchaseOrderInner />
    </RequireAuth>
  );
}
