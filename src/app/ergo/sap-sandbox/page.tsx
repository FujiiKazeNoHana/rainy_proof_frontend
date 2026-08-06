"use client";

import Link from "next/link";
import { useAuth } from "@/shared/auth";
import { getApiBase } from "@/shared/lib/api-client";
import { buttonVariants } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  FEATURE_LOGIN_ROUTE,
  SALES_ORDERS_ROUTE,
} from "@/features/ergo/sap_sandbox/constants";
import { useSapI18n } from "@/features/ergo/sap_sandbox/i18n";

export default function SapSandboxHomePage() {
  const { t } = useSapI18n();
  const { isAuthenticated, canWriteSales, session } = useAuth();
  const apiBase = getApiBase();

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">
          {t("overview.title")}
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t("overview.description")}
        </p>
      </div>

      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <div className="space-y-1 border-l-2 border-primary/40 pl-3">
          <dt className="text-muted-foreground">Gateway</dt>
          <dd className="font-mono text-xs md:text-sm">{apiBase}</dd>
        </div>
        <div className="space-y-1 border-l-2 border-border pl-3">
          <dt className="text-muted-foreground">
            {t("overview.loginStatus.label")}
          </dt>
          <dd>
            {isAuthenticated
              ? t("overview.loginStatus.loggedIn", {
                  displayName: session?.displayName ?? "",
                  roles: (session?.roles ?? []).join(", "),
                  writeHint: canWriteSales
                    ? t("overview.loginStatus.writeSales")
                    : t("overview.loginStatus.readOnly"),
                })
              : t("overview.loginStatus.notLoggedIn")}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2">
        {!isAuthenticated ? (
          <Link href={FEATURE_LOGIN_ROUTE} className={cn(buttonVariants())}>
            {t("overview.actions.devLogin")}
          </Link>
        ) : (
          <Link
            href={SALES_ORDERS_ROUTE}
            className={cn(buttonVariants())}
          >
            {t("overview.actions.openOrders")}
          </Link>
        )}
        {isAuthenticated && canWriteSales ? (
          <Link
            href={`${SALES_ORDERS_ROUTE}/new`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            {t("overview.actions.newOrder")}
          </Link>
        ) : null}
        {isAuthenticated ? (
          <Link
            href={FEATURE_LOGIN_ROUTE}
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            {t("overview.actions.switchRole")}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
