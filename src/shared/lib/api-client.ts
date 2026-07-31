/**
 * Thin shared HTTP helper for feature API modules.
 * CSR calls Gateway via NEXT_PUBLIC_API_BASE (default http://localhost:5100).
 */

import { clearSession, getAccessToken } from "@/shared/auth/session";

export type ApiResultErrorItem = {
  lineNo?: number | null;
  field?: string | null;
  code?: string | null;
  message?: string | null;
};

export type ApiResult<T> = {
  success: boolean;
  data?: T | null;
  errorCode?: string | null;
  message?: string | null;
  errors?: ApiResultErrorItem[] | null;
};

export class ApiError extends Error {
  readonly status: number;
  readonly errorCode: string | null;
  readonly errors: ApiResultErrorItem[];
  readonly body: unknown;

  constructor(
    status: number,
    message: string,
    options?: {
      errorCode?: string | null;
      errors?: ApiResultErrorItem[] | null;
      body?: unknown;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errorCode = options?.errorCode ?? null;
    this.errors = options?.errors ?? [];
    this.body = options?.body;
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  /** Override Bearer token; default reads sessionStorage auth. */
  token?: string | null;
  body?: unknown;
  /** When false, skip Authorization header. */
  auth?: boolean;
  /** When false, return raw JSON without ApiResult unwrapping. */
  unwrapApiResult?: boolean;
}

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

export function getApiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE?.trim();
  return (base && base.length > 0 ? base : "http://localhost:5100").replace(
    /\/$/,
    "",
  );
}

export function resolveApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const base = getApiBase();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiFetch<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    token,
    body,
    headers,
    auth = true,
    unwrapApiResult = true,
    ...rest
  } = options;

  const resolvedToken = token === undefined ? getAccessToken() : token;
  const res = await fetch(resolveApiUrl(path), {
    ...rest,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(auth && resolvedToken
        ? { Authorization: `Bearer ${resolvedToken}` }
        : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (res.status === 401) {
    clearSession();
    unauthorizedHandler?.();
    throw new ApiError(401, "未登录或登录已过期", {
      errorCode: "UNAUTHORIZED",
      body: data,
    });
  }

  if (unwrapApiResult && isApiResult(data)) {
    if (!data.success || !res.ok) {
      throw new ApiError(
        res.status,
        data.message || res.statusText || `Request failed (${res.status})`,
        {
          errorCode: data.errorCode ?? null,
          errors: data.errors ?? [],
          body: data,
        },
      );
    }
    return data.data as T;
  }

  if (!res.ok) {
    let message = res.statusText || `Request failed (${res.status})`;
    let errorCode: string | null = null;
    let errors: ApiResultErrorItem[] = [];
    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      if (typeof obj.message === "string") message = obj.message;
      if (typeof obj.errorCode === "string") errorCode = obj.errorCode;
      if (Array.isArray(obj.errors)) errors = obj.errors as ApiResultErrorItem[];
    }
    throw new ApiError(res.status, message, { errorCode, errors, body: data });
  }

  return data as T;
}

function isApiResult(value: unknown): value is ApiResult<unknown> {
  return (
    !!value &&
    typeof value === "object" &&
    "success" in value &&
    typeof (value as { success: unknown }).success === "boolean"
  );
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
