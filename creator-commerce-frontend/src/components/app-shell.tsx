"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Users,
  Megaphone,
  Handshake,
  UserCircle,
  Heart,
  ShieldCheck,
  LogOut,
  Menu,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "./logo";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "./ui/drawer";
import { Separator } from "./ui/separator";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import type { UserRole } from "@/lib/types";

const ROLE_LABEL: Record<string, string> = {
  CREATOR: "Creador",
  BRAND: "Marca",
  ADMIN: "Admin",
};

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

const BASE_NAV_LINKS: NavLink[] = [
  { href: "/creators", label: "Creadores", icon: Users },
  { href: "/campaigns", label: "Campañas", icon: Megaphone },
  { href: "/collaborations", label: "Colaboraciones", icon: Handshake },
  { href: "/profile", label: "Mi perfil", icon: UserCircle },
];

function navLinksFor(role: UserRole): NavLink[] {
  return [
    ...BASE_NAV_LINKS,
    ...(role === "BRAND" ? [{ href: "/favorites", label: "Favoritos", icon: Heart }] : []),
    ...(role === "ADMIN" ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }] : []),
  ];
}

function initials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Cambiar tema"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="hidden dark:block" />
      <Moon className="block dark:hidden" />
    </Button>
  );
}

function NavList({ links, pathname, onNavigate }: { links: NavLink[]; pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => {
        const Icon = link.icon;
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-primary/10 text-primary" : "text-muted hover:bg-sidebar-accent hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return <div className="flex flex-1 items-center justify-center text-sm text-muted">Cargando…</div>;
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const navLinks = navLinksFor(user.role);

  return (
    <div className="flex min-h-full flex-1 bg-background">
      {/* Sidebar - fixed, desktop only */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 md:flex">
        <div className="px-2">
          <Logo />
        </div>
        <Separator className="my-5" />
        <NavList links={navLinks} pathname={pathname} />
        <div className="mt-auto flex flex-col gap-3 px-2">
          <Separator />
          <div className="flex items-center gap-2.5">
            <Avatar className="size-9">
              <AvatarFallback>{initials(user.email)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{user.email}</p>
              <p className="text-xs text-muted">{ROLE_LABEL[user.role] ?? user.role}</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" className="justify-start rounded-lg" onClick={handleLogout}>
            <LogOut />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3 md:hidden">
            <Drawer open={mobileOpen} onOpenChange={setMobileOpen} direction="left">
              <DrawerTrigger asChild>
                <Button type="button" variant="ghost" size="icon" aria-label="Abrir menú">
                  <Menu />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="left-0 right-auto max-w-72 border-l-0 border-r border-border">
                <div className="mb-5 px-2">
                  <Logo />
                </div>
                <NavList links={navLinks} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
                <div className="mt-6 flex flex-col gap-3 px-2">
                  <Separator />
                  <p className="truncate text-sm text-muted">{user.email}</p>
                  <Button variant="secondary" size="sm" className="justify-start rounded-lg" onClick={handleLogout}>
                    <LogOut />
                    Cerrar sesión
                  </Button>
                </div>
              </DrawerContent>
            </Drawer>
            <Logo />
          </div>
          <div className="hidden md:block" />
          <ThemeToggle />
        </header>

        <main className="flex flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
