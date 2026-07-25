"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Megaphone, Handshake, FileClock, Heart } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Campaign, Collaboration, Paginated } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicada",
  PAUSED: "Pausada",
  CLOSED: "Cerrada",
  CANCELLED: "Cancelada",
};

export function BrandDashboard() {
  const { token, user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [collaborations, setCollaborations] = useState<Collaboration[] | null>(null);
  const [favoritesTotal, setFavoritesTotal] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading the dashboard summary on mount is what this effect does
    setIsLoading(true);
    Promise.all([
      apiFetch<Paginated<Campaign>>("/campaigns/mine", { token, query: { pageSize: 100 } }).catch(() => null),
      apiFetch<Collaboration[]>("/collaborations", { token }).catch(() => null),
      apiFetch<Paginated<unknown>>("/favorites", { token, query: { pageSize: 1 } }).catch(() => null),
    ])
      .then(([c, collabs, favs]) => {
        setCampaigns(c?.data ?? []);
        setCollaborations(collabs ?? []);
        setFavoritesTotal(favs?.meta.total ?? 0);
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  const activeCampaigns = campaigns?.filter((c) => c.status === "PUBLISHED").length ?? 0;
  const activeCollaborations = collaborations?.filter((c) => !["COMPLETED", "CANCELLED"].includes(c.status)).length ?? 0;
  const pendingReview = collaborations?.reduce((sum, c) => sum + (c.deliverables?.filter((d) => d.status === "SUBMITTED").length ?? 0), 0) ?? 0;
  const recentCampaigns = [...(campaigns ?? [])].slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hola{user?.email ? `, ${user.email.split("@")[0]}` : ""} 👋</h1>
        <p className="text-sm text-muted">Este es el resumen de tu actividad como marca.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Campañas activas" value={activeCampaigns} icon={Megaphone} tone="primary" />
        <StatCard label="Colaboraciones activas" value={activeCollaborations} icon={Handshake} tone="indigo" />
        <StatCard label="Entregables por revisar" value={pendingReview} icon={FileClock} tone="amber" />
        <StatCard label="Creadores favoritos" value={favoritesTotal ?? 0} icon={Heart} tone="pink" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tus campañas</CardTitle>
        </CardHeader>
        <CardContent>
          {recentCampaigns.length === 0 ? (
            <EmptyState icon={Megaphone} title="Todavía no creaste ninguna campaña" description="Publicá tu primera campaña para empezar a recibir aplicaciones." />
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {recentCampaigns.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-3">
                  <Link href="/campaigns" className="text-sm font-medium text-foreground hover:underline">
                    {c.name}
                  </Link>
                  <Badge variant={c.status === "PUBLISHED" ? "success" : "secondary"}>{STATUS_LABEL[c.status] ?? c.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
