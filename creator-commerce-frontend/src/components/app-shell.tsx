"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "./logo";
import { useAuth } from "@/lib/auth-context";

const ROLE_LABEL: Record<string, string> = {
  CREATOR: "Creador",
  BRAND: "Marca",
  ADMIN: "Admin",
};

const BASE_NAV_LINKS = [
  { href: "/creators", label: "Creadores" },
  { href: "/campaigns", label: "Campañas" },
  { href: "/collaborations", label: "Colaboraciones" },
  { href: "/profile", label: "Mi perfil" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return <div className="flex flex-1 items-center justify-center text-sm text-muted">Cargando…</div>;
  }

  const navLinks = [
    ...BASE_NAV_LINKS,
    ...(user.role === "BRAND" ? [{ href: "/favorites", label: "Favoritos" }] : []),
    ...(user.role === "ADMIN" ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-background/90 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden items-center gap-1 sm:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  pathname === link.href ? "bg-brand-pill text-foreground" : "text-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
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
      <nav className="flex items-center gap-1 border-b border-border px-4 py-2 sm:hidden">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              pathname === link.href ? "bg-brand-pill text-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <main className="flex flex-1 flex-col px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
