"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { ApiError } from "@/lib/api";
import { translateApiError } from "@/lib/error-messages";
import { useAuth } from "@/lib/auth-context";
import type { UserRole } from "@/lib/types";

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<UserRole>(() => (searchParams.get("role") === "BRAND" ? "BRAND" : "CREATOR"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await register(email, password, role);
      router.replace("/creators");
    } catch (err) {
      setError(err instanceof ApiError ? translateApiError(err.message) : "No pudimos crear tu cuenta. Intentá de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-3xl border border-border bg-surface p-8 shadow-sm">
          <h1 className="mb-1 text-2xl font-semibold">Creá tu cuenta</h1>
          <p className="mb-6 text-sm text-muted">Elegí cómo querés usar la plataforma.</p>

          <div className="mb-6 grid grid-cols-2 gap-2 rounded-full bg-background p-1">
            <button
              type="button"
              onClick={() => setRole("CREATOR")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                role === "CREATOR" ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              Soy Creador
            </button>
            <button
              type="button"
              onClick={() => setRole("BRAND")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                role === "BRAND" ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              Soy Marca
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                Email
              </label>
              <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted">Mínimo 8 caracteres.</p>
            </div>

            {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

            <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
              {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-semibold text-foreground underline underline-offset-4">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
