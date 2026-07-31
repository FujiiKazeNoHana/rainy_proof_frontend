import { apiFetch } from "@/shared/lib/api-client";
import type {
  AuthProfile,
  AuthSession,
  DevTokenRequest,
  DevTokenResponse,
} from "./types";
import { saveSession } from "./session";

export async function fetchAuthProfiles(): Promise<AuthProfile[]> {
  return apiFetch<AuthProfile[]>("/api/auth/profiles", {
    auth: false,
    unwrapApiResult: false,
  });
}

export async function requestDevToken(
  request: DevTokenRequest = {},
): Promise<AuthSession> {
  const data = await apiFetch<DevTokenResponse>("/api/auth/dev-token", {
    method: "POST",
    auth: false,
    unwrapApiResult: false,
    body: {
      subject: request.subject,
      displayName: request.displayName,
      roles: request.roles,
    },
  });

  const session: AuthSession = {
    accessToken: data.access_token,
    tokenType: data.token_type || "Bearer",
    roles: data.roles ?? request.roles ?? [],
    displayName: request.displayName ?? "Dev User",
    subject: request.subject ?? "dev-user",
  };
  saveSession(session);
  return session;
}

export async function checkGatewayHealth(): Promise<boolean> {
  try {
    await apiFetch<{ status: string }>("/health", {
      auth: false,
      unwrapApiResult: false,
    });
    return true;
  } catch {
    return false;
  }
}
