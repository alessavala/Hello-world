"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SocialEmbed } from "@/components/social-embed";
import { apiFetch, ApiError } from "@/lib/api";
import { translateApiError } from "@/lib/error-messages";
import { useAuth } from "@/lib/auth-context";
import { useFavoriteIds } from "@/lib/use-favorites";
import type { CreatorPassport, CreatorProfile, ReviewsResponse } from "@/lib/types";

const MARKETPLACE_LABEL: Record<string, string> = {
  AMAZON: "Amazon",
  MERCADO_LIBRE: "Mercado Libre",
  TIKTOK_SHOP: "TikTok Shop",
};

const PLATFORM_LABEL: Record<string, string> = {
  TIKTOK: "TikTok",
  INSTAGRAM: "Instagram",
  YOUTUBE: "YouTube",
  FACEBOOK: "Facebook",
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 text-center">
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

export default function CreatorDetailPage() {
  return (
    <AppShell>
      <CreatorDetail />
    </AppShell>
  );
}

function CreatorDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const favorites = useFavoriteIds();

  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [passport, setPassport] = useState<CreatorPassport | null>(null);
  const [reviews, setReviews] = useState<ReviewsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token || !params.id) return;
    // Fetching this creator's profile + passport when the route id changes
    // is exactly what this effect does - the loading state can't be derived
    // from props/render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    Promise.all([
      apiFetch<CreatorProfile>(`/creators/${params.id}`, { token }),
      apiFetch<CreatorPassport>(`/creators/${params.id}/passport`, { token }),
    ])
      .then(([creatorRes, passportRes]) => {
        setCreator(creatorRes);
        setPassport(passportRes);
        apiFetch<ReviewsResponse>(`/reviews/user/${creatorRes.userId}`, { token, query: { pageSize: 10 } })
          .then(setReviews)
          .catch(() => {});
      })
      .catch((err) => setError(err instanceof ApiError ? translateApiError(err.message) : "No pudimos cargar este perfil."))
      .finally(() => setIsLoading(false));
  }, [token, params.id]);

  if (isLoading) return <p className="py-16 text-center text-sm text-muted">Cargando perfil…</p>;
  if (error || !creator) return <p className="py-16 text-center text-sm text-rose-700">{error ?? "Creador no encontrado."}</p>;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <button type="button" onClick={() => router.back()} className="w-fit text-sm text-muted hover:text-foreground">
        ← Volver
      </button>

      {favorites.error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{favorites.error}</p>}

      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-6 shadow-sm sm:flex-row sm:items-center">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-brand-pill">
          {creator.profilePhotoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={creator.profilePhotoUrl} alt={creator.displayName} className="h-full w-full object-cover" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{creator.displayName}</h1>
            {passport?.identityVerified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-olive px-3 py-1 text-xs font-semibold text-accent-olive-foreground">
                ⭐ Verificado
              </span>
            )}
          </div>
          <p className="text-sm text-muted">{[creator.city, creator.country].filter(Boolean).join(", ")}</p>
          {creator.bio && <p className="mt-2 text-sm">{creator.bio}</p>}
        </div>
        {favorites.enabled && (
          <button
            type="button"
            onClick={() => favorites.toggle(creator.id)}
            className={`inline-flex items-center gap-2 self-start rounded-full border px-4 py-2 text-sm font-semibold transition ${
              favorites.isFavorited(creator.id)
                ? "border-accent-pink bg-accent-pink text-accent-pink-foreground"
                : "border-border bg-surface hover:bg-brand-pill/60"
            }`}
          >
            {favorites.isFavorited(creator.id) ? "♥ Guardado" : "♡ Guardar"}
          </button>
        )}
      </div>

      {creator.categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {creator.categories.map((c) => (
            <span key={c.categoryId} className="rounded-full bg-brand-pill px-3 py-1 text-sm font-medium">
              {c.category.name}
            </span>
          ))}
        </div>
      )}

      {passport && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Creator Passport</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Score" value={`${Math.round(passport.creatorCommerceScore)}/100`} />
            <Stat label="Campañas completadas" value={String(passport.campaignsCompleted)} />
            <Stat label="Entregas a tiempo" value={`${Math.round(passport.onTimeDeliveryRate * 100)}%`} />
            <Stat label="Calificación promedio" value={passport.avgRating ? passport.avgRating.toFixed(1) : "—"} />
            <Stat label="Volverían a contratarlo" value={`${Math.round(passport.brandRehireRate * 100)}%`} />
            <Stat label="Aprobado primera entrega" value={`${Math.round(passport.firstApprovalRate * 100)}%`} />
            <Stat label="Tasa de disputas" value={`${Math.round(passport.disputeRate * 100)}%`} />
          </div>
        </div>
      )}

      {creator.marketplaces.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Marketplaces</h2>
          <div className="flex flex-wrap gap-2">
            {creator.marketplaces.map((m) => (
              <span
                key={m.id}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium ${
                  m.verified ? "border-accent-olive bg-accent-olive/10 text-accent-olive" : "border-border bg-surface text-muted"
                }`}
              >
                {MARKETPLACE_LABEL[m.marketplace] ?? m.marketplace}
                {m.verified ? " ✓" : " (sin verificar)"}
              </span>
            ))}
          </div>
        </div>
      )}

      {creator.socialAccounts.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Redes sociales</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {creator.socialAccounts.map((s) => (
              <a
                key={s.id}
                href={s.profileUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-border bg-surface p-3 hover:bg-brand-pill/40"
              >
                <p className="text-sm font-semibold">{PLATFORM_LABEL[s.platform] ?? s.platform}</p>
                <p className="text-xs text-muted">@{s.username}</p>
                <p className="mt-1 text-sm">{new Intl.NumberFormat("es-MX", { notation: "compact" }).format(s.followers)} seguidores</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {creator.portfolioItems && creator.portfolioItems.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Portfolio</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {creator.portfolioItems.map((item) => (
              <SocialEmbed key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {reviews && reviews.data.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            Reseñas
            <span className="text-sm font-normal text-muted">★ {reviews.avgRating.toFixed(1)} ({reviews.meta.total})</span>
          </h2>
          <ul className="flex flex-col gap-3">
            {reviews.data.map((r) => (
              <li key={r.id} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                  <span className="text-xs text-muted">{new Date(r.createdAt).toLocaleDateString("es-MX")}</span>
                </div>
                {r.comments && <p className="mt-1 text-sm">{r.comments}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
