"use client";

import { AccountingDocumentsListPage } from "@/features/ergo/sap_sandbox/components/AccountingDocumentsListPage";
import { RequireAuth } from "@/features/ergo/sap_sandbox/components/RequireAuth";

export default function FinanceApListPage() {
  return (
    <RequireAuth>
      <AccountingDocumentsListPage side="AP" />
    </RequireAuth>
  );
}
