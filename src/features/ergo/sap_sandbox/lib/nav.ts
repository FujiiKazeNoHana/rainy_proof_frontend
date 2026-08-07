import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Code2,
  LayoutDashboard,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Warehouse,
} from "lucide-react";
import type { SapMessageKey } from "../i18n";
import {
  FEATURE_LOGIN_ROUTE,
  FEATURE_ROUTE,
  FI_ACCOUNTING_UI_ENABLED,
  FINANCE_AP_ROUTE,
  FINANCE_AR_ROUTE,
  FINANCE_ROUTE,
  GOODS_RECEIPTS_ROUTE,
  INVENTORY_MOVEMENTS_ROUTE,
  INVENTORY_ROUTE,
  INVENTORY_STOCK_ROUTE,
  INVOICE_RECEIPTS_ROUTE,
  INVOICE_RECEIPTS_UI_ENABLED,
  MASTERDATA_PROCUREMENT_ROUTE,
  MASTERDATA_ROUTE,
  MASTERDATA_SALES_ROUTE,
  PROCUREMENT_ROUTE,
  PURCHASE_ORDERS_ROUTE,
  SALES_BILLING_ROUTE,
  SALES_DELIVERIES_ROUTE,
  SALES_ORDERS_ROUTE,
} from "../constants";

export type NavItemStatus = "ready" | "planned";

export type SapNavItem = {
  id: string;
  /** i18n key under nav.* (defaults to nav.{id}) */
  titleKey: SapMessageKey;
  href?: string;
  /** lucide-react icon；建议一级菜单配置，便于扫读 */
  icon?: LucideIcon;
  /** Match nested routes under this href as active (e.g. order detail). */
  matchPrefix?: string;
  status?: NavItemStatus;
  requireAuth?: boolean;
  /** 销售订单写（Admin / SalesClerk） */
  requireWrite?: boolean;
  /** 外向交货写（Admin / Inventory） */
  requireDeliveryWrite?: boolean;
  /** 开票创建（仅 Admin） */
  requireBillingWrite?: boolean;
  /** 手工库存调整（Admin / Inventory） */
  requireInventoryAdjust?: boolean;
  /** 采购主数据读（Admin / Buyer） */
  requireProcurementMd?: boolean;
  /** 采购订单写（Admin / Buyer） */
  requirePoWrite?: boolean;
  /** 收货过账（Admin / Inventory） */
  requireGrPost?: boolean;
  /** 发票校验写（Admin / Buyer）；且受 INVOICE_RECEIPTS_UI_ENABLED 门控 */
  requireIrUi?: boolean;
  /** 财务应收读（Admin / SalesClerk） */
  requireArRead?: boolean;
  /** 财务应付读（Admin / Buyer） */
  requireApRead?: boolean;
  /** 财务 UI 总开关（FI_ACCOUNTING_UI_ENABLED） */
  requireFiUi?: boolean;
  children?: SapNavItem[];
};

/**
 * SAP 沙盒侧栏菜单树。后续模块（库存/采购等）在此追加即可。
 */
export const SAP_SANDBOX_NAV: SapNavItem[] = [
  {
    id: "overview",
    titleKey: "nav.overview",
    href: FEATURE_ROUTE,
    icon: LayoutDashboard,
  },
  {
    id: "dev",
    titleKey: "nav.dev",
    icon: Code2,
    children: [
      {
        id: "login",
        titleKey: "nav.login",
        href: FEATURE_LOGIN_ROUTE,
      },
    ],
  },
  {
    id: "sales",
    titleKey: "nav.sales",
    icon: ShoppingBag,
    children: [
      {
        id: "sales-orders",
        titleKey: "nav.sales-orders",
        matchPrefix: SALES_ORDERS_ROUTE,
        children: [
          {
            id: "orders-list",
            titleKey: "nav.orders-list",
            href: SALES_ORDERS_ROUTE,
            matchPrefix: SALES_ORDERS_ROUTE,
            requireAuth: true,
          },
          {
            id: "orders-new",
            titleKey: "nav.orders-new",
            href: `${SALES_ORDERS_ROUTE}/new`,
            requireAuth: true,
            requireWrite: true,
          },
        ],
      },
      {
        id: "sales-deliveries",
        titleKey: "nav.sales-deliveries",
        matchPrefix: SALES_DELIVERIES_ROUTE,
        children: [
          {
            id: "deliveries-list",
            titleKey: "nav.deliveries-list",
            href: SALES_DELIVERIES_ROUTE,
            matchPrefix: SALES_DELIVERIES_ROUTE,
            requireAuth: true,
          },
          {
            id: "deliveries-new",
            titleKey: "nav.deliveries-new",
            href: `${SALES_DELIVERIES_ROUTE}/new`,
            requireAuth: true,
            requireDeliveryWrite: true,
          },
        ],
      },
      {
        id: "sales-billing",
        titleKey: "nav.sales-billing",
        matchPrefix: SALES_BILLING_ROUTE,
        children: [
          {
            id: "billing-list",
            titleKey: "nav.billing-list",
            href: SALES_BILLING_ROUTE,
            matchPrefix: SALES_BILLING_ROUTE,
            requireAuth: true,
          },
          {
            id: "billing-new",
            titleKey: "nav.billing-new",
            href: `${SALES_BILLING_ROUTE}/new`,
            requireAuth: true,
            requireBillingWrite: true,
          },
        ],
      },
    ],
  },
  {
    id: "master-data",
    titleKey: "nav.master-data",
    icon: BookOpen,
    matchPrefix: MASTERDATA_ROUTE,
    children: [
      {
        id: "master-data-sales",
        titleKey: "nav.master-data-sales",
        href: MASTERDATA_SALES_ROUTE,
        matchPrefix: MASTERDATA_SALES_ROUTE,
        requireAuth: true,
      },
      {
        id: "master-data-procurement",
        titleKey: "nav.master-data-procurement",
        href: MASTERDATA_PROCUREMENT_ROUTE,
        matchPrefix: MASTERDATA_PROCUREMENT_ROUTE,
        requireAuth: true,
        requireProcurementMd: true,
      },
    ],
  },
  {
    id: "inventory",
    titleKey: "nav.inventory",
    icon: Warehouse,
    matchPrefix: INVENTORY_ROUTE,
    children: [
      {
        id: "stock-query",
        titleKey: "nav.stock-query",
        href: INVENTORY_STOCK_ROUTE,
        matchPrefix: INVENTORY_STOCK_ROUTE,
        requireAuth: true,
      },
      {
        id: "goods-movement",
        titleKey: "nav.goods-movement",
        href: INVENTORY_MOVEMENTS_ROUTE,
        matchPrefix: INVENTORY_MOVEMENTS_ROUTE,
        requireAuth: true,
      },
      {
        id: "stock-adjust",
        titleKey: "nav.stock-adjust",
        href: `${INVENTORY_STOCK_ROUTE}?adjust=1`,
        requireAuth: true,
        requireInventoryAdjust: true,
      },
    ],
  },
  {
    id: "procurement",
    titleKey: "nav.procurement",
    icon: ShoppingCart,
    matchPrefix: PROCUREMENT_ROUTE,
    children: [
      {
        id: "purchase-orders",
        titleKey: "nav.purchase-orders",
        href: PURCHASE_ORDERS_ROUTE,
        matchPrefix: PURCHASE_ORDERS_ROUTE,
        requireAuth: true,
      },
      {
        id: "purchase-orders-new",
        titleKey: "nav.purchase-orders-new",
        href: `${PURCHASE_ORDERS_ROUTE}/new`,
        requireAuth: true,
        requirePoWrite: true,
      },
      {
        id: "goods-receipts",
        titleKey: "nav.goods-receipts",
        href: GOODS_RECEIPTS_ROUTE,
        matchPrefix: GOODS_RECEIPTS_ROUTE,
        requireAuth: true,
      },
      {
        id: "invoice-receipts",
        titleKey: "nav.invoice-receipts",
        href: INVOICE_RECEIPTS_ROUTE,
        matchPrefix: INVOICE_RECEIPTS_ROUTE,
        requireAuth: true,
        requireIrUi: true,
      },
    ],
  },
  {
    id: "finance",
    titleKey: "nav.finance",
    icon: Receipt,
    matchPrefix: FINANCE_ROUTE,
    requireFiUi: true,
    children: [
      {
        id: "finance-ar",
        titleKey: "nav.finance-ar",
        href: FINANCE_AR_ROUTE,
        matchPrefix: FINANCE_AR_ROUTE,
        requireAuth: true,
        requireFiUi: true,
        requireArRead: true,
      },
      {
        id: "finance-ap",
        titleKey: "nav.finance-ap",
        href: FINANCE_AP_ROUTE,
        matchPrefix: FINANCE_AP_ROUTE,
        requireAuth: true,
        requireFiUi: true,
        requireApRead: true,
      },
    ],
  },
];

/** True when IR nav/pages may be shown (D-FE-IR-SHIP). */
export function isInvoiceReceiptsUiEnabled(): boolean {
  return INVOICE_RECEIPTS_UI_ENABLED;
}

/** True when FI nav/pages may be shown (D-FE-FI-SHIP). */
export function isFinanceAccountingUiEnabled(): boolean {
  return FI_ACCOUNTING_UI_ENABLED;
}

export function isNavItemActive(
  item: SapNavItem,
  pathname: string,
): boolean {
  if (item.href) {
    if (item.href === FEATURE_ROUTE) {
      return pathname === FEATURE_ROUTE || pathname === `${FEATURE_ROUTE}/`;
    }
    if (item.href === SALES_ORDERS_ROUTE) {
      return (
        pathname === SALES_ORDERS_ROUTE || pathname === `${SALES_ORDERS_ROUTE}/`
      );
    }
    if (item.href === SALES_DELIVERIES_ROUTE) {
      return (
        pathname === SALES_DELIVERIES_ROUTE ||
        pathname === `${SALES_DELIVERIES_ROUTE}/`
      );
    }
    if (item.href === SALES_BILLING_ROUTE) {
      return (
        pathname === SALES_BILLING_ROUTE ||
        pathname === `${SALES_BILLING_ROUTE}/`
      );
    }
    if (item.href === INVENTORY_STOCK_ROUTE) {
      return (
        pathname === INVENTORY_STOCK_ROUTE ||
        pathname === `${INVENTORY_STOCK_ROUTE}/`
      );
    }
    if (item.href === INVENTORY_MOVEMENTS_ROUTE) {
      return (
        pathname === INVENTORY_MOVEMENTS_ROUTE ||
        pathname === `${INVENTORY_MOVEMENTS_ROUTE}/`
      );
    }
    if (item.href === MASTERDATA_SALES_ROUTE) {
      return (
        pathname === MASTERDATA_SALES_ROUTE ||
        pathname === `${MASTERDATA_SALES_ROUTE}/`
      );
    }
    if (item.href === MASTERDATA_PROCUREMENT_ROUTE) {
      return (
        pathname === MASTERDATA_PROCUREMENT_ROUTE ||
        pathname === `${MASTERDATA_PROCUREMENT_ROUTE}/`
      );
    }
    if (item.href === PURCHASE_ORDERS_ROUTE) {
      return (
        pathname === PURCHASE_ORDERS_ROUTE ||
        pathname === `${PURCHASE_ORDERS_ROUTE}/`
      );
    }
    if (item.href === GOODS_RECEIPTS_ROUTE) {
      return (
        pathname === GOODS_RECEIPTS_ROUTE ||
        pathname === `${GOODS_RECEIPTS_ROUTE}/`
      );
    }
    if (item.href === INVOICE_RECEIPTS_ROUTE) {
      return (
        pathname === INVOICE_RECEIPTS_ROUTE ||
        pathname === `${INVOICE_RECEIPTS_ROUTE}/`
      );
    }
    if (item.href === FINANCE_AR_ROUTE) {
      return (
        pathname === FINANCE_AR_ROUTE || pathname === `${FINANCE_AR_ROUTE}/`
      );
    }
    if (item.href === FINANCE_AP_ROUTE) {
      return (
        pathname === FINANCE_AP_ROUTE || pathname === `${FINANCE_AP_ROUTE}/`
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

export function navItemMatchesQuery(
  item: SapNavItem,
  query: string,
  resolveTitle: (item: SapNavItem) => string,
): boolean {
  const q = normalizeNavQuery(query);
  if (!q) return true;
  return (
    resolveTitle(item).toLowerCase().includes(q) ||
    item.id.toLowerCase().includes(q)
  );
}

/**
 * Filter menu tree by title/id. Matching parents keep all children;
 * otherwise only matching descendants are kept.
 */
export function filterNavTree(
  items: SapNavItem[],
  query: string,
  resolveTitle: (item: SapNavItem) => string,
): SapNavItem[] {
  const q = normalizeNavQuery(query);
  if (!q) return items;

  const walk = (item: SapNavItem): SapNavItem | null => {
    const selfMatch = navItemMatchesQuery(item, q, resolveTitle);
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
