"use client";

import { FormEvent, useState } from "react";
import { Button } from "../button";
import { Input } from "../input";
import { Select } from "../select";
import { apiFetch, ApiError } from "@/lib/api";
import { translateApiError } from "@/lib/error-messages";
import { useAuth } from "@/lib/auth-context";
import type { SocialAccount, SocialPlatform } from "@/lib/types";

const PLATFORMS: SocialPlatform[] = ["TIKTOK", "INSTAGRAM", "YOUTUBE", "FACEBOOK"];
const PLATFORM_LABEL: Record<SocialPlatform, string> = { TIKTOK: "TikTok", INSTAGRAM: "Instagram", YOUTUBE: "YouTube", FACEBOOK: "Facebook" };

interface FormState {
  platform: SocialPlatform;
  username: string;
  profileUrl: string;
  followers: string;
  averageViews: string;
}

const EMPTY: FormState = { platform: "TIKTOK", username: "", profileUrl: "", followers: "", averageViews: "" };

export function SocialAccountsSection({ accounts, onChange }: { accounts: SocialAccount[]; onChange: () => void }) {
  const { token } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);
    setError(null);
    try {
      await apiFetch("/creators/me/social-accounts", {
        method: "POST",
        token,
        body: {
          platform: form.platform,
          username: form.username,
          profileUrl: form.profileUrl,
          followers: form.followers ? Number(form.followers) : undefined,
          averageViews: form.averageViews ? Number(form.averageViews) : undefined,
        },
      });
      setForm(EMPTY);
      setShowForm(false);
      onChange();
    } catch (err) {
      setError(err instanceof ApiError ? translateApiError(err.message) : "No pudimos agregar la red social.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemove(id: string) {
    if (!token) return;
    await apiFetch(`/creators/me/social-accounts/${id}`, { method: "DELETE", token }).catch(() => {});
    onChange();
  }

  return (
    <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Redes sociales</h3>
        <Button type="button" variant="secondary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancelar" : "+ Agregar"}
        </Button>
      </div>

      {accounts.length === 0 && !showForm && <p className="text-sm text-muted">Todavía no agregaste ninguna red social.</p>}

      <ul className="mb-3 flex flex-col gap-2">
        {accounts.map((a) => (
          <li key={a.id} className="flex items-center justify-between rounded-2xl border border-border px-4 py-2.5 text-sm">
            <span>
              <strong>{PLATFORM_LABEL[a.platform]}</strong> · @{a.username} · {new Intl.NumberFormat("es-MX", { notation: "compact" }).format(a.followers)} seguidores
            </span>
            <button type="button" onClick={() => handleRemove(a.id)} className="text-rose-600 hover:underline">
              Quitar
            </button>
          </li>
        ))}
      </ul>

      {showForm && (
        <form onSubmit={handleAdd} className="flex flex-col gap-3 rounded-2xl bg-background p-4">
          <div className="grid grid-cols-2 gap-3">
            <Select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value as SocialPlatform })}>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_LABEL[p]}
                </option>
              ))}
            </Select>
            <Input required placeholder="usuario" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <Input
            required
            type="url"
            placeholder="https://…"
            value={form.profileUrl}
            onChange={(e) => setForm({ ...form, profileUrl: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              min={0}
              placeholder="Seguidores"
              value={form.followers}
              onChange={(e) => setForm({ ...form, followers: e.target.value })}
            />
            <Input
              type="number"
              min={0}
              placeholder="Vistas promedio"
              value={form.averageViews}
              onChange={(e) => setForm({ ...form, averageViews: e.target.value })}
            />
          </div>
          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <Button type="submit" disabled={isSaving} className="w-fit">
            {isSaving ? "Agregando…" : "Agregar"}
          </Button>
        </form>
      )}
    </div>
  );
}
