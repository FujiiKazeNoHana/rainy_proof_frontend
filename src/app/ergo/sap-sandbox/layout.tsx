import type { Metadata } from "next";
import { AuthProvider } from "@/shared/auth";
import { Toaster } from "@/shared/components/ui/sonner";
import { SapSandboxShell } from "@/features/ergo/sap_sandbox/components/SapSandboxShell";

export const metadata: Metadata = {
  title: "SAP 沙盒 · Ergo",
  description: "销售订单等 SAP 学习模块（对接 Gateway）",
};

export default function SapSandboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <SapSandboxShell>{children}</SapSandboxShell>
      <Toaster />
    </AuthProvider>
  );
}
