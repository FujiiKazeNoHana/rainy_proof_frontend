"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SORT_METHODS } from "@/features/catalog";
import { cn } from "@/shared/lib/utils";

export function SortMethodSwitcher() {
  const pathname = usePathname();
  const active = SORT_METHODS.find(
    (m) => pathname === m.href || pathname.startsWith(`${m.href}/`),
  );

  return (
    <div className="space-y-3">
      <div
        className="inline-flex flex-wrap gap-1 rounded-full border border-border bg-card/80 p-1 shadow-sm backdrop-blur"
        role="tablist"
        aria-label="排序方法"
      >
        {SORT_METHODS.map((method) => {
          const isActive =
            pathname === method.href || pathname.startsWith(`${method.href}/`);
          return (
            <Link
              key={method.id}
              href={method.href}
              role="tab"
              aria-selected={isActive}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {method.title}
            </Link>
          );
        })}
      </div>
      {active ? (
        <p className="text-sm text-muted-foreground">{active.description}</p>
      ) : null}
    </div>
  );
}
