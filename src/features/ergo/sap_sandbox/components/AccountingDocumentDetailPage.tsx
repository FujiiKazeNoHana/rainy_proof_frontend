"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/shared/auth";
import { ApiError } from "@/shared/lib/api-client";
import { buttonVariants } from "@/shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/utils";
import { getAccountingDocument } from "@/features/ergo/sap_sandbox/api/accountingDocuments";
import { AccountingDocumentStatusBadge } from "@/features/ergo/sap_sandbox/components/AccountingDocumentStatusBadge";
import { ApiErrorBanner } from "@/features/ergo/sap_sandbox/components/ApiErrorBanner";
import {
  FEATURE_ROUTE,
  INVOICE_RECEIPTS_ROUTE,
  PURCHASE_ORDERS_ROUTE,
  SALES_BILLING_ROUTE,
  SALES_ORDERS_ROUTE,
} from "@/features/ergo/sap_sandbox/constants";
import { useSapI18n } from "@/features/ergo/sap_sandbox/i18n";
import {
  financeListRoute,
  financeSideMismatchRedirect,
  isFinanceAccountingUiEnabled,
  partnerLabel,
} from "@/features/ergo/sap_sandbox/lib/financeRules";
import type {
  AccountingDocument,
  FiSide,
} from "@/features/ergo/sap_sandbox/lib/financeTypes";

export function AccountingDocumentDetailPage({ side }: { side: FiSide }) {
  const { t, accountingDocumentStatus, errorMessage } = useSapI18n();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { canReadAr, canReadAp } = useAuth();
  const canRead = side === "AR" ? canReadAr : canReadAp;

  const [doc, setDoc] = useState<AccountingDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const enabled = isFinanceAccountingUiEnabled();

  useEffect(() => {
    if (!enabled || !canRead) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAccountingDocument(id);
        if (!cancelled) setDoc(data);
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setDoc(null);
          if (err instanceof ApiError) {
            if (err.status === 403) {
              toast.error(t("errors.http.forbiddenFiView"));
            } else {
              toast.error(errorMessage(err.errorCode, err.message));
            }
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canRead, enabled, errorMessage, id, t]);

  const title =
    side === "AR" ? t("finance.ar.detail.title") : t("finance.ap.detail.title");

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
        <p className="text-sm text-muted-foreground">
          {t("finance.noPermission")}
        </p>
        <Link
          href={financeListRoute(side)}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {t("common.backToList")}
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("finance.detail.loading")}
      </p>
    );
  }

  if (!doc) {
    return (
      <div className="space-y-4">
        <ApiErrorBanner error={error} />
        <Link
          href={financeListRoute(side)}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {t("common.backToList")}
        </Link>
      </div>
    );
  }

  const mismatchHref = financeSideMismatchRedirect(side, doc.side, doc.id);
  if (mismatchHref) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t("finance.detail.sideMismatch")}
        </p>
        <Link href={mismatchHref} className={cn(buttonVariants())}>
          {t("finance.detail.openCorrectSide")}
        </Link>
      </div>
    );
  }

  const emDash = t("common.emDash");
  const lines = doc.lines ?? [];
  const partner = partnerLabel(doc.partnerCode, doc.partnerName);

  const sourceHref =
    doc.sourceType === "Billing"
      ? `${SALES_BILLING_ROUTE}/${doc.sourceId}`
      : `${INVOICE_RECEIPTS_ROUTE}/${doc.sourceId}`;
  const businessHref =
    doc.side === "AR"
      ? `${SALES_ORDERS_ROUTE}/${doc.businessDocId}`
      : `${PURCHASE_ORDERS_ROUTE}/${doc.businessDocId}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-mono text-xl font-semibold tracking-tight">
              {doc.number}
            </h2>
            <AccountingDocumentStatusBadge
              status={doc.status}
              label={accountingDocumentStatus(doc.status)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {t("finance.detail.meta.partner")} {partner}
            {" · "}
            {t("finance.detail.meta.amount")} {doc.amount} {doc.currency}
            {doc.occurredAt
              ? ` · ${new Date(doc.occurredAt).toLocaleString()}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={financeListRoute(side)}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {t("common.list")}
          </Link>
          <Link
            href={sourceHref}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {doc.sourceType === "Billing"
              ? t("finance.detail.link.billing")
              : t("finance.detail.link.ir")}{" "}
            {doc.sourceNumber}
          </Link>
          <Link
            href={businessHref}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            {doc.side === "AR"
              ? t("finance.detail.link.so")
              : t("finance.detail.link.po")}{" "}
            {doc.businessDocNumber}
          </Link>
        </div>
      </div>

      <ApiErrorBanner error={error} />

      <section className="space-y-3">
        <h3 className="text-base font-medium">
          {t("finance.detail.lines.title")}
        </h3>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("finance.detail.lines.lineNumber")}</TableHead>
                <TableHead>{t("finance.detail.lines.account")}</TableHead>
                <TableHead className="text-right">
                  {t("finance.detail.lines.debit")}
                </TableHead>
                <TableHead className="text-right">
                  {t("finance.detail.lines.credit")}
                </TableHead>
                <TableHead>{t("finance.detail.lines.text")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    {t("finance.detail.lines.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                lines.map((line) => (
                  <TableRow key={`${line.lineNumber}-${line.accountCode}`}>
                    <TableCell>{line.lineNumber}</TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">
                        {line.accountCode}
                      </span>{" "}
                      {line.accountName || emDash}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {line.debit}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {line.credit}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {line.text || emDash}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
