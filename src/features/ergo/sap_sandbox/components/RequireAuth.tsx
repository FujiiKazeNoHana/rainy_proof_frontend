"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/shared/auth";
import {
  FEATURE_LOGIN_ROUTE,
  FEATURE_ROUTE,
} from "@/features/ergo/sap_sandbox/constants";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { ready, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      const returnTo = encodeURIComponent(pathname || FEATURE_ROUTE);
      router.replace(`${FEATURE_LOGIN_ROUTE}?returnTo=${returnTo}`);
    }
  }, [ready, isAuthenticated, router, pathname]);

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        正在恢复登录状态…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        正在跳转登录…
      </div>
    );
  }

  return <>{children}</>;
}
