"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ShoppingBag } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
    <main className="relative flex flex-1 flex-col overflow-hidden">
      {/* Decorative aurora blobs - purely visual, sit behind everything and never intercept clicks. */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-32 size-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-24 top-40 size-80 rounded-full bg-chart-5/20 blur-3xl" />
        <div className="absolute left-1/3 top-96 size-96 rounded-full bg-chart-4/10 blur-3xl" />
      </div>

      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Logo />
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost">Iniciar sesión</Button>
          </Link>
          <Link href="/register">
            <Button variant="secondary">Crear cuenta</Button>
          </Link>
        </div>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center px-4 py-16 text-center sm:py-24"
      >
        <Badge variant="gradient" className="mb-4 px-4 py-1.5">
          <ShoppingBag className="size-3.5" />
          Amazon · Mercado Libre · TikTok Shop
        </Badge>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          El marketplace donde marcas y creadores hacen match para vender más.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          Conectá con el creador o la marca correcta para tus campañas de afiliados, con reputación real, chat integrado y
          cero vueltas.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/register?role=CREATOR">
            <Button size="lg" className="w-full sm:w-auto">
              Soy creador de contenido
              <ArrowRight />
            </Button>
          </Link>
          <Link href="/register?role=BRAND">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              Soy una marca
            </Button>
          </Link>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
        className="mx-auto grid w-full max-w-5xl gap-6 px-4 pb-20 sm:grid-cols-2 sm:px-8"
      >
        <Card className="relative overflow-hidden p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-chart-5/10 blur-2xl" />
          <Badge variant="pink" className="mb-4">
            Para creadores
          </Badge>
          <ul className="flex flex-col gap-3 text-sm">
            {CREATOR_FEATURES.map((f) => (
              <li key={f} className="flex gap-2.5">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-chart-5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="relative overflow-hidden p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-success/10 blur-2xl" />
          <Badge variant="success" className="mb-4">
            Para marcas
          </Badge>
          <ul className="flex flex-col gap-3 text-sm">
            {BRAND_FEATURES.map((f) => (
              <li key={f} className="flex gap-2.5">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </Card>
      </motion.section>

      <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted sm:px-8">
        creator.hub · Marketplace P2P de marcas y creadores
      </footer>
    </main>
  );
}
