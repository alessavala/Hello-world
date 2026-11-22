"use client";

import { FormEvent, useState } from "react";
import { Button } from "../button";
import { Input } from "../input";
import { Select } from "../select";
import { apiFetch, ApiError } from "@/lib/api";
import { translateApiError } from "@/lib/error-messages";
import { useAuth } from "@/lib/auth-context";
import type { CreatorMarketplace, Marketplace } from "@/lib/types";

const MARKETPLACES: Marketplace[] = ["AMAZON", "MERCADO_LIBRE", "TIKTOK_SHOP"];
const MARKETPLACE_LABEL: Record<Marketplace, string> = { AMAZON: "Amazon", MERCADO_LIBRE: "Mercado Libre", TIKTOK_SHOP: "TikTok Shop" };

interface MarketplaceFormState {
  profileUrl: string;
  availableForLive: boolean;
  availableForProductCollab: boolean;
}

const EMPTY_FORM: MarketplaceFormState = { profileUrl: "", availableForLive: false, availableForProductCollab: false };

function TikTokShopFields({
  form,
  onChange,
}: {
  form: MarketplaceFormState;
  onChange: (form: MarketplaceFormState) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.availableForLive}
          onChange={(e) => onChange({ ...form, availableForLive: e.target.checked })}
        />
        Disponible para lives
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.availableForProductCollab}
          onChange={(e) => onChange({ ...form, availableForProductCollab: e.target.checked })}
        />
        Disponible para colaboraciones por producto
      </label>
    </div>
  );
}

export function MarketplacesSection({ marketplaces, onChange }: { marketplaces: CreatorMarketplace[]; onChange: () => void }) {
  const { token } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [marketplace, setMarketplace] = useState<Marketplace>("AMAZON");
  const [form, setForm] = useState<MarketplaceFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<MarketplaceFormState>(EMPTY_FORM);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

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
        body: {
          marketplace,
          profileUrl: form.profileUrl || undefined,
          ...(marketplace === "TIKTOK_SHOP"
            ? { availableForLive: form.availableForLive, availableForProductCollab: form.availableForProductCollab }
            : {}),
        },
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      onChange();
    } catch (err) {
      setError(err instanceof ApiError ? translateApiError(err.message) : "No pudimos agregar el marketplace.");
    } finally {
      setIsSaving(false);
    }
  }

  function startEdit(m: CreatorMarketplace) {
    setEditingId(m.id);
    setEditError(null);
    setEditForm({
      profileUrl: m.profileUrl ?? "",
      availableForLive: m.availableForLive,
      availableForProductCollab: m.availableForProductCollab,
    });
  }

  async function handleSaveEdit(e: FormEvent, m: CreatorMarketplace) {
    e.preventDefault();
    if (!token) return;
    setIsSavingEdit(true);
    setEditError(null);
    try {
      await apiFetch(`/creators/me/marketplaces/${m.id}`, {
        method: "PATCH",
        token,
        body: {
          profileUrl: editForm.profileUrl || undefined,
          ...(m.marketplace === "TIKTOK_SHOP"
            ? { availableForLive: editForm.availableForLive, availableForProductCollab: editForm.availableForProductCollab }
            : {}),
        },
      });
      setEditingId(null);
      onChange();
    } catch (err) {
      setEditError(err instanceof ApiError ? translateApiError(err.message) : "No pudimos guardar los cambios.");
    } finally {
      setIsSavingEdit(false);
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
          <li key={m.id} className="rounded-2xl border border-border px-4 py-2.5 text-sm">
            {editingId === m.id ? (
              <form onSubmit={(e) => handleSaveEdit(e, m)} className="flex flex-col gap-3">
                <strong>{MARKETPLACE_LABEL[m.marketplace]}</strong>
                <Input
                  type="url"
                  placeholder="Link a tu perfil/tienda (opcional)"
                  value={editForm.profileUrl}
                  onChange={(e) => setEditForm({ ...editForm, profileUrl: e.target.value })}
                />
                {m.marketplace === "TIKTOK_SHOP" && <TikTokShopFields form={editForm} onChange={setEditForm} />}
                {editError && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{editError}</p>}
                <div className="flex gap-2">
                  <Button type="submit" disabled={isSavingEdit} className="w-fit">
                    {isSavingEdit ? "Guardando…" : "Guardar"}
                  </Button>
                  <Button type="button" variant="secondary" className="w-fit" onClick={() => setEditingId(null)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <span className="flex flex-col gap-0.5">
                  <span>
                    <strong>{MARKETPLACE_LABEL[m.marketplace]}</strong>{" "}
                    {m.verified ? (
                      <span className="text-emerald-600">✓ Verificado</span>
                    ) : (
                      <span className="text-muted">Pendiente de verificación</span>
                    )}
                  </span>
                  {m.profileUrl && (
                    <a href={m.profileUrl} target="_blank" rel="noreferrer" className="truncate text-xs text-muted underline">
                      {m.profileUrl}
                    </a>
                  )}
                  {m.marketplace === "TIKTOK_SHOP" && (m.availableForLive || m.availableForProductCollab) && (
                    <span className="text-xs text-muted">
                      {[m.availableForLive && "Disponible para lives", m.availableForProductCollab && "Colaboraciones por producto"]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <button type="button" onClick={() => startEdit(m)} className="text-primary hover:underline">
                    Editar
                  </button>
                  <button type="button" onClick={() => handleRemove(m.id)} className="text-rose-600 hover:underline">
                    Quitar
                  </button>
                </span>
              </div>
            )}
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
            value={form.profileUrl}
            onChange={(e) => setForm({ ...form, profileUrl: e.target.value })}
          />
          {marketplace === "TIKTOK_SHOP" && <TikTokShopFields form={form} onChange={setForm} />}
          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <Button type="submit" disabled={isSaving} className="w-fit">
            {isSaving ? "Agregando…" : "Agregar"}
          </Button>
        </form>
      )}
    </div>
  );
}
