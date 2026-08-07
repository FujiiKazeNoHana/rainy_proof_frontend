"use client";

import { AccountingDocumentDetailPage } from "@/features/ergo/sap_sandbox/components/AccountingDocumentDetailPage";
import { RequireAuth } from "@/features/ergo/sap_sandbox/components/RequireAuth";

export default function FinanceArDetailPage() {
  return (
    <RequireAuth>
      <AccountingDocumentDetailPage side="AR" />
    </RequireAuth>
  );
}
