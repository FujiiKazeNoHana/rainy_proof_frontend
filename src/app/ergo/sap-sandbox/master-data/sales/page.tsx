"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/shared/lib/api-client";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
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
import {
  getCustomer,
  getMaterial,
  listCustomers,
  listMaterials,
  listPlants,
  listSalesOrganizations,
} from "@/features/ergo/sap_sandbox/api/masterData";
import { ApiErrorBanner } from "@/features/ergo/sap_sandbox/components/ApiErrorBanner";
import { RequireAuth } from "@/features/ergo/sap_sandbox/components/RequireAuth";
import { useSapI18n } from "@/features/ergo/sap_sandbox/i18n";
import type {
  CodeNameItem,
  MaterialListItem,
} from "@/features/ergo/sap_sandbox/lib/masterDataTypes";

const DEFAULT_SALES_ORG = "1000";

type Entity = "salesOrgs" | "plants" | "customers" | "materials";

type DetailState =
  | { kind: "codeName"; item: CodeNameItem }
  | { kind: "material"; item: MaterialListItem }
  | null;

function SalesMasterDataPageInner() {
  const { t, errorMessage } = useSapI18n();
  const [entity, setEntity] = useState<Entity>("salesOrgs");
  const [salesOrg, setSalesOrg] = useState(DEFAULT_SALES_ORG);
  const [orgOptions, setOrgOptions] = useState<CodeNameItem[]>([]);
  const [rows, setRows] = useState<(CodeNameItem | MaterialListItem)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [detail, setDetail] = useState<DetailState>(null);
  const [detailBusy, setDetailBusy] = useState(false);

  const needsSalesOrg = entity === "customers" || entity === "materials";

  useEffect(() => {
    void listSalesOrganizations()
      .then((data) => setOrgOptions(data ?? []))
      .catch(() => setOrgOptions([]));
  }, []);

  const load = useCallback(async () => {
    if (needsSalesOrg && !salesOrg.trim()) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let data: (CodeNameItem | MaterialListItem)[] = [];
      if (entity === "salesOrgs") {
        data = await listSalesOrganizations();
      } else if (entity === "plants") {
        data = await listPlants();
      } else if (entity === "customers") {
        data = await listCustomers(salesOrg.trim());
      } else {
        data = await listMaterials(salesOrg.trim());
      }
      setRows(data ?? []);
    } catch (err) {
      setError(err);
      setRows([]);
      if (err instanceof ApiError && err.status === 403) {
        toast.error(t("errors.http.forbiddenMasterDataView"));
      } else if (err instanceof ApiError) {
        toast.error(errorMessage(err.errorCode, err.message));
      }
    } finally {
      setLoading(false);
    }
  }, [entity, errorMessage, needsSalesOrg, salesOrg, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const onEntityChange = (next: Entity) => {
    setEntity(next);
    setRows([]);
    setDetail(null);
  };

  const onSalesOrgChange = (value: string) => {
    setSalesOrg(value);
    if (needsSalesOrg) {
      setRows([]);
      setDetail(null);
    }
  };

  const openDetail = async (code: string) => {
    if (entity === "salesOrgs" || entity === "plants") {
      const row = rows.find((r) => r.code === code);
      if (row) setDetail({ kind: "codeName", item: row });
      return;
    }
    setDetailBusy(true);
    try {
      if (entity === "customers") {
        const item = await getCustomer(code);
        setDetail({ kind: "codeName", item });
      } else {
        const item = await getMaterial(code);
        setDetail({ kind: "material", item });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(errorMessage(err.errorCode, err.message));
      }
    } finally {
      setDetailBusy(false);
    }
  };

  const showBaseUnit = entity === "materials";
  const colSpan = showBaseUnit ? 5 : 4;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("masterData.sales.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("masterData.sales.hint")}
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={() => void load()}>
          {t("masterData.common.refresh")}
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <Label>{t("masterData.sales.entity")}</Label>
          <Select
            value={entity}
            onValueChange={(v) => {
              if (!v) return;
              onEntityChange(v as Entity);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="salesOrgs">
                {t("masterData.sales.entity.salesOrgs")}
              </SelectItem>
              <SelectItem value="plants">
                {t("masterData.sales.entity.plants")}
              </SelectItem>
              <SelectItem value="customers">
                {t("masterData.sales.entity.customers")}
              </SelectItem>
              <SelectItem value="materials">
                {t("masterData.sales.entity.materials")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {needsSalesOrg ? (
          <div className="grid gap-1.5">
            <Label>{t("masterData.sales.filter.salesOrg")}</Label>
            <Select
              value={salesOrg}
              onValueChange={(v) => {
                if (!v) return;
                onSalesOrgChange(v);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {orgOptions.length === 0 ? (
                  <SelectItem value={DEFAULT_SALES_ORG}>
                    {DEFAULT_SALES_ORG}
                  </SelectItem>
                ) : (
                  orgOptions.map((o) => (
                    <SelectItem key={o.code} value={o.code}>
                      {o.code} — {o.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      {needsSalesOrg && !salesOrg.trim() ? (
        <p className="text-sm text-muted-foreground">
          {t("masterData.sales.filter.salesOrgRequired")}
        </p>
      ) : null}

      <ApiErrorBanner error={error} />

      {loading ? (
        <p className="text-sm text-muted-foreground">
          {t("masterData.common.loading")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("masterData.common.code")}</TableHead>
                <TableHead>{t("masterData.common.name")}</TableHead>
                {showBaseUnit ? (
                  <TableHead>{t("masterData.common.baseUnit")}</TableHead>
                ) : null}
                <TableHead>{t("masterData.common.active")}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={colSpan}
                    className="text-muted-foreground"
                  >
                    {t("masterData.common.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.code}>
                    <TableCell className="font-medium">{row.code}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    {showBaseUnit ? (
                      <TableCell>
                        {"baseUnit" in row ? row.baseUnit : "—"}
                      </TableCell>
                    ) : null}
                    <TableCell>
                      {row.isActive
                        ? t("masterData.common.yes")
                        : t("masterData.common.no")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={detailBusy}
                        onClick={() => void openDetail(row.code)}
                      >
                        {t("masterData.common.detail")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={detail != null}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("masterData.common.detail")}</DialogTitle>
          </DialogHeader>
          {detail ? (
            <dl className="grid gap-2 text-sm">
              <div className="grid grid-cols-[8rem_1fr] gap-2">
                <dt className="text-muted-foreground">
                  {t("masterData.common.code")}
                </dt>
                <dd className="font-medium">{detail.item.code}</dd>
              </div>
              <div className="grid grid-cols-[8rem_1fr] gap-2">
                <dt className="text-muted-foreground">
                  {t("masterData.common.name")}
                </dt>
                <dd>{detail.item.name}</dd>
              </div>
              {detail.kind === "material" ? (
                <div className="grid grid-cols-[8rem_1fr] gap-2">
                  <dt className="text-muted-foreground">
                    {t("masterData.common.baseUnit")}
                  </dt>
                  <dd>{detail.item.baseUnit}</dd>
                </div>
              ) : null}
              <div className="grid grid-cols-[8rem_1fr] gap-2">
                <dt className="text-muted-foreground">
                  {t("masterData.common.active")}
                </dt>
                <dd>
                  {detail.item.isActive
                    ? t("masterData.common.active")
                    : t("masterData.common.inactive")}
                </dd>
              </div>
            </dl>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDetail(null)}>
              {t("masterData.common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SalesMasterDataPage() {
  return (
    <RequireAuth>
      <SalesMasterDataPageInner />
    </RequireAuth>
  );
}
