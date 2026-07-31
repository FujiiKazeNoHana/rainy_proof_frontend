"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { setUnauthorizedHandler } from "@/shared/lib/api-client";
import { canReadSales, canWriteSales } from "./roles";
import { clearSession, loadSession } from "./session";
import type { AuthProfile, AuthSession, DevTokenRequest } from "./types";
import {
  checkGatewayHealth,
  fetchAuthProfiles,
  requestDevToken,
} from "./api";

type AuthContextValue = {
  session: AuthSession | null;
  ready: boolean;
  isAuthenticated: boolean;
  canWriteSales: boolean;
  canReadSales: boolean;
  login: (request?: DevTokenRequest) => Promise<AuthSession>;
  loginWithProfile: (profile: AuthProfile) => Promise<AuthSession>;
  logout: () => void;
  refreshFromStorage: () => void;
  loadProfiles: () => Promise<AuthProfile[]>;
  checkHealth: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);

  const refreshFromStorage = useCallback(() => {
    setSession(loadSession());
  }, []);

  useEffect(() => {
    refreshFromStorage();
    setReady(true);
    setUnauthorizedHandler(() => {
      clearSession();
      setSession(null);
      if (typeof window === "undefined") return;
      const path = window.location.pathname;
      if (
        path.startsWith("/ergo/sap-sandbox") &&
        !path.includes("/login")
      ) {
        const returnTo = encodeURIComponent(path + window.location.search);
        window.location.assign(
          `/ergo/sap-sandbox/login?returnTo=${returnTo}`,
        );
      }
    });
    return () => setUnauthorizedHandler(null);
  }, [refreshFromStorage]);

  const login = useCallback(async (request: DevTokenRequest = {}) => {
    const next = await requestDevToken(request);
    setSession(next);
    return next;
  }, []);

  const loginWithProfile = useCallback(
    async (profile: AuthProfile) => {
      return login({
        subject: `dev-${profile.name.toLowerCase()}`,
        displayName: profile.description || profile.name,
        roles: profile.roles,
      });
    },
    [login],
  );

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      ready,
      isAuthenticated: !!session?.accessToken,
      canWriteSales: canWriteSales(session?.roles ?? []),
      canReadSales: canReadSales(session?.roles ?? []),
      login,
      loginWithProfile,
      logout,
      refreshFromStorage,
      loadProfiles: fetchAuthProfiles,
      checkHealth: checkGatewayHealth,
    }),
    [session, ready, login, loginWithProfile, logout, refreshFromStorage],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
