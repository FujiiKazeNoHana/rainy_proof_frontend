"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/shared/auth";
import { ApiError } from "@/shared/lib/api-client";
import { Button, buttonVariants } from "@/shared/components/ui/button";
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
import { cn } from "@/shared/lib/utils";
import {
  getPurchasingOrganization,
  getVendor,
  listPurchasingOrganizations,
  listVendorPurchasingOrgs,
  listVendors,
} from "@/features/ergo/sap_sandbox/api/masterData";
import { ApiErrorBanner } from "@/features/ergo/sap_sandbox/components/ApiErrorBanner";
import { RequireAuth } from "@/features/ergo/sap_sandbox/components/RequireAuth";
import {
  FEATURE_LOGIN_ROUTE,
  FEATURE_ROUTE,
} from "@/features/ergo/sap_sandbox/constants";
import { useSapI18n } from "@/features/ergo/sap_sandbox/i18n";
import type { CodeNameItem } from "@/features/ergo/sap_sandbox/lib/masterDataTypes";

const DEFAULT_PURCHASING_ORG = "1000";

type VendorDetail = {
  item: CodeNameItem;
  purchasingOrgs: string[];
};

function ProcurementMasterDataPageInner() {
  const { t, errorMessage } = useSapI18n();
  const { canReadProcurementMasterData } = useAuth();

  const [purchasingOrg, setPurchasingOrg] = useState(DEFAULT_PURCHASING_ORG);
  const [orgs, setOrgs] = useState<CodeNameItem[]>([]);
  const [vendors, setVendors] = useState<CodeNameItem[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [deniedToastShown, setDeniedToastShown] = useState(false);

  const [orgDetail, setOrgDetail] = useState<CodeNameItem | null>(null);
  const [vendorDetail, setVendorDetail] = useState<VendorDetail | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);

  useEffect(() => {
    if (!canReadProcurementMasterData && !deniedToastShown) {
      toast.error(t("errors.http.forbiddenProcurementMd"));
      setDeniedToastShown(true);
    }
  }, [canReadProcurementMasterData, deniedToastShown, t]);

  const loadOrgs = useCallback(async () => {
    if (!canReadProcurementMasterData) {
      setOrgs([]);
      setOrgsLoading(false);
      return;
    }
    setOrgsLoading(true);
    setError(null);
    try {
      const data = await listPurchasingOrganizations();
      setOrgs(data ?? []);
    } catch (err) {
      setError(err);
      setOrgs([]);
      if (err instanceof ApiError && err.status === 403) {
        toast.error(t("errors.http.forbiddenProcurementMd"));
      } else if (err instanceof ApiError) {
        toast.error(errorMessage(err.errorCode, err.message));
      }
    } finally {
      setOrgsLoading(false);
    }
  }, [canReadProcurementMasterData, errorMessage, t]);

  const loadVendors = useCallback(async () => {
    if (!canReadProcurementMasterData) {
      setVendors([]);
      setVendorsLoading(false);
      return;
    }
    setVendorsLoading(true);
    setError(null);
    try {
      const data = await listVendors({
        purchasingOrg: purchasingOrg.trim() || undefined,
      });
      setVendors(data ?? []);
    } catch (err) {
      setError(err);
      setVendors([]);
      if (err instanceof ApiError && err.status === 403) {
        toast.error(t("errors.http.forbiddenProcurementMd"));
      } else if (err instanceof ApiError) {
        toast.error(errorMessage(err.errorCode, err.message));
      }
    } finally {
      setVendorsLoading(false);
    }
  }, [canReadProcurementMasterData, errorMessage, purchasingOrg, t]);

  useEffect(() => {
    void loadOrgs();
  }, [loadOrgs]);

  useEffect(() => {
    void loadVendors();
  }, [loadVendors]);

  const openOrgDetail = async (code: string) => {
    setDetailBusy(true);
    try {
      const item = await getPurchasingOrganization(code);
      setOrgDetail(item);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(errorMessage(err.errorCode, err.message));
      }
    } finally {
      setDetailBusy(false);
    }
  };

  const openVendorDetail = async (code: string) => {
    setDetailBusy(true);
    try {
      const [item, purchasingOrgs] = await Promise.all([
        getVendor(code),
        listVendorPurchasingOrgs(code),
      ]);
      setVendorDetail({ item, purchasingOrgs: purchasingOrgs ?? [] });
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(errorMessage(err.errorCode, err.message));
      }
    } finally {
      setDetailBusy(false);
    }
  };

  if (!canReadProcurementMasterData) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">
          {t("masterData.procurement.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("masterData.procurement.noPermission")}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={FEATURE_LOGIN_ROUTE}
            className={cn(buttonVariants())}
          >
            {t("nav.login")}
          </Link>
          <Link
            href={FEATURE_ROUTE}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            {t("nav.overview")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("masterData.procurement.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("masterData.procurement.hint")}
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            void loadOrgs();
            void loadVendors();
          }}
        >
          {t("masterData.common.refresh")}
        </Button>
      </div>

      <ApiErrorBanner error={error} />

      <section className="flex flex-col gap-3">
        <h3 className="text-base font-medium">
          {t("masterData.procurement.section.orgs")}
        </h3>
        {orgsLoading ? (
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
                  <TableHead>{t("masterData.common.active")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      {t("masterData.common.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  orgs.map((row) => (
                    <TableRow key={row.code}>
                      <TableCell className="font-medium">{row.code}</TableCell>
                      <TableCell>{row.name}</TableCell>
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
                          onClick={() => void openOrgDetail(row.code)}
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
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h3 className="text-base font-medium">
            {t("masterData.procurement.section.vendors")}
          </h3>
          <div className="grid gap-1.5">
            <Label>{t("masterData.procurement.filter.purchasingOrg")}</Label>
            <Select
              value={purchasingOrg}
              onValueChange={(v) => {
                if (!v) return;
                setPurchasingOrg(v);
                setVendors([]);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {orgs.length === 0 ? (
                  <SelectItem value={DEFAULT_PURCHASING_ORG}>
                    {DEFAULT_PURCHASING_ORG}
                  </SelectItem>
                ) : (
                  orgs.map((o) => (
                    <SelectItem key={o.code} value={o.code}>
                      {o.code} — {o.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {vendorsLoading ? (
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
                  <TableHead>{t("masterData.common.active")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      {t("masterData.common.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  vendors.map((row) => (
                    <TableRow key={row.code}>
                      <TableCell className="font-medium">{row.code}</TableCell>
                      <TableCell>{row.name}</TableCell>
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
                          onClick={() => void openVendorDetail(row.code)}
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
      </section>

      <Dialog
        open={orgDetail != null}
        onOpenChange={(open) => {
          if (!open) setOrgDetail(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("masterData.common.detail")}</DialogTitle>
          </DialogHeader>
          {orgDetail ? (
            <dl className="grid gap-2 text-sm">
              <div className="grid grid-cols-[8rem_1fr] gap-2">
                <dt className="text-muted-foreground">
                  {t("masterData.common.code")}
                </dt>
                <dd className="font-medium">{orgDetail.code}</dd>
              </div>
              <div className="grid grid-cols-[8rem_1fr] gap-2">
                <dt className="text-muted-foreground">
                  {t("masterData.common.name")}
                </dt>
                <dd>{orgDetail.name}</dd>
              </div>
              <div className="grid grid-cols-[8rem_1fr] gap-2">
                <dt className="text-muted-foreground">
                  {t("masterData.common.active")}
                </dt>
                <dd>
                  {orgDetail.isActive
                    ? t("masterData.common.active")
                    : t("masterData.common.inactive")}
                </dd>
              </div>
            </dl>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOrgDetail(null)}
            >
              {t("masterData.common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={vendorDetail != null}
        onOpenChange={(open) => {
          if (!open) setVendorDetail(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("masterData.common.detail")}</DialogTitle>
          </DialogHeader>
          {vendorDetail ? (
            <dl className="grid gap-2 text-sm">
              <div className="grid grid-cols-[8rem_1fr] gap-2">
                <dt className="text-muted-foreground">
                  {t("masterData.common.code")}
                </dt>
                <dd className="font-medium">{vendorDetail.item.code}</dd>
              </div>
              <div className="grid grid-cols-[8rem_1fr] gap-2">
                <dt className="text-muted-foreground">
                  {t("masterData.common.name")}
                </dt>
                <dd>{vendorDetail.item.name}</dd>
              </div>
              <div className="grid grid-cols-[8rem_1fr] gap-2">
                <dt className="text-muted-foreground">
                  {t("masterData.common.active")}
                </dt>
                <dd>
                  {vendorDetail.item.isActive
                    ? t("masterData.common.active")
                    : t("masterData.common.inactive")}
                </dd>
              </div>
              <div className="grid grid-cols-[8rem_1fr] gap-2">
                <dt className="text-muted-foreground">
                  {t("masterData.procurement.vendorOrgs")}
                </dt>
                <dd>
                  {vendorDetail.purchasingOrgs.length > 0
                    ? vendorDetail.purchasingOrgs.join(", ")
                    : "—"}
                </dd>
              </div>
            </dl>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setVendorDetail(null)}
            >
              {t("masterData.common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProcurementMasterDataPage() {
  return (
    <RequireAuth>
      <ProcurementMasterDataPageInner />
    </RequireAuth>
  );
}
