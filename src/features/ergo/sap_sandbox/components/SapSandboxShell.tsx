"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/shared/auth";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { FEATURE_ROUTE } from "../constants";
import { NavFavoritesProvider } from "./NavFavoritesProvider";
import { SapSandboxSidebar } from "./SapSandboxSidebar";

export function SapSandboxShell({ children }: { children: React.ReactNode }) {
  const { session, isAuthenticated, logout } = useAuth();
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
              aria-label={mobileOpen ? "关闭菜单" : "打开菜单"}
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
                  门户
                </Link>
                <span aria-hidden>/</span>
                <Link href="/ergo" className="hover:text-foreground">
                  ERGO
                </Link>
                <span aria-hidden>/</span>
                <Link href={FEATURE_ROUTE} className="hover:text-foreground">
                  SAP 沙盒
                </Link>
              </div>
              <h1 className="truncate font-heading text-lg font-semibold tracking-tight md:text-xl">
                SAP 沙盒
              </h1>
            </div>

            <div className="flex shrink-0 items-center gap-2 pr-14 md:pr-24">
              {isAuthenticated ? (
                <>
                  <span className="hidden max-w-[14rem] truncate text-xs text-muted-foreground sm:inline md:text-sm">
                    {session?.displayName} ·{" "}
                    {(session?.roles ?? []).join(", ")}
                  </span>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    退出
                  </Button>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">未登录</span>
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
                aria-label="关闭菜单遮罩"
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
