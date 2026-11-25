"use client";

import { FormEvent, useState } from "react";
import { Button } from "../button";
import { Input } from "../input";
import { Select } from "../select";
import { apiFetch, ApiError } from "@/lib/api";
import { translateApiError } from "@/lib/error-messages";
import { useAuth } from "@/lib/auth-context";
import type { PortfolioItem, SocialPlatform } from "@/lib/types";

const PLATFORMS: SocialPlatform[] = ["TIKTOK", "INSTAGRAM", "YOUTUBE", "FACEBOOK"];
const PLATFORM_LABEL: Record<SocialPlatform, string> = { TIKTOK: "TikTok", INSTAGRAM: "Instagram", YOUTUBE: "YouTube", FACEBOOK: "Facebook" };

interface FormState {
  title: string;
  contentUrl: string;
  platform: SocialPlatform;
}

const EMPTY: FormState = { title: "", contentUrl: "", platform: "TIKTOK" };

export function PortfolioSection({ items, onChange }: { items: PortfolioItem[]; onChange: () => void }) {
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
      await apiFetch("/creators/me/portfolio", {
        method: "POST",
        token,
        body: { title: form.title, contentUrl: form.contentUrl, platform: form.platform },
      });
      setForm(EMPTY);
      setShowForm(false);
      onChange();
    } catch (err) {
      setError(err instanceof ApiError ? translateApiError(err.message) : "No pudimos agregar el contenido.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemove(id: string) {
    if (!token) return;
    await apiFetch(`/creators/me/portfolio/${id}`, { method: "DELETE", token }).catch(() => {});
    onChange();
  }

  return (
    <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Portfolio</h3>
          <p className="text-xs text-muted">Pegá el link de tu video de TikTok o Instagram - no hace falta subir ni alojar nada.</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancelar" : "+ Agregar"}
        </Button>
      </div>

      {items.length === 0 && !showForm && <p className="text-sm text-muted">Todavía no agregaste contenido a tu portfolio.</p>}

      <ul className="mb-3 flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between rounded-2xl border border-border px-4 py-2.5 text-sm">
            <span>
              <strong>{PLATFORM_LABEL[item.platform]}</strong> · {item.title}
            </span>
            <button type="button" onClick={() => handleRemove(item.id)} className="text-rose-600 hover:underline">
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
            <Input required placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <Input
            required
            type="url"
            placeholder="https://www.tiktok.com/@usuario/video/…"
            value={form.contentUrl}
            onChange={(e) => setForm({ ...form, contentUrl: e.target.value })}
          />
          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <Button type="submit" disabled={isSaving} className="w-fit">
            {isSaving ? "Agregando…" : "Agregar"}
          </Button>
        </form>
      )}
    </div>
  );
}
