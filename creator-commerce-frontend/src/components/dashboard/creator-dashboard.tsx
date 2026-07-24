"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, Handshake, Mail, Star, Wallet } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Collaboration, CreatorPassport, CreatorProfile, Paginated, ReviewsResponse } from "@/lib/types";

const ACTIVE_STATUSES = new Set(["COMPLETED", "CANCELLED"]);

export function CreatorDashboard() {
  const { token, user } = useAuth();
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [passport, setPassport] = useState<CreatorPassport | null>(null);
  const [collaborations, setCollaborations] = useState<Collaboration[] | null>(null);
  const [pendingInvites, setPendingInvites] = useState<number | null>(null);
  const [reviews, setReviews] = useState<ReviewsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading the dashboard summary on mount is what this effect does
    setIsLoading(true);
    apiFetch<CreatorProfile>("/creators/me", { token })
      .then((c) => {
        setCreator(c);
        return Promise.all([
          apiFetch<CreatorPassport>(`/creators/${c.id}/passport`, { token }).catch(() => null),
          apiFetch<Collaboration[]>("/collaborations", { token }).catch(() => null),
          apiFetch<Paginated<unknown>>("/applications/me", { token, query: { status: "INVITED", pageSize: 1 } }).catch(() => null),
          apiFetch<ReviewsResponse>(`/reviews/user/${c.userId}`, { token, query: { pageSize: 3 } }).catch(() => null),
        ]);
      })
      .then((res) => {
        if (!res) return;
        const [p, collabs, invites, revs] = res;
        setPassport(p);
        setCollaborations(collabs ?? []);
        setPendingInvites(invites?.meta.total ?? 0);
        setReviews(revs);
      })
      .catch(() => {})
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

  if (!creator) {
    return (
      <EmptyState
        icon={Award}
        title="Completá tu perfil primero"
        description="Necesitamos tus datos básicos para armar tu Creator Passport."
        action={
          <Link href="/profile" className="text-sm font-semibold text-primary hover:underline">
            Ir a mi perfil
          </Link>
        }
      />
    );
  }

  const activeCollaborations = collaborations?.filter((c) => !ACTIVE_STATUSES.has(c.status)).length ?? 0;
  const estimatedEarnings = (collaborations ?? [])
    .filter((c) => c.status === "COMPLETED" || !ACTIVE_STATUSES.has(c.status))
    .reduce((sum, c) => sum + (c.campaign?.fixedAmount ? Number(c.campaign.fixedAmount) : 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hola, {creator.displayName} 👋</h1>
        <p className="text-sm text-muted">Este es el resumen de tu actividad como creador.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Creator Score" value={passport ? `${Math.round(passport.creatorCommerceScore)}/100` : "—"} icon={Award} />
        <StatCard label="Colaboraciones activas" value={activeCollaborations} icon={Handshake} />
        <StatCard label="Invitaciones pendientes" value={pendingInvites ?? 0} icon={Mail} />
        <StatCard
          label="Estimado (pago fijo)"
          value={estimatedEarnings > 0 ? new Intl.NumberFormat("es-MX", { style: "currency", currency: "USD" }).format(estimatedEarnings) : "—"}
          icon={Wallet}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Reseñas recientes
            {reviews && reviews.meta.total > 0 && (
              <span className="flex items-center gap-1 text-sm font-normal text-muted">
                <Star className="size-3.5 fill-warning text-warning" />
                {reviews.avgRating.toFixed(1)} ({reviews.meta.total})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!reviews || reviews.data.length === 0 ? (
            <EmptyState icon={Star} title="Todavía no tenés reseñas" description="Van a aparecer acá cuando completes tu primera colaboración." />
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {reviews.data.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3">
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`size-3.5 ${i < r.rating ? "fill-warning text-warning" : "text-border"}`} />
                    ))}
                  </span>
                  <Badge variant="secondary">{new Date(r.createdAt).toLocaleDateString("es-MX")}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
