"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ApiError } from "@/shared/lib/api-client";
import { Button, buttonVariants } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/utils";
import { listMovements } from "@/features/ergo/sap_sandbox/api/inventory";
import { ApiErrorBanner } from "@/features/ergo/sap_sandbox/components/ApiErrorBanner";
import { RequireAuth } from "@/features/ergo/sap_sandbox/components/RequireAuth";
import { INVENTORY_STOCK_ROUTE } from "@/features/ergo/sap_sandbox/constants";
import { useSapI18n } from "@/features/ergo/sap_sandbox/i18n";
import type { StockMovement } from "@/features/ergo/sap_sandbox/lib/inventoryTypes";

function MovementsPageInner() {
  const { t, movementType, errorMessage } = useSapI18n();
  const [materialCode, setMaterialCode] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [take, setTake] = useState("50");
  const [items, setItems] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const takeNum = Number(take);
      const data = await listMovements({
        materialCode: materialCode.trim() || undefined,
        movementType: typeFilter === "all" ? undefined : typeFilter,
        take: Number.isFinite(takeNum) ? takeNum : 50,
      });
      setItems(data ?? []);
    } catch (err) {
      setError(err);
      setItems([]);
      if (err instanceof ApiError) {
        if (err.status === 403) {
          toast.error(t("errors.http.forbiddenInventoryView"));
        } else {
          toast.error(errorMessage(err.errorCode, err.message));
        }
      }
    } finally {
      setLoading(false);
    }
  }, [materialCode, typeFilter, take, t, errorMessage]);

  useEffect(() => {
    void load();
  }, [load]);

  const emDash = t("common.emDash");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("inventory.movements.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("inventory.movements.hint")}
          </p>
        </div>
        <Link
          href={INVENTORY_STOCK_ROUTE}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {t("inventory.movements.linkStock")}
        </Link>
      </div>

      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <div className="grid gap-1.5">
          <Label htmlFor="mv-mat">
            {t("inventory.movements.filter.material")}
          </Label>
          <Input
            id="mv-mat"
            className="w-36"
            value={materialCode}
            onChange={(e) => setMaterialCode(e.target.value)}
            placeholder="FG-100"
          />
        </div>
        <div className="grid gap-1.5">
          <Label>{t("inventory.movements.filter.type")}</Label>
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v ?? "all")}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("inventory.movements.filter.typeAll")}
              </SelectItem>
              <SelectItem value="GI">{movementType("GI")}</SelectItem>
              <SelectItem value="GR">{movementType("GR")}</SelectItem>
              <SelectItem value="ADJ">{movementType("ADJ")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="mv-take">
            {t("inventory.movements.filter.take")}
          </Label>
          <Input
            id="mv-take"
            className="w-24"
            type="number"
            min={1}
            max={200}
            value={take}
            onChange={(e) => setTake(e.target.value)}
          />
        </div>
        <Button type="submit" variant="secondary">
          {t("inventory.movements.filter.submit")}
        </Button>
      </form>

      <ApiErrorBanner error={error} />

      {loading ? (
        <p className="text-sm text-muted-foreground">
          {t("inventory.movements.loading")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("inventory.movements.col.postedAt")}</TableHead>
                <TableHead>{t("inventory.movements.col.type")}</TableHead>
                <TableHead>{t("inventory.movements.col.material")}</TableHead>
                <TableHead>{t("inventory.movements.col.plant")}</TableHead>
                <TableHead>
                  {t("inventory.movements.col.storageLocation")}
                </TableHead>
                <TableHead className="text-right">
                  {t("inventory.movements.col.delta")}
                </TableHead>
                <TableHead>{t("inventory.movements.col.unit")}</TableHead>
                <TableHead>{t("inventory.movements.col.reference")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-muted-foreground">
                    {t("inventory.movements.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {row.postedAt
                        ? new Date(row.postedAt).toLocaleString()
                        : emDash}
                    </TableCell>
                    <TableCell>{movementType(row.movementType)}</TableCell>
                    <TableCell className="font-medium">
                      {row.materialCode}
                    </TableCell>
                    <TableCell>{row.plantCode}</TableCell>
                    <TableCell>{row.storageLocationCode}</TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {row.quantityDelta}
                    </TableCell>
                    <TableCell>{row.unit}</TableCell>
                    <TableCell>
                      {row.referenceDocument?.trim() || emDash}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default function InventoryMovementsPage() {
  return (
    <RequireAuth>
      <MovementsPageInner />
    </RequireAuth>
  );
}
