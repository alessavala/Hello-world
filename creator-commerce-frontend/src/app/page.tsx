"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/button";
import { useAuth } from "@/lib/auth-context";

const CREATOR_FEATURES = [
  "Armá tu Creator Passport con tu historial real de campañas.",
  "Conectá tus redes y portfolio de TikTok e Instagram sin subir nada.",
  "Aplicá o recibí invitaciones directas de marcas.",
];

const BRAND_FEATURES = [
  "Descubrí creadores por nicho, marketplace y métricas reales.",
  "Publicá campañas y gestioná aplicaciones en un solo lugar.",
  "Guardá tus creadores favoritos y chateá sin salir de la plataforma.",
];

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Sending an already-authenticated visitor straight to the app is what
    // this effect does - not something derivable from render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!isLoading && user) router.replace("/creators");
  }, [isLoading, user, router]);

  if (isLoading || user) return null;

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Logo />
        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-full px-4 py-2 text-sm font-medium text-muted hover:text-foreground">
            Iniciar sesión
          </Link>
          <Link href="/register">
            <Button variant="secondary">Crear cuenta</Button>
          </Link>
        </div>
      </header>

      <section className="flex flex-col items-center px-4 py-16 text-center sm:py-24">
        <span className="mb-4 inline-flex items-center rounded-full bg-accent-yellow/20 px-4 py-1.5 text-sm font-semibold text-accent-yellow-foreground">
          Amazon · Mercado Libre · TikTok Shop
        </span>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          El marketplace donde marcas y creadores hacen match para vender más.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          Conectá con el creador o la marca correcta para tus campañas de afiliados, con reputación real, chat integrado y
          cero vueltas.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/register?role=CREATOR">
            <Button className="w-full sm:w-auto">Soy creador de contenido</Button>
          </Link>
          <Link href="/register?role=BRAND">
            <Button variant="secondary" className="w-full sm:w-auto">
              Soy una marca
            </Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-6 px-4 pb-20 sm:grid-cols-2 sm:px-8">
        <div className="rounded-3xl border border-border bg-surface p-8 shadow-sm">
          <span className="mb-3 inline-flex rounded-full bg-accent-pink/15 px-3 py-1 text-xs font-semibold text-accent-pink">
            Para creadores
          </span>
          <ul className="flex flex-col gap-3 text-sm">
            {CREATOR_FEATURES.map((f) => (
              <li key={f} className="flex gap-2">
                <span className="text-accent-pink">●</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-border bg-surface p-8 shadow-sm">
          <span className="mb-3 inline-flex rounded-full bg-accent-olive/15 px-3 py-1 text-xs font-semibold text-accent-olive">
            Para marcas
          </span>
          <ul className="flex flex-col gap-3 text-sm">
            {BRAND_FEATURES.map((f) => (
              <li key={f} className="flex gap-2">
                <span className="text-accent-olive">●</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted sm:px-8">
        creator.hub · Marketplace P2P de marcas y creadores
      </footer>
    </main>
  );
}
