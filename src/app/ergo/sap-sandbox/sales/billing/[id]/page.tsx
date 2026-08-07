"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
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
import { getBillingDocument } from "@/features/ergo/sap_sandbox/api/billing";
import { ApiErrorBanner } from "@/features/ergo/sap_sandbox/components/ApiErrorBanner";
import { BillingStatusBadge } from "@/features/ergo/sap_sandbox/components/BillingStatusBadge";
import { RequireAuth } from "@/features/ergo/sap_sandbox/components/RequireAuth";
import {
  FINANCE_AR_ROUTE,
  SALES_BILLING_ROUTE,
  SALES_ORDERS_ROUTE,
} from "@/features/ergo/sap_sandbox/constants";
import { useSapI18n } from "@/features/ergo/sap_sandbox/i18n";
import { isFinanceAccountingUiEnabled } from "@/features/ergo/sap_sandbox/lib/financeRules";
import type { BillingDocument } from "@/features/ergo/sap_sandbox/lib/billingTypes";

function BillingDetailInner() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { t, billingStatus } = useSapI18n();

  const [doc, setDoc] = useState<BillingDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [embedWarned, setEmbedWarned] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getBillingDocument(id);
        if (!cancelled) {
          setDoc(data);
          if (
            isFinanceAccountingUiEnabled() &&
            !data.accountingDocumentId &&
            !embedWarned
          ) {
            toast.error(t("finance.billing.embedMissing"));
            setEmbedWarned(true);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setDoc(null);
          if (err instanceof ApiError && err.status === 404) {
            toast.error(t("billing.detail.toast.notFound"));
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [embedWarned, id, t]);

  if (loading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        {t("billing.detail.loading")}
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="space-y-4">
        <ApiErrorBanner error={error} />
        <Link
          href={SALES_BILLING_ROUTE}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {t("common.backToList")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-mono text-xl font-semibold tracking-tight">
              {doc.number}
            </h2>
            <BillingStatusBadge
              status={doc.status}
              label={billingStatus(doc.status, doc.statusLabel)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {t("billing.detail.meta.linkedOrder")}{" "}
            <Link
              href={`${SALES_ORDERS_ROUTE}/${doc.salesOrderId}`}
              className="text-primary hover:underline"
            >
              {doc.salesOrderNumber || doc.salesOrderId}
            </Link>
            {" · "}
            {t("billing.detail.meta.customer", {
              code: doc.customerCode,
              name: doc.customerName,
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={SALES_BILLING_ROUTE}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {t("common.list")}
          </Link>
          <Link
            href={`${SALES_ORDERS_ROUTE}/${doc.salesOrderId}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {t("deliveries.detail.actions.salesOrder")}
          </Link>
          {isFinanceAccountingUiEnabled() && doc.accountingDocumentId ? (
            <Link
              href={`${FINANCE_AR_ROUTE}/${doc.accountingDocumentId}`}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              {t("finance.billing.viewAr")}
              {doc.accountingDocumentNumber
                ? ` ${doc.accountingDocumentNumber}`
                : ""}
            </Link>
          ) : null}
        </div>
      </div>

      <ApiErrorBanner error={error} />

      <dl className="grid gap-3 text-sm sm:grid-cols-2 md:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">
            {t("billing.detail.field.amount")}
          </dt>
          <dd className="font-mono">
            {doc.headerAmount} {doc.currency}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">
            {t("billing.detail.field.currency")}
          </dt>
          <dd>{doc.currency}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">
            {t("billing.detail.field.postedAt")}
          </dt>
          <dd>
            {doc.postedAt
              ? new Date(doc.postedAt).toLocaleString()
              : t("common.emDash")}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("common.created")}</dt>
          <dd>
            {doc.createdBy || t("common.emDash")} ·{" "}
            {doc.createdAt
              ? new Date(doc.createdAt).toLocaleString()
              : t("common.emDash")}
          </dd>
        </div>
        <div className="sm:col-span-2 md:col-span-3">
          <dt className="text-muted-foreground">{t("common.remark")}</dt>
          <dd>{doc.remark || t("common.emDash")}</dd>
        </div>
      </dl>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>{t("common.material")}</TableHead>
              <TableHead className="text-right">
                {t("billing.detail.lines.quantity")}
              </TableHead>
              <TableHead className="text-right">
                {t("billing.detail.lines.unitPrice")}
              </TableHead>
              <TableHead className="text-right">
                {t("billing.detail.lines.amount")}
              </TableHead>
              <TableHead>{t("common.remark")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(doc.lines ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  {t("billing.detail.lines.empty")}
                </TableCell>
              </TableRow>
            ) : (
              (doc.lines ?? []).map((line) => (
                <TableRow key={line.id || line.lineNo}>
                  <TableCell>{line.lineNo}</TableCell>
                  <TableCell>
                    <div className="font-mono text-xs">{line.materialCode}</div>
                    <div className="text-muted-foreground">
                      {line.materialName}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {line.quantity} {line.unit}
                  </TableCell>
                  <TableCell className="text-right">{line.unitPrice}</TableCell>
                  <TableCell className="text-right">{line.amount}</TableCell>
                  <TableCell>{line.remark || t("common.emDash")}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function BillingDetailPage() {
  return (
    <RequireAuth>
      <BillingDetailInner />
    </RequireAuth>
  );
}
