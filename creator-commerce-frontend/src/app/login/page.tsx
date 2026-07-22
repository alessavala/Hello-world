"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { ApiError } from "@/lib/api";
import { translateApiError } from "@/lib/error-messages";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      router.replace("/creators");
    } catch (err) {
      setError(err instanceof ApiError ? translateApiError(err.message) : "No pudimos iniciar sesión. Intentá de nuevo.");
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
          <h1 className="mb-1 text-2xl font-semibold">Iniciá sesión</h1>
          <p className="mb-6 text-sm text-muted">Conectá con marcas y creadores de contenido.</p>

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
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

            <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
              {isSubmitting ? "Ingresando…" : "Ingresar"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          ¿No tenés cuenta?{" "}
          <Link href="/register" className="font-semibold text-foreground underline underline-offset-4">
            Registrate
          </Link>
        </p>
      </div>
    </main>
  );
}
