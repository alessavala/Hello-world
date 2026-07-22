"use client";

import { FormEvent, useState } from "react";
import { Button } from "../button";
import { Input } from "../input";
import { Select } from "../select";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { CreatorMarketplace, Marketplace } from "@/lib/types";

const MARKETPLACES: Marketplace[] = ["AMAZON", "MERCADO_LIBRE", "TIKTOK_SHOP"];
const MARKETPLACE_LABEL: Record<Marketplace, string> = { AMAZON: "Amazon", MERCADO_LIBRE: "Mercado Libre", TIKTOK_SHOP: "TikTok Shop" };

export function MarketplacesSection({ marketplaces, onChange }: { marketplaces: CreatorMarketplace[]; onChange: () => void }) {
  const { token } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [marketplace, setMarketplace] = useState<Marketplace>("AMAZON");
  const [profileUrl, setProfileUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const available = MARKETPLACES.filter((m) => !marketplaces.some((existing) => existing.marketplace === m));

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);
    setError(null);
    try {
      await apiFetch("/creators/me/marketplaces", {
        method: "POST",
        token,
        body: { marketplace, profileUrl: profileUrl || undefined },
      });
      setProfileUrl("");
      setShowForm(false);
      onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos agregar el marketplace.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemove(id: string) {
    if (!token) return;
    await apiFetch(`/creators/me/marketplaces/${id}`, { method: "DELETE", token }).catch(() => {});
    onChange();
  }

  return (
    <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Marketplaces</h3>
          <p className="text-xs text-muted">Amazon, Mercado Libre y TikTok Shop donde participás. Un admin verifica la afiliación.</p>
        </div>
        {available.length > 0 && (
          <Button type="button" variant="secondary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancelar" : "+ Agregar"}
          </Button>
        )}
      </div>

      <ul className="mb-3 flex flex-col gap-2">
        {marketplaces.map((m) => (
          <li key={m.id} className="flex items-center justify-between rounded-2xl border border-border px-4 py-2.5 text-sm">
            <span>
              <strong>{MARKETPLACE_LABEL[m.marketplace]}</strong>{" "}
              {m.verified ? (
                <span className="text-emerald-600">✓ Verificado</span>
              ) : (
                <span className="text-muted">Pendiente de verificación</span>
              )}
            </span>
            <button type="button" onClick={() => handleRemove(m.id)} className="text-rose-600 hover:underline">
              Quitar
            </button>
          </li>
        ))}
      </ul>

      {showForm && (
        <form onSubmit={handleAdd} className="flex flex-col gap-3 rounded-2xl bg-background p-4">
          <Select value={marketplace} onChange={(e) => setMarketplace(e.target.value as Marketplace)}>
            {available.map((m) => (
              <option key={m} value={m}>
                {MARKETPLACE_LABEL[m]}
              </option>
            ))}
          </Select>
          <Input
            type="url"
            placeholder="Link a tu perfil/tienda (opcional)"
            value={profileUrl}
            onChange={(e) => setProfileUrl(e.target.value)}
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
