"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "./logo";
import { useAuth } from "@/lib/auth-context";

const ROLE_LABEL: Record<string, string> = {
  CREATOR: "Creador",
  BRAND: "Marca",
  ADMIN: "Admin",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return <div className="flex flex-1 items-center justify-center text-sm text-muted">Cargando…</div>;
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur sm:px-6">
        <Logo />
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted sm:inline">
            {user.email} · {ROLE_LABEL[user.role] ?? user.role}
          </span>
          <button
            type="button"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-medium hover:bg-brand-pill/60"
          >
            Cerrar sesión
          </button>
        </div>
      </header>
      <main className="flex flex-1 flex-col px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
