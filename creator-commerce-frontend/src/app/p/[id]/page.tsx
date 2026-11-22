"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Award, BadgeCheck, CheckCircle2, ExternalLink, Radio, Star, Users } from "lucide-react";
import { FaAmazon } from "react-icons/fa6";
import { SiFacebook, SiInstagram, SiTiktok, SiYoutube } from "react-icons/si";
import type { IconType } from "react-icons";
import { PublicShell } from "@/components/tools/public-shell";
import { SocialEmbed } from "@/components/social-embed";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, ApiError } from "@/lib/api";
import { translateApiError } from "@/lib/error-messages";
import { paletteVariant } from "@/lib/badge-color";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";
import type { CreatorMarketplace, CreatorPassport, CreatorProfile, ReviewsResponse } from "@/lib/types";

const MARKETPLACE_LABEL: Record<string, string> = {
  AMAZON: "Amazon",
  MERCADO_LIBRE: "Mercado Libre",
  TIKTOK_SHOP: "TikTok Shop",
};

// react-icons/simple-icons has no Mercado Libre mark, so it gets a lettermark
// in its own brand colors instead of a generic store icon.
function MercadoLibreMark({ className }: { className?: string }) {
  return <span className={`font-black ${className ?? ""}`}>ML</span>;
}

// Real brand logos (react-icons, bundled as code - no hotlinked images) on a
// tinted tile in each brand's own color, so marketplaces read at a glance.
const MARKETPLACE_STYLE: Record<string, { icon: IconType | typeof MercadoLibreMark; bg: string; text: string }> = {
  AMAZON: { icon: FaAmazon, bg: "bg-[#FF9900]/10", text: "text-[#FF9900]" },
  MERCADO_LIBRE: { icon: MercadoLibreMark, bg: "bg-[#FFE600]/20", text: "text-[#2D3277]" },
  TIKTOK_SHOP: { icon: SiTiktok, bg: "bg-foreground/10", text: "text-foreground" },
};

const PLATFORM_LABEL: Record<string, string> = {
  TIKTOK: "TikTok",
  INSTAGRAM: "Instagram",
  YOUTUBE: "YouTube",
  FACEBOOK: "Facebook",
};

const PLATFORM_STYLE: Record<string, { icon: IconType; bg: string; text: string }> = {
  TIKTOK: { icon: SiTiktok, bg: "bg-foreground/10", text: "text-foreground" },
  INSTAGRAM: { icon: SiInstagram, bg: "bg-[#E4405F]/10", text: "text-[#E4405F]" },
  YOUTUBE: { icon: SiYoutube, bg: "bg-[#FF0000]/10", text: "text-[#FF0000]" },
  FACEBOOK: { icon: SiFacebook, bg: "bg-[#1877F2]/10", text: "text-[#1877F2]" },
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4 text-center transition hover:shadow-md">
      <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </Card>
  );
}

function MarketplaceCard({ marketplace }: { marketplace: CreatorMarketplace }) {
  const style = MARKETPLACE_STYLE[marketplace.marketplace];
  const Icon = style?.icon ?? MercadoLibreMark;
  const isTikTokShop = marketplace.marketplace === "TIKTOK_SHOP";

  return (
    <Card className="flex flex-col gap-3 p-4 transition hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${style?.bg ?? "bg-muted-surface"}`}>
            <Icon className={`size-5 ${style?.text ?? "text-foreground"}`} />
          </span>
          <p className="text-sm font-semibold">{MARKETPLACE_LABEL[marketplace.marketplace] ?? marketplace.marketplace}</p>
        </div>
        <Badge variant={marketplace.verified ? "success" : "outline"}>
          {marketplace.verified && <CheckCircle2 className="size-3.5" />}
          {marketplace.verified ? "Verificado" : "Sin verificar"}
        </Badge>
      </div>

      {isTikTokShop && (marketplace.availableForLive || marketplace.availableForProductCollab) && (
        <div className="flex flex-wrap gap-1.5">
          {marketplace.availableForLive && (
            <Badge variant="pink">
              <Radio className="size-3.5" />
              Disponible para Lives
            </Badge>
          )}
          {marketplace.availableForProductCollab && (
            <Badge variant="indigo">
              <Users className="size-3.5" />
              Disponible para colaboraciones
            </Badge>
          )}
        </div>
      )}

      {marketplace.profileUrl && (
        <a href={marketplace.profileUrl} target="_blank" rel="noreferrer">
          <Button variant="secondary" size="sm" className="w-full">
            Ver tienda
            <ExternalLink className="size-3.5" />
          </Button>
        </a>
      )}
    </Card>
  );
}

export default function PublicPassportPage() {
  return (
    <PublicShell>
      <PublicPassport />
    </PublicShell>
  );
}

function PublicPassport() {
  const params = useParams<{ id: string }>();

  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [passport, setPassport] = useState<CreatorPassport | null>(null);
  const [reviews, setReviews] = useState<ReviewsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    Promise.all([apiFetch<CreatorProfile>(`/creators/${params.id}`), apiFetch<CreatorPassport>(`/creators/${params.id}/passport`)])
      .then(([creatorRes, passportRes]) => {
        setCreator(creatorRes);
        setPassport(passportRes);
        apiFetch<ReviewsResponse>(`/reviews/user/${creatorRes.userId}`, { query: { pageSize: 10 } })
          .then(setReviews)
          .catch(() => {});
      })
      .catch((err) => setError(err instanceof ApiError ? translateApiError(err.message) : "No pudimos cargar este Creator Passport."))
      .finally(() => setIsLoading(false));
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex w-full flex-col gap-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }
  if (error || !creator) {
    return <p className="py-16 text-center text-sm text-destructive">{error ?? "Creador no encontrado."}</p>;
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <Card className="overflow-hidden p-0">
        <div className="relative h-28 bg-gradient-to-r from-primary via-accent to-chart-5 sm:h-32">
          {passport && (
            <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 shadow-sm backdrop-blur">
              <Award className="size-4 text-primary" />
              <span className="text-sm font-bold text-foreground">{Math.round(passport.creatorCommerceScore)}/100</span>
              <span className="text-xs text-muted">Creator Score</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4 p-6 pt-0 sm:flex-row sm:items-end">
          <Avatar className="-mt-12 size-24 border-4 border-card shadow-md sm:size-28">
            <AvatarImage src={creator.profilePhotoUrl ?? undefined} alt={creator.displayName} />
            <AvatarFallback className="text-2xl">{initials(creator.displayName) || "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{creator.displayName}</h1>
              {passport?.identityVerified && (
                <Badge variant="success">
                  <BadgeCheck className="size-3.5" />
                  Verificado
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted">{[creator.city, creator.country].filter(Boolean).join(", ")}</p>
            {creator.baseRate && (
              <Badge variant="gradient" className="mt-2 px-3 py-1 text-sm">
                Tarifa base: {formatCurrency(Number(creator.baseRate))}
              </Badge>
            )}
            {creator.bio && <p className="mt-3 max-w-2xl text-sm text-foreground">{creator.bio}</p>}
          </div>
        </div>
      </Card>

      {creator.categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {creator.categories.map((c) => (
            <Badge key={c.categoryId} variant={paletteVariant(c.category.name)}>
              {c.category.name}
            </Badge>
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {creator.marketplaces.map((m) => (
              <MarketplaceCard key={m.id} marketplace={m} />
            ))}
          </div>
        </div>
      )}

      {creator.socialAccounts.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Redes sociales</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {creator.socialAccounts.map((s) => {
              const style = PLATFORM_STYLE[s.platform];
              const Icon = style?.icon ?? ExternalLink;
              return (
                <a key={s.id} href={s.profileUrl} target="_blank" rel="noreferrer">
                  <Card className="flex items-center gap-3 p-3 transition hover:shadow-md">
                    <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${style?.bg ?? "bg-muted-surface"}`}>
                      <Icon className={`size-5 ${style?.text ?? "text-foreground"}`} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{PLATFORM_LABEL[s.platform] ?? s.platform}</p>
                      <p className="text-xs text-muted">@{s.username}</p>
                      <p className="text-sm">{new Intl.NumberFormat("es-MX", { notation: "compact" }).format(s.followers)} seguidores</p>
                    </div>
                  </Card>
                </a>
              );
            })}
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
            <span className="flex items-center gap-1 text-sm font-normal text-muted">
              <Star className="size-3.5 fill-warning text-warning" />
              {reviews.avgRating.toFixed(1)} ({reviews.meta.total})
            </span>
          </h2>
          <ul className="flex flex-col gap-3">
            {reviews.data.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`size-3.5 ${i < r.rating ? "fill-warning text-warning" : "text-border"}`} />
                    ))}
                  </span>
                  <span className="text-xs text-muted">{new Date(r.createdAt).toLocaleDateString("es-MX")}</span>
                </div>
                {r.comments && <p className="mt-1 text-sm text-foreground">{r.comments}</p>}
              </Card>
            ))}
          </ul>
        </div>
      )}

      <Card className="relative flex flex-col items-center gap-3 overflow-hidden bg-gradient-to-br from-primary via-accent to-chart-5 p-8 text-center shadow-lg">
        <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 size-40 rounded-full bg-white/10 blur-2xl" />
        <p className="text-lg font-bold text-primary-foreground sm:text-xl">
          ¿Sos una marca y querés trabajar con {creator.displayName}?
        </p>
        <p className="max-w-md text-sm text-primary-foreground/90">
          Creá una cuenta gratis en creator.hub para invitarlo a tu próxima campaña.
        </p>
        <Link href="/register">
          <Button size="lg" variant="secondary" className="mt-1">
            Crear cuenta gratis
          </Button>
        </Link>
      </Card>
    </div>
  );
}
