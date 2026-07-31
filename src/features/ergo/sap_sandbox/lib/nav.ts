import type { LucideIcon } from "lucide-react";
import {
  Code2,
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  Warehouse,
} from "lucide-react";
import {
  FEATURE_LOGIN_ROUTE,
  FEATURE_ROUTE,
  SALES_ORDERS_ROUTE,
} from "../constants";

export type NavItemStatus = "ready" | "planned";

export type SapNavItem = {
  id: string;
  title: string;
  href?: string;
  /** lucide-react icon；建议一级菜单配置，便于扫读 */
  icon?: LucideIcon;
  /** Match nested routes under this href as active (e.g. order detail). */
  matchPrefix?: string;
  status?: NavItemStatus;
  requireAuth?: boolean;
  requireWrite?: boolean;
  children?: SapNavItem[];
};

/**
 * SAP 沙盒侧栏菜单树。后续模块（库存/采购等）在此追加即可。
 *
 * 一级图标（lucide-react，项目已依赖）：
 * - 概览 LayoutDashboard · 开发 Code2 · 销售 ShoppingBag
 * - 库存 Warehouse · 采购 ShoppingCart
 */
export const SAP_SANDBOX_NAV: SapNavItem[] = [
  {
    id: "overview",
    title: "概览",
    href: FEATURE_ROUTE,
    icon: LayoutDashboard,
  },
  {
    id: "dev",
    title: "开发",
    icon: Code2,
    children: [
      {
        id: "login",
        title: "开发登录",
        href: FEATURE_LOGIN_ROUTE,
      },
    ],
  },
  {
    id: "sales",
    title: "销售",
    icon: ShoppingBag,
    children: [
      {
        id: "sales-orders",
        title: "销售订单",
        matchPrefix: SALES_ORDERS_ROUTE,
        children: [
          {
            id: "orders-list",
            title: "订单列表",
            href: SALES_ORDERS_ROUTE,
            matchPrefix: SALES_ORDERS_ROUTE,
            requireAuth: true,
          },
          {
            id: "orders-new",
            title: "新建订单",
            href: `${SALES_ORDERS_ROUTE}/new`,
            requireAuth: true,
            requireWrite: true,
          },
        ],
      },
    ],
  },
  {
    id: "inventory",
    title: "库存",
    icon: Warehouse,
    status: "planned",
    children: [
      {
        id: "stock-query",
        title: "库存查询",
        status: "planned",
      },
      {
        id: "goods-movement",
        title: "货物移动",
        status: "planned",
      },
    ],
  },
  {
    id: "procurement",
    title: "采购",
    icon: ShoppingCart,
    status: "planned",
    children: [
      {
        id: "purchase-orders",
        title: "采购订单",
        status: "planned",
      },
    ],
  },
];

export function isNavItemActive(
  item: SapNavItem,
  pathname: string,
): boolean {
  if (item.href) {
    if (item.href === FEATURE_ROUTE) {
      return pathname === FEATURE_ROUTE || pathname === `${FEATURE_ROUTE}/`;
    }
    if (item.href === SALES_ORDERS_ROUTE) {
      // 列表页激活；新建/详情不算「列表」独占，但 matchPrefix 用于父级展开
      return (
        pathname === SALES_ORDERS_ROUTE || pathname === `${SALES_ORDERS_ROUTE}/`
      );
    }
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      return true;
    }
  }
  if (item.matchPrefix) {
    return (
      pathname === item.matchPrefix ||
      pathname.startsWith(`${item.matchPrefix}/`)
    );
  }
  return false;
}

export function isNavBranchOpen(
  item: SapNavItem,
  pathname: string,
): boolean {
  if (isNavItemActive(item, pathname)) return true;
  return (item.children ?? []).some((child) => isNavBranchOpen(child, pathname));
}

/** Leaf items that can be opened (have href, not planned). */
export function collectFavoriteableNavItems(
  items: SapNavItem[] = SAP_SANDBOX_NAV,
): SapNavItem[] {
  const out: SapNavItem[] = [];
  for (const item of items) {
    if (item.children?.length) {
      out.push(...collectFavoriteableNavItems(item.children));
      continue;
    }
    if (item.href && item.status !== "planned") {
      out.push(item);
    }
  }
  return out;
}

export function findNavItemById(
  id: string,
  items: SapNavItem[] = SAP_SANDBOX_NAV,
): SapNavItem | null {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children?.length) {
      const found = findNavItemById(id, item.children);
      if (found) return found;
    }
  }
  return null;
}

function normalizeNavQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function navItemMatchesQuery(item: SapNavItem, query: string): boolean {
  const q = normalizeNavQuery(query);
  if (!q) return true;
  return (
    item.title.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)
  );
}

/**
 * Filter menu tree by title/id. Matching parents keep all children;
 * otherwise only matching descendants are kept.
 */
export function filterNavTree(
  items: SapNavItem[],
  query: string,
): SapNavItem[] {
  const q = normalizeNavQuery(query);
  if (!q) return items;

  const walk = (item: SapNavItem): SapNavItem | null => {
    const selfMatch = navItemMatchesQuery(item, q);
    if (!item.children?.length) {
      return selfMatch ? item : null;
    }
    const children = item.children
      .map(walk)
      .filter((c): c is SapNavItem => c != null);
    if (selfMatch) {
      return { ...item, children: item.children };
    }
    if (children.length === 0) return null;
    return { ...item, children };
  };

  return items.map(walk).filter((c): c is SapNavItem => c != null);
}

export function countNavLeaves(items: SapNavItem[]): number {
  let n = 0;
  for (const item of items) {
    if (item.children?.length) n += countNavLeaves(item.children);
    else n += 1;
  }
  return n;
}
