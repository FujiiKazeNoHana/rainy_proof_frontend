"use client";

import { AccountingDocumentDetailPage } from "@/features/ergo/sap_sandbox/components/AccountingDocumentDetailPage";
import { RequireAuth } from "@/features/ergo/sap_sandbox/components/RequireAuth";

export default function FinanceApDetailPage() {
  return (
    <RequireAuth>
      <AccountingDocumentDetailPage side="AP" />
    </RequireAuth>
  );
}
