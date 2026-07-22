"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "./button";
import { Input, Textarea } from "./input";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { BrandProfile } from "@/lib/types";

interface FormState {
  businessName: string;
  country: string;
  website: string;
  logoUrl: string;
  description: string;
}

const EMPTY: FormState = { businessName: "", country: "", website: "", logoUrl: "", description: "" };

export function BrandProfileForm() {
  const { token } = useAuth();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    /* eslint-disable react-hooks/set-state-in-effect -- loading an existing profile on mount is what this effect does */
    setIsLoading(true);
    apiFetch<BrandProfile>("/brands/me", { token })
      .then((brand) =>
        setForm({
          businessName: brand.businessName,
          country: brand.country,
          website: brand.website ?? "",
          logoUrl: brand.logoUrl ?? "",
          description: brand.description ?? "",
        }),
      )
      .catch((err) => {
        // A brand profile doesn't exist yet - that's expected for a brand new account, not an error to show.
        if (!(err instanceof ApiError && err.status === 404)) {
          setError(err instanceof ApiError ? err.message : "No pudimos cargar tu perfil.");
        }
      })
      .finally(() => setIsLoading(false));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);
    setError(null);
    try {
      await apiFetch<BrandProfile>("/brands/me", {
        method: "PUT",
        token,
        body: {
          businessName: form.businessName,
          country: form.country,
          website: form.website || undefined,
          logoUrl: form.logoUrl || undefined,
          description: form.description || undefined,
        },
      });
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos guardar tu perfil.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <p className="text-sm text-muted">Cargando…</p>;

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-4 rounded-3xl border border-border bg-surface p-6 shadow-sm">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Nombre de la marca</label>
        <Input required value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">País</label>
        <Input required value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="MX" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Sitio web</label>
        <Input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://…" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Logo (URL)</label>
        <Input type="url" value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://…" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Descripción</label>
        <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>

      {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {savedAt && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Perfil guardado.</p>}

      <Button type="submit" disabled={isSaving}>
        {isSaving ? "Guardando…" : "Guardar perfil"}
      </Button>
    </form>
  );
}
