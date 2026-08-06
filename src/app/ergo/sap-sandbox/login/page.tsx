"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/shared/auth";
import type { AuthProfile } from "@/shared/auth";
import { ApiError, getApiBase } from "@/shared/lib/api-client";
import { Button, buttonVariants } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";
import { ApiErrorBanner } from "@/features/ergo/sap_sandbox/components/ApiErrorBanner";
import {
  FEATURE_ROUTE,
  SALES_ORDERS_ROUTE,
} from "@/features/ergo/sap_sandbox/constants";
import { useSapI18n } from "@/features/ergo/sap_sandbox/i18n";

function LoginForm() {
  const { t, errorMessage } = useSapI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || SALES_ORDERS_ROUTE;
  const {
    login,
    loginWithProfile,
    loadProfiles,
    checkHealth,
    isAuthenticated,
    session,
  } = useAuth();

  const [profiles, setProfiles] = useState<AuthProfile[]>([]);
  const [subject, setSubject] = useState("demo-sales");
  const [displayName, setDisplayName] = useState(() =>
    t("login.defaultDisplayName"),
  );
  const [rolesText, setRolesText] = useState("SalesClerk");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [gatewayOk, setGatewayOk] = useState<boolean | null>(null);

  useEffect(() => {
    void (async () => {
      setGatewayOk(await checkHealth());
      try {
        setProfiles(await loadProfiles());
      } catch {
        setProfiles([
          { name: "Admin", roles: ["Admin"], description: "Full access" },
          {
            name: "SalesClerk",
            roles: ["SalesClerk"],
            description: "Sales documents",
          },
          {
            name: "Buyer",
            roles: ["Buyer"],
            description: "Procurement documents",
          },
          {
            name: "Inventory",
            roles: ["Inventory"],
            description: "Stock & postings",
          },
        ]);
      }
    })();
  }, [checkHealth, loadProfiles]);

  const apiBase = useMemo(() => getApiBase(), []);

  const goAfterLogin = () => {
    const target = returnTo.startsWith("/") ? returnTo : FEATURE_ROUTE;
    router.replace(target);
  };

  const handleProfile = async (profile: AuthProfile) => {
    setBusy(true);
    setError(null);
    try {
      await loginWithProfile(profile);
      toast.success(t("login.toast.loggedInAs", { name: profile.name }));
      goAfterLogin();
    } catch (err) {
      setError(err);
      toast.error(
        err instanceof ApiError
          ? errorMessage(err.errorCode, err.message)
          : t("login.toast.failed"),
      );
    } finally {
      setBusy(false);
    }
  };

  const handleCustom = async () => {
    setBusy(true);
    setError(null);
    try {
      const roles = rolesText
        .split(/[,\s]+/)
        .map((r) => r.trim())
        .filter(Boolean);
      await login({ subject, displayName, roles });
      toast.success(t("login.toast.tokenIssued"));
      goAfterLogin();
    } catch (err) {
      setError(err);
      toast.error(
        err instanceof ApiError
          ? errorMessage(err.errorCode, err.message)
          : t("login.toast.failed"),
      );
    } finally {
      setBusy(false);
    }
  };

  const gatewayStatus =
    gatewayOk === null
      ? t("login.gateway.checking")
      : gatewayOk
        ? t("login.gateway.healthy")
        : t("login.gateway.unreachable");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">
          {t("login.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          Gateway：<code className="font-mono text-xs">{apiBase}</code>
          {gatewayStatus}
        </p>
        {isAuthenticated ? (
          <p className="text-sm text-muted-foreground">
            {t("login.currentSession", {
              displayName: session?.displayName ?? "",
              roles: (session?.roles ?? []).join(", "),
            })}
          </p>
        ) : null}
      </div>

      <ApiErrorBanner error={error} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("login.presetRoles.title")}
          </CardTitle>
          <CardDescription>{t("login.profiles.hint")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {profiles.map((p) => (
            <Button
              key={p.name}
              variant="outline"
              disabled={busy}
              onClick={() => void handleProfile(p)}
              className="h-auto justify-start whitespace-normal py-2 text-left"
            >
              <span className="font-medium">{p.name}</span>
              <span className="text-muted-foreground">
                — {p.description} ({p.roles.join(", ")})
              </span>
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("login.customToken.title")}
          </CardTitle>
          <CardDescription>{t("login.customToken.hint")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="subject">{t("login.customToken.subject")}</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="displayName">
              {t("login.customToken.displayName")}
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="roles">{t("login.customToken.rolesLabel")}</Label>
            <Input
              id="roles"
              value={rolesText}
              onChange={(e) => setRolesText(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button disabled={busy} onClick={() => void handleCustom()}>
              {t("login.customToken.getToken")}
            </Button>
            <Link
              href={FEATURE_ROUTE}
              className={cn(buttonVariants({ variant: "ghost" }))}
            >
              {t("login.backToModule")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SapSandboxLoginPage() {
  const { t } = useSapI18n();

  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-muted-foreground">
          {t("login.loading")}
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
