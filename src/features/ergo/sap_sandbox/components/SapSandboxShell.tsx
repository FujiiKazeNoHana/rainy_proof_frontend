"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/shared/auth";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { FEATURE_ROUTE } from "../constants";
import { SAP_LOCALES, useSapI18n, type SapLocale } from "../i18n";
import { NavFavoritesProvider } from "./NavFavoritesProvider";
import { SapSandboxSidebar } from "./SapSandboxSidebar";

export function SapSandboxShell({ children }: { children: React.ReactNode }) {
  const { session, isAuthenticated, logout } = useAuth();
  const { t, locale, setLocale } = useSapI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <NavFavoritesProvider>
      <div className="flex min-h-full flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-sm">
          <div className="flex h-14 items-center gap-3 px-3 md:px-4">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              aria-label={
                mobileOpen ? t("shell.aria.closeMenu") : t("shell.aria.openMenu")
              }
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? (
                <X className="size-4" />
              ) : (
                <Menu className="size-4" />
              )}
            </Button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <Link href="/" className="hover:text-foreground">
                  {t("shell.breadcrumb.portal")}
                </Link>
                <span aria-hidden>/</span>
                <Link href="/ergo" className="hover:text-foreground">
                  {t("shell.breadcrumb.ergo")}
                </Link>
                <span aria-hidden>/</span>
                <Link href={FEATURE_ROUTE} className="hover:text-foreground">
                  {t("shell.breadcrumb.sapSandbox")}
                </Link>
              </div>
              <h1 className="truncate font-heading text-lg font-semibold tracking-tight md:text-xl">
                {t("shell.title")}
              </h1>
            </div>

            <div className="flex shrink-0 items-center gap-2 pr-11">
              <label className="sr-only" htmlFor="sap-locale">
                {t("shell.language")}
              </label>
              <select
                id="sap-locale"
                className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs"
                value={locale}
                onChange={(e) => setLocale(e.target.value as SapLocale)}
                aria-label={t("shell.language")}
              >
                {SAP_LOCALES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {t(
                      item.code === "zh"
                        ? "shell.language.zh"
                        : "shell.language.en",
                    )}
                  </option>
                ))}
              </select>
              {isAuthenticated ? (
                <>
                  <span className="hidden max-w-[14rem] truncate text-xs text-muted-foreground sm:inline md:text-sm">
                    {session?.displayName} ·{" "}
                    {(session?.roles ?? []).join(", ")}
                  </span>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    {t("shell.logout")}
                  </Button>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {t("shell.notLoggedIn")}
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="relative flex min-h-0 flex-1">
          <aside
            className={cn(
              "hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:block",
              "xl:w-64",
            )}
          >
            <div className="sticky top-14 flex h-[calc(100dvh-3.5rem)] flex-col overflow-y-auto p-3">
              <SapSandboxSidebar />
            </div>
          </aside>

          {mobileOpen ? (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 bg-foreground/20 lg:hidden"
                aria-label={t("shell.aria.closeMenuOverlay")}
                onClick={() => setMobileOpen(false)}
              />
              <aside className="fixed top-14 bottom-0 left-0 z-50 w-64 border-r border-sidebar-border bg-sidebar p-3 text-sidebar-foreground shadow-lg lg:hidden">
                <SapSandboxSidebar onNavigate={() => setMobileOpen(false)} />
              </aside>
            </>
          ) : null}

          <main className="min-w-0 flex-1">
            <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-6 md:px-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </NavFavoritesProvider>
  );
}
