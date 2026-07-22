"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "./api";
import type { AuthUser, LoginResponse, UserRole } from "./types";

const STORAGE_KEY = "creator-commerce-auth";

interface StoredAuth {
  token: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (email: string, password: string, role: UserRole) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Reading persisted auth on mount and hydrating state is exactly what
    // this effect exists to do - not a render-derivable value, so it can't
    // be moved out of an effect.
    /* eslint-disable react-hooks/set-state-in-effect */
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const stored: StoredAuth = JSON.parse(raw);
        setToken(stored.token);
        setUser(stored.user);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function persist(stored: StoredAuth) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    setToken(stored.token);
    setUser(stored.user);
  }

  async function login(email: string, password: string) {
    const res = await apiFetch<LoginResponse>("/auth/login", { method: "POST", body: { email, password } });
    persist({ token: res.accessToken, user: res.user });
    return res.user;
  }

  async function register(email: string, password: string, role: UserRole) {
    const res = await apiFetch<LoginResponse>("/auth/register", { method: "POST", body: { email, password, role } });
    persist({ token: res.accessToken, user: res.user });
    return res.user;
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
