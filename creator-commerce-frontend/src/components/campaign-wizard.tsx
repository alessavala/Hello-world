"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "./button";
import { Chip } from "./chip";
import { Input, Textarea } from "./input";
import { Select } from "./select";
import { apiFetch, ApiError } from "@/lib/api";
import { translateApiError } from "@/lib/error-messages";
import { useAuth } from "@/lib/auth-context";
import type { Campaign, Category, CompensationType, Marketplace, Product } from "@/lib/types";

const MARKETPLACES: { value: Marketplace; label: string; icon: string }[] = [
  { value: "AMAZON", label: "Amazon", icon: "📦" },
  { value: "MERCADO_LIBRE", label: "Mercado Libre", icon: "🛒" },
  { value: "TIKTOK_SHOP", label: "TikTok Shop", icon: "🎵" },
];

const COMPENSATION_OPTIONS: { value: CompensationType; label: string }[] = [
  { value: "PRODUCT_ONLY", label: "Solo producto" },
  { value: "FIXED_FEE", label: "Pago fijo" },
  { value: "EXTERNAL_COMMISSION", label: "Comisión externa" },
  { value: "HYBRID", label: "Producto + pago fijo" },
];

interface Step1State {
  categoryId: string;
  marketplace: Marketplace;
  targetCountry: string;
}

interface Step2State {
  name: string;
  description: string;
  productId: string;
  compensationType: CompensationType;
  fixedAmount: string;
  creatorsRequired: string;
  deliverableDescription: string;
  deliveryDays: string;
  minFollowers: string;
  minAverageViews: string;
}

export function CampaignWizard({ onClose, onCreated }: { onClose: () => void; onCreated: (campaign: Campaign) => void }) {
  const { token } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [step1, setStep1] = useState<Step1State>({ categoryId: "", marketplace: "TIKTOK_SHOP", targetCountry: "" });
  const [step2, setStep2] = useState<Step2State>({
    name: "",
    description: "",
    productId: "",
    compensationType: "PRODUCT_ONLY",
    fixedAmount: "",
    creatorsRequired: "1",
    deliverableDescription: "",
    deliveryDays: "14",
    minFollowers: "0",
    minAverageViews: "0",
  });

  useEffect(() => {
    apiFetch<Category[]>("/categories")
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!token) return;
    apiFetch<{ data: Product[] }>("/products/me", { token, query: { pageSize: 100 } })
      .then((res) => setProducts(res.data))
      .catch(() => setProducts([]));
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);
    setError(null);
    try {
      const campaign = await apiFetch<Campaign>("/campaigns", {
        method: "POST",
        token,
        body: {
          categoryId: step1.categoryId,
          marketplace: step1.marketplace,
          targetCountry: step1.targetCountry || undefined,
          name: step2.name,
          description: step2.description,
          productId: step2.productId || undefined,
          compensationType: step2.compensationType,
          fixedAmount: step2.compensationType === "PRODUCT_ONLY" ? undefined : Number(step2.fixedAmount) || undefined,
          creatorsRequired: Number(step2.creatorsRequired) || 1,
          deliverableDescription: step2.deliverableDescription,
          deliveryDays: Number(step2.deliveryDays) || 14,
          minFollowers: Number(step2.minFollowers) || 0,
          minAverageViews: Number(step2.minAverageViews) || 0,
        },
      });
      onCreated(campaign);
    } catch (err) {
      setError(err instanceof ApiError ? translateApiError(err.message) : "No pudimos crear la campaña.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">🚀 Crear tu campaña</h2>
          <button type="button" onClick={onClose} className="text-2xl leading-none text-muted hover:text-foreground">
            ×
          </button>
        </div>

        <div className="mb-6 h-1 rounded-full bg-background">
          <div className="h-1 rounded-full bg-accent transition-all" style={{ width: step === 1 ? "50%" : "100%" }} />
        </div>

        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div>
              <p className="mb-2 text-sm font-medium">📦 Marketplace</p>
              <div className="flex flex-wrap gap-2">
                {MARKETPLACES.map((m) => (
                  <Chip key={m.value} icon={m.icon} active={step1.marketplace === m.value} onClick={() => setStep1({ ...step1, marketplace: m.value })}>
                    {m.label}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">🗂️ Categoría</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <Chip key={c.id} active={step1.categoryId === c.id} onClick={() => setStep1({ ...step1, categoryId: c.id })}>
                    {c.name}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">📍 País objetivo (opcional)</label>
              <Input value={step1.targetCountry} onChange={(e) => setStep1({ ...step1, targetCountry: e.target.value })} placeholder="MX" />
            </div>

            <Button type="button" disabled={!step1.categoryId} onClick={() => setStep(2)} className="w-full">
              Continuar
            </Button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">🏷️ Nombre de la campaña</label>
              <Input required placeholder="Ej: Lanzamiento Sérum Glow" value={step2.name} onChange={(e) => setStep2({ ...step2, name: e.target.value })} />
            </div>

            {products.length > 0 && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Producto (opcional)</label>
                <Select value={step2.productId} onChange={(e) => setStep2({ ...step2, productId: e.target.value })}>
                  <option value="">Ninguno</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium">📣 Describe la campaña</label>
              <Textarea
                required
                rows={4}
                placeholder="Ej: Buscamos videos auténticos tipo 'get ready with me'…"
                value={step2.description}
                onChange={(e) => setStep2({ ...step2, description: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Qué tiene que entregar el creador</label>
              <Textarea
                required
                rows={2}
                placeholder="Ej: 1 video corto mostrando el uso del producto"
                value={step2.deliverableDescription}
                onChange={(e) => setStep2({ ...step2, deliverableDescription: e.target.value })}
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">💰 Compensación</p>
              <div className="flex flex-wrap gap-2">
                {COMPENSATION_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.value}
                    active={step2.compensationType === opt.value}
                    onClick={() => setStep2({ ...step2, compensationType: opt.value })}
                  >
                    {opt.label}
                  </Chip>
                ))}
              </div>
            </div>

            {step2.compensationType !== "PRODUCT_ONLY" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Monto fijo (MXN)</label>
                <Input type="number" min={0} value={step2.fixedAmount} onChange={(e) => setStep2({ ...step2, fixedAmount: e.target.value })} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Creadores buscados</label>
                <Input type="number" min={1} value={step2.creatorsRequired} onChange={(e) => setStep2({ ...step2, creatorsRequired: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Días para entregar</label>
                <Input type="number" min={1} value={step2.deliveryDays} onChange={(e) => setStep2({ ...step2, deliveryDays: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Seguidores mínimos</label>
                <Input type="number" min={0} value={step2.minFollowers} onChange={(e) => setStep2({ ...step2, minFollowers: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Vistas promedio mínimas</label>
                <Input type="number" min={0} value={step2.minAverageViews} onChange={(e) => setStep2({ ...step2, minAverageViews: e.target.value })} />
              </div>
            </div>

            {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setStep(1)} className="flex-1">
                Atrás
              </Button>
              <Button type="submit" disabled={isSaving} className="flex-1">
                {isSaving ? "Creando…" : "Crear campaña"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
