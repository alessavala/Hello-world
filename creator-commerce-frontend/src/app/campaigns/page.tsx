"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/button";
import { CampaignCard } from "@/components/campaign-card";
import { CampaignWizard } from "@/components/campaign-wizard";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Campaign, CampaignApplication, CampaignStatus, Paginated } from "@/lib/types";

export default function CampaignsPage() {
  return (
    <AppShell>
      <CampaignsContent />
    </AppShell>
  );
}

function CampaignsContent() {
  const { user } = useAuth();
  if (user?.role === "BRAND") return <BrandCampaigns />;
  return <CreatorCampaigns />;
}

function BrandCampaigns() {
  const { token } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    apiFetch<Paginated<Campaign>>("/campaigns/mine", { token, query: { pageSize: 50 } })
      .then((res) => setCampaigns(res.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "No pudimos cargar tus campañas."))
      .finally(() => setIsLoading(false));
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount is what this effect does
    setIsLoading(true);
    load();
  }, [load]);

  async function handleStatusChange(campaign: Campaign, status: CampaignStatus) {
    if (!token) return;
    await apiFetch(`/campaigns/${campaign.id}/status`, { method: "PATCH", token, body: { status } }).catch(() => {});
    load();
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Mis campañas</h1>
          <p className="text-sm text-muted">Publicá campañas y conectá con creadores.</p>
        </div>
        {campaigns.length > 0 && <Button onClick={() => setShowWizard(true)}>+ Nueva campaña</Button>}
      </div>

      {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {isLoading ? (
        <p className="py-16 text-center text-sm text-muted">Cargando…</p>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border py-20 text-center">
          <span className="text-4xl">📣</span>
          <h2 className="text-lg font-semibold">Creá tu primera campaña</h2>
          <p className="max-w-xs text-sm text-muted">Las campañas te permiten conectar con creadores, gestionar colaboraciones y hacer crecer tu marca.</p>
          <Button onClick={() => setShowWizard(true)}>+ Nueva campaña</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {campaigns.map((c) => (
            <CampaignCard key={c.id} campaign={c} actions={{ role: "BRAND", onStatusChange: handleStatusChange }} />
          ))}
        </div>
      )}

      {showWizard && (
        <CampaignWizard
          onClose={() => setShowWizard(false)}
          onCreated={() => {
            setShowWizard(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function CreatorCampaigns() {
  const { token } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [appliedCampaignIds, setAppliedCampaignIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    Promise.all([
      apiFetch<Paginated<Campaign>>("/campaigns", { token, query: { pageSize: 50 } }),
      apiFetch<Paginated<CampaignApplication>>("/applications/me", { token, query: { pageSize: 100 } }),
    ])
      .then(([campaignsRes, applicationsRes]) => {
        setCampaigns(campaignsRes.data);
        setAppliedCampaignIds(new Set(applicationsRes.data.map((a) => a.campaignId)));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "No pudimos cargar las campañas."))
      .finally(() => setIsLoading(false));
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount is what this effect does
    setIsLoading(true);
    load();
  }, [load]);

  async function handleApply(campaign: Campaign) {
    if (!token) return;
    setMessage(null);
    try {
      await apiFetch(`/applications/campaign/${campaign.id}`, { method: "POST", token, body: {} });
      setMessage(`Te postulaste a "${campaign.name}".`);
      load();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "No pudimos enviar tu postulación.");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Campañas</h1>
        <p className="text-sm text-muted">Postulate a campañas publicadas por marcas.</p>
      </div>

      {message && <p className="rounded-2xl bg-brand-pill px-4 py-3 text-sm">{message}</p>}
      {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {isLoading ? (
        <p className="py-16 text-center text-sm text-muted">Cargando…</p>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border py-20 text-center">
          <p className="text-lg font-semibold">No hay campañas publicadas todavía</p>
          <p className="text-sm text-muted">Volvé a revisar más tarde.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {campaigns.map((c) => (
            <CampaignCard
              key={c.id}
              campaign={c}
              actions={{ role: "CREATOR", onApply: handleApply, applied: appliedCampaignIds.has(c.id) }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
