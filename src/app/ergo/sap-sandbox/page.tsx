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

export default function SapSandboxHomePage() {
  const { isAuthenticated, canWriteSales, session } = useAuth();
  const apiBase = getApiBase();

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">概览</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          对接 Gateway 销售订单 API。请从左侧菜单进入功能；后续库存、采购等模块会挂在同一菜单树下。
        </p>
      </div>

      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <div className="space-y-1 border-l-2 border-primary/40 pl-3">
          <dt className="text-muted-foreground">Gateway</dt>
          <dd className="font-mono text-xs md:text-sm">{apiBase}</dd>
        </div>
        <div className="space-y-1 border-l-2 border-border pl-3">
          <dt className="text-muted-foreground">登录状态</dt>
          <dd>
            {isAuthenticated
              ? `${session?.displayName}（${(session?.roles ?? []).join(", ")}）${canWriteSales ? " · 可写销售" : " · 只读"}`
              : "未登录 — 请先打开「开发登录」"}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2">
        {!isAuthenticated ? (
          <Link href={FEATURE_LOGIN_ROUTE} className={cn(buttonVariants())}>
            开发登录
          </Link>
        ) : (
          <Link
            href={SALES_ORDERS_ROUTE}
            className={cn(buttonVariants())}
          >
            打开销售订单
          </Link>
        )}
        {isAuthenticated && canWriteSales ? (
          <Link
            href={`${SALES_ORDERS_ROUTE}/new`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            新建订单
          </Link>
        ) : null}
        {isAuthenticated ? (
          <Link
            href={FEATURE_LOGIN_ROUTE}
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            切换角色
          </Link>
        ) : null}
      </div>
    </div>
  );
}
