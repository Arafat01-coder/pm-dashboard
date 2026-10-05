"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { can as canFn } from "@/lib/permissions";
import type { Permission, PublicUser } from "@/types/auth";

type AuthStatus = "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: PublicUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  /** After a flow that signs the user in on the server (e.g. accepting an invite). */
  setSignedInUser: (user: PublicUser) => void;
  can: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  /** User resolved on the server, so the UI never flashes a signed-out state. */
  initialUser: PublicUser | null;
  children: React.ReactNode;
}

export function AuthProvider({ initialUser, children }: AuthProviderProps) {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(initialUser);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        setUser((await res.json()).user);
      } else if (res.status === 401) {
        setUser(null);
        router.replace("/login");
      }
    } catch {
      // Network error: keep the current state, the next check will retry.
    }
  }, [router]);

  const login: AuthContextValue["login"] = useCallback(async (email, password) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error ?? "Login failed" };
      setUser(data.user);
      return { ok: true };
    } catch {
      return { ok: false, error: "Could not reach the server. Check your connection." };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      router.replace("/login");
      router.refresh();
    }
  }, [router]);

  // Detect sessions that expired while the tab was in the background.
  useEffect(() => {
    if (!user) return;
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user, refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status: user ? "authenticated" : "unauthenticated",
      isAuthenticated: !!user,
      login,
      logout,
      refresh,
      setSignedInUser: setUser,
      can: (permission) => canFn(user, permission),
    }),
    [user, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
