"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  loadSapLocale,
  saveSapLocale,
  type SapLocale,
} from "./locales";
import {
  billingStatusLabel,
  deliveryStatusLabel,
  goodsReceiptStatusLabel,
  invoiceReceiptStatusLabel,
  accountingDocumentStatusLabel,
  mapErrorMessage,
  movementTypeLabel,
  orderStatusLabel,
  purchaseOrderStatusLabel,
  translate,
  type SapMessageKey,
  type TranslateParams,
} from "./translate";

type SapI18nContextValue = {
  locale: SapLocale;
  setLocale: (locale: SapLocale) => void;
  t: (key: SapMessageKey, params?: TranslateParams) => string;
  orderStatus: (status: string, fallback?: string | null) => string;
  deliveryStatus: (status: string, fallback?: string | null) => string;
  billingStatus: (status: string, fallback?: string | null) => string;
  purchaseOrderStatus: (status: string, fallback?: string | null) => string;
  goodsReceiptStatus: (status: string, fallback?: string | null) => string;
  invoiceReceiptStatus: (status: string, fallback?: string | null) => string;
  accountingDocumentStatus: (status: string, fallback?: string | null) => string;
  movementType: (type: string, fallback?: string | null) => string;
  errorMessage: (
    errorCode: string | null | undefined,
    fallback?: string | null,
    options?: { deliveryAction?: "cancel" | "pgi" },
  ) => string;
};

const SapI18nContext = createContext<SapI18nContextValue | null>(null);

export function SapLocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SapLocale>("zh");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLocaleState(loadSapLocale());
    setReady(true);
  }, []);

  const setLocale = useCallback((next: SapLocale) => {
    setLocaleState(next);
    saveSapLocale(next);
    if (typeof document !== "undefined") {
      document.documentElement.lang = next === "zh" ? "zh-CN" : "en";
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale, ready]);

  const value = useMemo<SapI18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, params) => translate(locale, key, params),
      orderStatus: (status, fallback) =>
        orderStatusLabel(locale, status, fallback),
      deliveryStatus: (status, fallback) =>
        deliveryStatusLabel(locale, status, fallback),
      billingStatus: (status, fallback) =>
        billingStatusLabel(locale, status, fallback),
      purchaseOrderStatus: (status, fallback) =>
        purchaseOrderStatusLabel(locale, status, fallback),
      goodsReceiptStatus: (status, fallback) =>
        goodsReceiptStatusLabel(locale, status, fallback),
      invoiceReceiptStatus: (status, fallback) =>
        invoiceReceiptStatusLabel(locale, status, fallback),
      accountingDocumentStatus: (status, fallback) =>
        accountingDocumentStatusLabel(locale, status, fallback),
      movementType: (type, fallback) =>
        movementTypeLabel(locale, type, fallback),
      errorMessage: (errorCode, fallback, options) =>
        mapErrorMessage(locale, errorCode, fallback, options),
    }),
    [locale, setLocale],
  );

  return (
    <SapI18nContext.Provider value={value}>{children}</SapI18nContext.Provider>
  );
}

export function useSapI18n() {
  const ctx = useContext(SapI18nContext);
  if (!ctx) {
    throw new Error("useSapI18n must be used within SapLocaleProvider");
  }
  return ctx;
}
