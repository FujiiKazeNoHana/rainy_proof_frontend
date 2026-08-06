"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { adjustStock, listStock } from "@/features/ergo/sap_sandbox/api/inventory";
import { ApiErrorBanner } from "@/features/ergo/sap_sandbox/components/ApiErrorBanner";
import { RequireAuth } from "@/features/ergo/sap_sandbox/components/RequireAuth";
import {
  INVENTORY_MOVEMENTS_ROUTE,
  INVENTORY_STOCK_ROUTE,
} from "@/features/ergo/sap_sandbox/constants";
import { useSapI18n } from "@/features/ergo/sap_sandbox/i18n";
import type { StockBalance } from "@/features/ergo/sap_sandbox/lib/inventoryTypes";

const SEED = {
  materialCode: "FG-100",
  plantCode: "1000",
  storageLocationCode: "0001",
  unit: "EA",
} as const;

type AdjustDraft = {
  materialCode: string;
  plantCode: string;
  storageLocationCode: string;
  quantityDelta: string;
  unit: string;
  referenceDocument: string;
};

function emptyDraft(): AdjustDraft {
  return {
    materialCode: SEED.materialCode,
    plantCode: SEED.plantCode,
    storageLocationCode: SEED.storageLocationCode,
    quantityDelta: "10",
    unit: SEED.unit,
    referenceDocument: "",
  };
}

function StockPageInner() {
  const { t, errorMessage } = useSapI18n();
  const { canAdjustInventory } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [materialCode, setMaterialCode] = useState(
    () => searchParams.get("materialCode") ?? "",
  );
  const [plantCode, setPlantCode] = useState(
    () => searchParams.get("plantCode") ?? "",
  );
  const [storageLocationCode, setStorageLocationCode] = useState(
    () => searchParams.get("storageLocationCode") ?? "",
  );
  const [items, setItems] = useState<StockBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [draft, setDraft] = useState<AdjustDraft>(emptyDraft);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listStock({
        materialCode: materialCode.trim() || undefined,
        plantCode: plantCode.trim() || undefined,
        storageLocationCode: storageLocationCode.trim() || undefined,
      });
      setItems(data ?? []);
    } catch (err) {
      setError(err);
      setItems([]);
      if (err instanceof ApiError && err.status === 403) {
        toast.error(t("errors.http.forbiddenInventoryView"));
      }
    } finally {
      setLoading(false);
    }
  }, [materialCode, plantCode, storageLocationCode, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!canAdjustInventory) return;
    if (searchParams.get("adjust") === "1") {
      setDraft(emptyDraft());
      setAdjustOpen(true);
    }
  }, [canAdjustInventory, searchParams]);

  const openAdjust = (row?: StockBalance) => {
    if (!canAdjustInventory) return;
    setDraft(
      row
        ? {
            materialCode: row.materialCode,
            plantCode: row.plantCode,
            storageLocationCode: row.storageLocationCode,
            quantityDelta: "10",
            unit: row.unit,
            referenceDocument: "",
          }
        : emptyDraft(),
    );
    setAdjustOpen(true);
  };

  const closeAdjust = () => {
    setAdjustOpen(false);
    setConfirmOpen(false);
    if (searchParams.get("adjust") === "1") {
      router.replace(INVENTORY_STOCK_ROUTE);
    }
  };

  const parsedDelta = Number(draft.quantityDelta);

  const trySubmitAdjust = () => {
    if (
      !draft.materialCode.trim() ||
      !draft.plantCode.trim() ||
      !draft.storageLocationCode.trim()
    ) {
      toast.error(t("inventory.adjust.toast.fieldsRequired"));
      return;
    }
    if (!draft.unit.trim()) {
      toast.error(t("inventory.adjust.toast.unitRequired"));
      return;
    }
    if (!Number.isFinite(parsedDelta) || parsedDelta === 0) {
      toast.error(t("inventory.adjust.toast.deltaRequired"));
      return;
    }
    if (parsedDelta < 0) {
      setConfirmOpen(true);
      return;
    }
    void submitAdjust();
  };

  const submitAdjust = async () => {
    setBusy(true);
    try {
      const snap = await adjustStock({
        materialCode: draft.materialCode.trim(),
        plantCode: draft.plantCode.trim(),
        storageLocationCode: draft.storageLocationCode.trim(),
        quantityDelta: parsedDelta,
        unit: draft.unit.trim(),
        referenceDocument: draft.referenceDocument.trim() || null,
      });
      toast.success(
        t("inventory.adjust.toast.success", {
          quantity: snap.quantity,
          unit: snap.unit,
        }),
      );
      closeAdjust();
      await load();
    } catch (err) {
      setError(err);
      if (err instanceof ApiError) {
        if (err.status === 403) {
          toast.error(t("inventory.adjust.toast.forbidden"));
        } else {
          toast.error(errorMessage(err.errorCode, err.message));
        }
      }
    } finally {
      setBusy(false);
      setConfirmOpen(false);
    }
  };

  const emDash = t("common.emDash");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("inventory.stock.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("inventory.stock.hint")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={INVENTORY_MOVEMENTS_ROUTE}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            {t("inventory.stock.linkMovements")}
          </Link>
          {canAdjustInventory ? (
            <Button type="button" onClick={() => openAdjust()}>
              {t("inventory.stock.adjust")}
            </Button>
          ) : null}
        </div>
      </div>

      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <div className="grid gap-1.5">
          <Label htmlFor="stock-mat">
            {t("inventory.stock.filter.material")}
          </Label>
          <Input
            id="stock-mat"
            className="w-36"
            value={materialCode}
            onChange={(e) => setMaterialCode(e.target.value)}
            placeholder="FG-100"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="stock-plant">
            {t("inventory.stock.filter.plant")}
          </Label>
          <Input
            id="stock-plant"
            className="w-28"
            value={plantCode}
            onChange={(e) => setPlantCode(e.target.value)}
            placeholder="1000"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="stock-sloc">
            {t("inventory.stock.filter.storageLocation")}
          </Label>
          <Input
            id="stock-sloc"
            className="w-28"
            value={storageLocationCode}
            onChange={(e) => setStorageLocationCode(e.target.value)}
            placeholder="0001"
          />
        </div>
        <Button type="submit" variant="secondary">
          {t("inventory.stock.filter.submit")}
        </Button>
      </form>

      <ApiErrorBanner error={error} />

      {loading ? (
        <p className="text-sm text-muted-foreground">
          {t("inventory.stock.loading")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("inventory.stock.col.material")}</TableHead>
                <TableHead>{t("inventory.stock.col.plant")}</TableHead>
                <TableHead>
                  {t("inventory.stock.col.storageLocation")}
                </TableHead>
                <TableHead className="text-right">
                  {t("inventory.stock.col.quantity")}
                </TableHead>
                <TableHead>{t("inventory.stock.col.unit")}</TableHead>
                <TableHead>{t("inventory.stock.col.updatedAt")}</TableHead>
                {canAdjustInventory ? <TableHead /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={canAdjustInventory ? 7 : 6}
                    className="text-muted-foreground"
                  >
                    {t("inventory.stock.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      {row.materialCode}
                    </TableCell>
                    <TableCell>{row.plantCode}</TableCell>
                    <TableCell>{row.storageLocationCode}</TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {row.quantity}
                    </TableCell>
                    <TableCell>{row.unit}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.updatedAt
                        ? new Date(row.updatedAt).toLocaleString()
                        : emDash}
                    </TableCell>
                    {canAdjustInventory ? (
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => openAdjust(row)}
                        >
                          {t("inventory.stock.adjustRow")}
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={adjustOpen}
        onOpenChange={(open) => {
          if (!open) closeAdjust();
          else setAdjustOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("inventory.adjust.title")}</DialogTitle>
            <DialogDescription>{t("inventory.adjust.hint")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="adj-mat">
                {t("inventory.adjust.field.material")}
              </Label>
              <Input
                id="adj-mat"
                value={draft.materialCode}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, materialCode: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="adj-plant">
                  {t("inventory.adjust.field.plant")}
                </Label>
                <Input
                  id="adj-plant"
                  value={draft.plantCode}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, plantCode: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="adj-sloc">
                  {t("inventory.adjust.field.storageLocation")}
                </Label>
                <Input
                  id="adj-sloc"
                  value={draft.storageLocationCode}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      storageLocationCode: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="adj-delta">
                  {t("inventory.adjust.field.quantityDelta")}
                </Label>
                <Input
                  id="adj-delta"
                  type="number"
                  step="any"
                  value={draft.quantityDelta}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, quantityDelta: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="adj-unit">
                  {t("inventory.adjust.field.unit")}
                </Label>
                <Input
                  id="adj-unit"
                  value={draft.unit}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, unit: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="adj-ref">
                {t("inventory.adjust.field.reference")}
              </Label>
              <Input
                id="adj-ref"
                value={draft.referenceDocument}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    referenceDocument: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeAdjust}>
              {t("inventory.adjust.cancel")}
            </Button>
            <Button type="button" disabled={busy} onClick={trySubmitAdjust}>
              {busy
                ? t("inventory.adjust.submitting")
                : t("inventory.adjust.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("inventory.adjust.confirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("inventory.adjust.confirmBody")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
            >
              {t("inventory.adjust.cancel")}
            </Button>
            <Button type="button" disabled={busy} onClick={() => void submitAdjust()}>
              {t("inventory.adjust.confirmSubmit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function InventoryStockPage() {
  return (
    <RequireAuth>
      <Suspense
        fallback={
          <p className="p-4 text-sm text-muted-foreground">…</p>
        }
      >
        <StockPageInner />
      </Suspense>
    </RequireAuth>
  );
}
