"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, Search, Star, X } from "lucide-react";
import { useAuth } from "@/shared/auth";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";
import {
  countNavLeaves,
  filterNavTree,
  isNavBranchOpen,
  isNavItemActive,
  navItemMatchesQuery,
  SAP_SANDBOX_NAV,
  type SapNavItem,
} from "../lib/nav";
import { useNavFavorites } from "./NavFavoritesProvider";

function FavoriteStarButton({
  itemId,
  labeled,
}: {
  itemId: string;
  labeled?: string;
}) {
  const { isFavorite, toggleFavorite } = useNavFavorites();
  const active = isFavorite(itemId);

  return (
    <button
      type="button"
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-md transition-colors",
        "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
        active && "text-amber-600 hover:text-amber-700",
      )}
      aria-label={
        active
          ? `取消收藏${labeled ? `「${labeled}」` : ""}`
          : `收藏${labeled ? `「${labeled}」` : ""}`
      }
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(itemId);
      }}
    >
      <Star
        className={cn("size-3.5", active && "fill-current")}
        strokeWidth={active ? 1.75 : 2}
      />
    </button>
  );
}

function FavoritesSection({
  onNavigate,
  query,
}: {
  onNavigate?: () => void;
  query: string;
}) {
  const pathname = usePathname();
  const { ready, favorites, removeFavorite } = useNavFavorites();
  const { canWriteSales } = useAuth();

  const visible = favorites.filter((item) => {
    if (item.requireWrite && !canWriteSales) return false;
    if (query.trim() && !navItemMatchesQuery(item, query)) return false;
    return true;
  });

  if (query.trim() && visible.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1 border-b border-sidebar-border pb-3">
      <div className="flex items-center gap-1.5 px-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        <Star className="size-3 fill-current text-amber-600/80" />
        我的收藏
      </div>
      {!ready ? (
        <p className="px-2 py-1 text-xs text-muted-foreground">加载中…</p>
      ) : visible.length === 0 ? (
        <p className="px-2 py-1 text-xs leading-relaxed text-muted-foreground">
          点击菜单旁星标收藏常用功能，数据保存在本机浏览器。
        </p>
      ) : (
        <ul className="space-y-0.5">
          {visible.map((item) => {
            const active = isNavItemActive(item, pathname);
            return (
              <li key={item.id} className="group flex items-center gap-0.5">
                <Link
                  href={item.href!}
                  onClick={onNavigate}
                  className={cn(
                    "min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    active
                      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/85",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {item.title}
                </Link>
                <button
                  type="button"
                  className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-70 transition-opacity hover:bg-sidebar-accent hover:text-foreground group-hover:opacity-100"
                  aria-label={`取消收藏「${item.title}」`}
                  onClick={() => removeFavorite(item.id)}
                >
                  <Star className="size-3.5 fill-current text-amber-600" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function NavNode({
  item,
  depth,
  onNavigate,
  forceOpen,
}: {
  item: SapNavItem;
  depth: number;
  onNavigate?: () => void;
  forceOpen?: boolean;
}) {
  const pathname = usePathname();
  const { canWriteSales } = useAuth();
  const hasChildren = (item.children?.length ?? 0) > 0;
  const planned = item.status === "planned";
  const active = !hasChildren && isNavItemActive(item, pathname);
  const branchActive = hasChildren && isNavBranchOpen(item, pathname);

  const [open, setOpen] = useState(
    () => forceOpen || isNavBranchOpen(item, pathname),
  );

  useEffect(() => {
    if (forceOpen || isNavBranchOpen(item, pathname)) setOpen(true);
  }, [item, pathname, forceOpen]);

  if (item.requireWrite && !canWriteSales) {
    return null;
  }

  const pad = depth === 0 ? 8 : 12 + depth * 12;
  const expanded = forceOpen || open;
  const Icon = item.icon;

  if (planned && !hasChildren) {
    return (
      <div
        className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground/70"
        style={{ paddingLeft: pad }}
      >
        <span className="flex min-w-0 items-center gap-2">
          {Icon ? <Icon className="size-3.5 shrink-0 opacity-70" aria-hidden /> : null}
          <span>{item.title}</span>
        </span>
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          待补
        </span>
      </div>
    );
  }

  if (hasChildren) {
    return (
      <div className="space-y-0.5">
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            branchActive && "text-foreground",
            planned && "text-muted-foreground",
          )}
          style={{ paddingLeft: pad }}
          onClick={() => {
            if (!forceOpen) setOpen((v) => !v);
          }}
          aria-expanded={expanded}
        >
          {expanded ? (
            <ChevronDown className="size-3.5 shrink-0 opacity-60" />
          ) : (
            <ChevronRight className="size-3.5 shrink-0 opacity-60" />
          )}
          {Icon ? (
            <Icon className="size-3.5 shrink-0 opacity-80" aria-hidden />
          ) : null}
          <span className="flex-1 font-medium">{item.title}</span>
          {planned ? (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              待补
            </span>
          ) : null}
        </button>
        {expanded ? (
          <div className="space-y-0.5">
            {item.children!.map((child) => (
              <NavNode
                key={child.id}
                item={child}
                depth={depth + 1}
                onNavigate={onNavigate}
                forceOpen={forceOpen}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (!item.href) return null;

  return (
    <div
      className={cn(
        "group flex items-center gap-0.5 rounded-md",
        active && "bg-sidebar-accent",
      )}
      style={{ paddingLeft: pad }}
    >
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 truncate rounded-md py-1.5 pr-1 text-sm transition-colors hover:text-sidebar-accent-foreground",
          depth === 0 ? "pl-2" : "pl-4",
          active
            ? "font-medium text-sidebar-accent-foreground"
            : "text-sidebar-foreground/85",
        )}
        aria-current={active ? "page" : undefined}
      >
        {Icon ? (
          <Icon className="size-3.5 shrink-0 opacity-80" aria-hidden />
        ) : null}
        <span className="truncate">{item.title}</span>
      </Link>
      <FavoriteStarButton itemId={item.id} labeled={item.title} />
    </div>
  );
}

function NavSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="搜索功能…"
        aria-label="搜索菜单"
        className="h-8 bg-background/60 pr-8 pl-8 text-sm"
      />
      {value ? (
        <button
          type="button"
          className="absolute top-1/2 right-1.5 inline-flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          aria-label="清除搜索"
          onClick={() => onChange("")}
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

export function SapSandboxSidebar({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const [query, setQuery] = useState("");
  const searching = query.trim().length > 0;

  const filteredNav = useMemo(
    () => filterNavTree(SAP_SANDBOX_NAV, query),
    [query],
  );
  const resultCount = useMemo(
    () => countNavLeaves(filteredNav),
    [filteredNav],
  );

  return (
    <nav
      className={cn("flex h-full flex-col gap-3", className)}
      aria-label="SAP 沙盒菜单"
    >
      <NavSearch value={query} onChange={setQuery} />

      <FavoritesSection onNavigate={onNavigate} query={query} />

      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
        <div className="flex items-baseline justify-between gap-2 px-2 pb-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {searching ? "搜索结果" : "全部功能"}
          </span>
          {searching ? (
            <span className="text-[11px] text-muted-foreground">
              {resultCount} 项
            </span>
          ) : null}
        </div>
        {searching && filteredNav.length === 0 ? (
          <p className="px-2 py-2 text-xs text-muted-foreground">
            未找到与「{query.trim()}」匹配的功能
          </p>
        ) : (
          filteredNav.map((item) => (
            <NavNode
              key={item.id}
              item={item}
              depth={0}
              onNavigate={onNavigate}
              forceOpen={searching}
            />
          ))
        )}
      </div>

      <p className="border-t border-sidebar-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
        收藏存于本机 localStorage，刷新保留；未对接账号同步。
      </p>
    </nav>
  );
}
