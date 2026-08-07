"use client";

import { AccountingDocumentsListPage } from "@/features/ergo/sap_sandbox/components/AccountingDocumentsListPage";
import { RequireAuth } from "@/features/ergo/sap_sandbox/components/RequireAuth";

export default function FinanceArListPage() {
  return (
    <RequireAuth>
      <AccountingDocumentsListPage side="AR" />
    </RequireAuth>
  );
}
