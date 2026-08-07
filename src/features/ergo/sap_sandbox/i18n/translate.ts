import type { SapLocale } from "./locales";
import { enMessages } from "./messages/en";
import { zhMessages, type SapMessageKey } from "./messages/zh";

export type { SapMessageKey };

export type TranslateParams = Record<string, string | number | null | undefined>;

const catalogs: Record<SapLocale, Record<SapMessageKey, string>> = {
  zh: zhMessages,
  en: enMessages,
};

export function translate(
  locale: SapLocale,
  key: SapMessageKey,
  params?: TranslateParams,
): string {
  const template = catalogs[locale][key] ?? catalogs.zh[key] ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = params[name];
    return value == null ? "" : String(value);
  });
}

export function orderStatusLabel(
  locale: SapLocale,
  status: string,
  fallback?: string | null,
): string {
  const key = `status.order.${status}` as SapMessageKey;
  if (key in catalogs.zh) {
    return translate(locale, key);
  }
  return fallback || status;
}

export function deliveryStatusLabel(
  locale: SapLocale,
  status: string,
  fallback?: string | null,
): string {
  const key = `status.delivery.${status}` as SapMessageKey;
  if (key in catalogs.zh) {
    return translate(locale, key);
  }
  return fallback || status;
}

export function billingStatusLabel(
  locale: SapLocale,
  status: string,
  fallback?: string | null,
): string {
  const key = `status.billing.${status}` as SapMessageKey;
  if (key in catalogs.zh) {
    return translate(locale, key);
  }
  return fallback || status;
}

export function purchaseOrderStatusLabel(
  locale: SapLocale,
  status: string,
  fallback?: string | null,
): string {
  const key = `status.purchaseOrder.${status}` as SapMessageKey;
  if (key in catalogs.zh) {
    return translate(locale, key);
  }
  return fallback || status;
}

export function goodsReceiptStatusLabel(
  locale: SapLocale,
  status: string,
  fallback?: string | null,
): string {
  const key = `status.goodsReceipt.${status}` as SapMessageKey;
  if (key in catalogs.zh) {
    return translate(locale, key);
  }
  return fallback || status;
}

export function invoiceReceiptStatusLabel(
  locale: SapLocale,
  status: string,
  fallback?: string | null,
): string {
  const key = `status.invoiceReceipt.${status}` as SapMessageKey;
  if (key in catalogs.zh) {
    return translate(locale, key);
  }
  return fallback || status;
}

export function accountingDocumentStatusLabel(
  locale: SapLocale,
  status: string,
  fallback?: string | null,
): string {
  const key = `status.accountingDocument.${status}` as SapMessageKey;
  if (key in catalogs.zh) {
    return translate(locale, key);
  }
  return fallback || status;
}

export function movementTypeLabel(
  locale: SapLocale,
  type: string,
  fallback?: string | null,
): string {
  const normalized = type.trim().toUpperCase();
  const key = `movementType.${normalized}` as SapMessageKey;
  if (key in catalogs.zh) {
    return translate(locale, key);
  }
  return fallback || type;
}

export function mapErrorMessage(
  locale: SapLocale,
  errorCode: string | null | undefined,
  fallback?: string | null,
  options?: { deliveryAction?: "cancel" | "pgi" },
): string {
  if (!errorCode) {
    return fallback || translate(locale, "errors.generic.requestFailed");
  }
  if (errorCode === "DELIVERY_NOT_OPEN" && options?.deliveryAction) {
    return translate(
      locale,
      options.deliveryAction === "cancel"
        ? "errors.deliveries.DELIVERY_NOT_OPEN.cancel"
        : "errors.deliveries.DELIVERY_NOT_OPEN.pgi",
    );
  }
  const inventoryKey = `errors.inventory.${errorCode}` as SapMessageKey;
  if (inventoryKey in catalogs.zh) {
    return translate(locale, inventoryKey);
  }
  const procurementKey = `errors.procurement.${errorCode}` as SapMessageKey;
  if (procurementKey in catalogs.zh) {
    return translate(locale, procurementKey);
  }
  const financeKey = `errors.finance.${errorCode}` as SapMessageKey;
  if (financeKey in catalogs.zh) {
    return translate(locale, financeKey);
  }
  const billingKey = `errors.billing.${errorCode}` as SapMessageKey;
  if (billingKey in catalogs.zh) {
    return translate(locale, billingKey);
  }
  const deliveryKey = `errors.deliveries.${errorCode}` as SapMessageKey;
  if (deliveryKey in catalogs.zh) {
    return translate(locale, deliveryKey);
  }
  const orderKey = `errors.orders.${errorCode}` as SapMessageKey;
  if (orderKey in catalogs.zh) {
    return translate(locale, orderKey);
  }
  return fallback || translate(locale, "errors.generic.actionFailed");
}
