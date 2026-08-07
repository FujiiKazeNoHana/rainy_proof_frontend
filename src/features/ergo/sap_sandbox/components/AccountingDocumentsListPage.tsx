"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/shared/auth";
import { ApiError } from "@/shared/lib/api-client";
import { buttonVariants } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/utils";
import { listAccountingDocuments } from "@/features/ergo/sap_sandbox/api/accountingDocuments";
import { AccountingDocumentStatusBadge } from "@/features/ergo/sap_sandbox/components/AccountingDocumentStatusBadge";
import { ApiErrorBanner } from "@/features/ergo/sap_sandbox/components/ApiErrorBanner";
import { FEATURE_ROUTE } from "@/features/ergo/sap_sandbox/constants";
import { useSapI18n } from "@/features/ergo/sap_sandbox/i18n";
import {
  financeDetailRoute,
  isFinanceAccountingUiEnabled,
} from "@/features/ergo/sap_sandbox/lib/financeRules";
import type {
  AccountingDocumentListItem,
  FiSide,
} from "@/features/ergo/sap_sandbox/lib/financeTypes";

export function AccountingDocumentsListPage({ side }: { side: FiSide }) {
  const { t, accountingDocumentStatus } = useSapI18n();
  const { canReadAr, canReadAp } = useAuth();
  const canRead = side === "AR" ? canReadAr : canReadAp;
  const [items, setItems] = useState<AccountingDocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [numberFilter, setNumberFilter] = useState("");

  const enabled = isFinanceAccountingUiEnabled();

  const load = useCallback(async () => {
    if (!enabled || !canRead) {
      setLoading(false);
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await listAccountingDocuments({ side });
      setItems(data ?? []);
    } catch (err) {
      setError(err);
      setItems([]);
      if (err instanceof ApiError && err.status === 403) {
        toast.error(t("errors.http.forbiddenFiView"));
      }
    } finally {
      setLoading(false);
    }
  }, [canRead, enabled, side, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = numberFilter.trim().toLowerCase();
    if (!q) return items;
    return items.filter((row) => row.number.toLowerCase().includes(q));
  }, [items, numberFilter]);

  const emDash = t("common.emDash");
  const title =
    side === "AR" ? t("finance.ar.list.title") : t("finance.ap.list.title");

  if (!enabled) {
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">
          {t("finance.uiDisabled")}
        </p>
        <Link
          href={FEATURE_ROUTE}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {t("common.back")}
        </Link>
      </div>
    );
  }

  if (!canRead) {
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">
          {t("finance.noPermission")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">
          {side === "AR"
            ? t("finance.ar.list.hint")
            : t("finance.ap.list.hint")}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <label className="text-xs text-muted-foreground" htmlFor="fi-number">
            {t("finance.list.filter.number")}
          </label>
          <Input
            id="fi-number"
            className="w-48"
            value={numberFilter}
            onChange={(e) => setNumberFilter(e.target.value)}
            placeholder={t("finance.list.filter.numberPlaceholder")}
          />
        </div>
      </div>

      <ApiErrorBanner error={error} />

      {loading ? (
        <p className="text-sm text-muted-foreground">
          {t("finance.list.loading")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("finance.list.table.number")}</TableHead>
                <TableHead>{t("finance.list.table.source")}</TableHead>
                <TableHead>{t("finance.list.table.businessDoc")}</TableHead>
                <TableHead>{t("finance.list.table.partner")}</TableHead>
                <TableHead className="text-right">
                  {t("finance.list.table.amount")}
                </TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>{t("finance.list.table.occurredAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    {t("finance.list.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link
                        href={financeDetailRoute(side, row.id)}
                        className="font-mono font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {row.number}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.sourceNumber || emDash}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.businessDocNumber || emDash}
                    </TableCell>
                    <TableCell>{row.partnerCode || emDash}</TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {row.amount} {row.currency}
                    </TableCell>
                    <TableCell>
                      <AccountingDocumentStatusBadge
                        status={row.status}
                        label={accountingDocumentStatus(row.status)}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.occurredAt
                        ? new Date(row.occurredAt).toLocaleString()
                        : emDash}
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
