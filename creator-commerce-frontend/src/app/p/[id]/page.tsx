"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Award, BadgeCheck, CheckCircle2, ExternalLink, Radio, Star, Users } from "lucide-react";
import { PublicShell } from "@/components/tools/public-shell";
import { PortfolioGallery } from "@/components/portfolio-gallery";
import { AnimatedCommerceBackground } from "@/components/passport/animated-commerce-background";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, ApiError } from "@/lib/api";
import { translateApiError } from "@/lib/error-messages";
import { paletteVariant } from "@/lib/badge-color";
import { formatCurrency } from "@/lib/format";
import { MARKETPLACE_LABEL, MARKETPLACE_STYLE, MercadoLibreMark, PLATFORM_LABEL, PLATFORM_STYLE } from "@/lib/platform-style";
import Link from "next/link";
import type { CreatorMarketplace, CreatorPassport, CreatorProfile, ReviewsResponse } from "@/lib/types";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-[21px] font-bold tracking-[-0.035em] sm:text-[24px]">{children}</h2>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-[20px] p-4 text-center transition hover:shadow-md">
      <p className="text-[28px] font-bold tracking-[-0.035em] text-foreground sm:text-[32px]">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </Card>
  );
}

function MarketplaceCard({ marketplace }: { marketplace: CreatorMarketplace }) {
  const style = MARKETPLACE_STYLE[marketplace.marketplace];
  const Icon = style?.icon ?? MercadoLibreMark;
  const isTikTokShop = marketplace.marketplace === "TIKTOK_SHOP";

  return (
    <Card className="flex flex-col gap-3 rounded-[20px] p-4 transition hover:shadow-md">
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
    <PublicShell mainClassName="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-9 px-4 py-8 sm:px-8">
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

  const specialty = creator.categories[0]?.category.name;

  return (
    <div className="flex w-full flex-col gap-9">
      {/* 1-2. Hero: avatar, identidad, especialidad + CTA/Score */}
      <Card className="relative overflow-hidden rounded-[24px] p-0">
        <div className="relative h-36 bg-gradient-to-br from-passport-navy via-passport-navy-2 to-passport-navy sm:h-44">
          <AnimatedCommerceBackground />
          {passport && (
            <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 shadow-sm backdrop-blur">
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
              <h1 className="text-[27px] font-[750] leading-tight tracking-[-0.035em] sm:text-[36px]">{creator.displayName}</h1>
              {passport?.identityVerified && (
                <Badge variant="success">
                  <BadgeCheck className="size-3.5" />
                  Verificado
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted">
              {specialty && <span className="font-medium text-foreground">{specialty}</span>}
              {specialty && (creator.city || creator.country) && " · "}
              {[creator.city, creator.country].filter(Boolean).join(", ")}
            </p>
            {creator.baseRate && (
              <Badge variant="gradient" className="mt-2 px-3 py-1 text-sm">
                Tarifa base: {formatCurrency(Number(creator.baseRate))}
              </Badge>
            )}
            {creator.bio && <p className="mt-3 max-w-2xl text-sm leading-[1.6] text-foreground">{creator.bio}</p>}
          </div>
          <Link href="/register" className="sm:pb-1">
            <Button size="lg" className="w-full sm:w-auto">
              Colaborar con {creator.displayName.split(" ")[0]}
            </Button>
          </Link>
        </div>
      </Card>

      {/* 3. Contenido UGC destacado - sección protagonista */}
      {creator.portfolioItems && creator.portfolioItems.length > 0 && (
        <div>
          <SectionHeading>Contenido destacado</SectionHeading>
          <PortfolioGallery items={creator.portfolioItems} />
        </div>
      )}

      {/* 4. Audiencia y redes sociales */}
      {creator.socialAccounts.length > 0 && (
        <div>
          <SectionHeading>Audiencia y redes</SectionHeading>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
            {creator.socialAccounts.map((s) => {
              const style = PLATFORM_STYLE[s.platform];
              const Icon = style?.icon ?? ExternalLink;
              return (
                <a key={s.id} href={s.profileUrl} target="_blank" rel="noreferrer">
                  <Card className="flex items-center gap-3 rounded-[20px] p-3 transition hover:shadow-md">
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

      {/* 5. Creator Passport - métricas verificables */}
      {passport && (
        <div>
          <SectionHeading>Creator Passport</SectionHeading>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
            <Stat label="Score" value={`${Math.round(passport.creatorCommerceScore)}/100`} />
            <Stat label="Campañas completadas" value={String(passport.campaignsCompleted)} />
            {passport.campaignsCompleted > 0 ? (
              <>
                <Stat label="Entregas a tiempo" value={`${Math.round(passport.onTimeDeliveryRate * 100)}%`} />
                <Stat label="Calificación promedio" value={passport.avgRating ? passport.avgRating.toFixed(1) : "—"} />
                <Stat label="Volverían a contratarlo" value={`${Math.round(passport.brandRehireRate * 100)}%`} />
                <Stat label="Aprobado primera entrega" value={`${Math.round(passport.firstApprovalRate * 100)}%`} />
                <Stat label="Tasa de disputas" value={`${Math.round(passport.disputeRate * 100)}%`} />
              </>
            ) : (
              <Card className="col-span-2 flex items-center rounded-[20px] p-4 text-sm text-muted sm:col-span-3">
                Creador nuevo en la plataforma - todavía sin campañas completadas para medir.
              </Card>
            )}
          </div>
        </div>
      )}

      {/* 6. Categorías, marketplaces y disponibilidad */}
      {(creator.categories.length > 0 || creator.marketplaces.length > 0) && (
        <div>
          <SectionHeading>Categorías y marketplaces</SectionHeading>
          {creator.categories.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {creator.categories.map((c) => (
                <Badge key={c.categoryId} variant={paletteVariant(c.category.name)}>
                  {c.category.name}
                </Badge>
              ))}
            </div>
          )}
          {creator.marketplaces.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {creator.marketplaces.map((m) => (
                <MarketplaceCard key={m.id} marketplace={m} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. Reseñas */}
      {reviews && reviews.data.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-[21px] font-bold tracking-[-0.035em] sm:text-[24px]">
            Reseñas
            <span className="flex items-center gap-1 text-sm font-normal text-muted">
              <Star className="size-3.5 fill-warning text-warning" />
              {reviews.avgRating.toFixed(1)} ({reviews.meta.total})
            </span>
          </h2>
          <ul className="flex flex-col gap-3">
            {reviews.data.map((r) => (
              <Card key={r.id} className="rounded-[20px] p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`size-3.5 ${i < r.rating ? "fill-warning text-warning" : "text-border"}`} />
                    ))}
                  </span>
                  <span className="text-xs text-muted">{new Date(r.createdAt).toLocaleDateString("es-MX")}</span>
                </div>
                {r.comments && <p className="mt-1 text-sm leading-[1.6] text-foreground">{r.comments}</p>}
              </Card>
            ))}
          </ul>
        </div>
      )}

      {/* 8. CTA final para marcas */}
      <Card className="relative flex flex-col items-center gap-3 overflow-hidden rounded-[24px] bg-gradient-to-br from-passport-navy via-passport-navy-2 to-passport-navy p-8 text-center shadow-lg">
        <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-passport-mint/20 blur-2xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 size-40 rounded-full bg-accent/20 blur-2xl" />
        <p className="relative text-lg font-bold text-white sm:text-xl">¿Sos una marca y querés trabajar con {creator.displayName}?</p>
        <p className="relative max-w-md text-sm leading-[1.6] text-white/80">
          Creá una cuenta gratis en creator.hub para invitarlo a tu próxima campaña.
        </p>
        <Link href="/register" className="relative">
          <Button size="lg" variant="secondary" className="mt-1">
            Crear cuenta gratis
          </Button>
        </Link>
      </Card>
    </div>
  );
}
