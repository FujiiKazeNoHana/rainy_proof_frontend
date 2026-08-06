import type { Metadata } from "next";
import { AuthProvider } from "@/shared/auth";
import { Toaster } from "@/shared/components/ui/sonner";
import { SapSandboxShell } from "@/features/ergo/sap_sandbox/components/SapSandboxShell";
import { SapLocaleProvider } from "@/features/ergo/sap_sandbox/i18n";

export const metadata: Metadata = {
  title: "SAP Sandbox · Ergo",
  description: "SAP learning module (Gateway) — sales orders & deliveries",
};

export default function SapSandboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <SapLocaleProvider>
        <SapSandboxShell>{children}</SapSandboxShell>
        <Toaster />
      </SapLocaleProvider>
    </AuthProvider>
  );
}
