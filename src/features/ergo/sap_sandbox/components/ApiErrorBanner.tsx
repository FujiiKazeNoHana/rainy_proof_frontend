"use client";

import { ApiError } from "@/shared/lib/api-client";
import { useSapI18n } from "../i18n";

export function ApiErrorBanner({ error }: { error: unknown }) {
  const { t, errorMessage } = useSapI18n();
  if (!error) return null;

  const code = error instanceof ApiError ? error.errorCode : null;
  const message =
    error instanceof ApiError
      ? errorMessage(code, error.message)
      : error instanceof Error
        ? error.message
        : t("common.requestFailed");
  const details =
    error instanceof ApiError
      ? error.errors
          .map((e) => {
            const loc =
              e.lineNo != null
                ? t("common.linePrefix", { lineNo: e.lineNo })
                : e.field || "";
            return `${loc ? `${loc}: ` : ""}${e.message || e.code || ""}`;
          })
          .filter(Boolean)
      : [];

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      <div className="font-medium">
        {code ? `[${code}] ` : ""}
        {message}
      </div>
      {details.length > 0 ? (
        <ul className="mt-1 list-disc pl-5 text-destructive/90">
          {details.map((d, i) => (
            <li key={`${d}-${i}`}>{d}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
