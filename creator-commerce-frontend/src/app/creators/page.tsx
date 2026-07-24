"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, SlidersHorizontal, Star, UserX } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Chip } from "@/components/chip";
import { CreatorCard } from "@/components/creator-card";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { apiFetch, ApiError } from "@/lib/api";
import { translateApiError } from "@/lib/error-messages";
import { useAuth } from "@/lib/auth-context";
import { useFavoriteIds } from "@/lib/use-favorites";
import type { Category, CreatorProfile, Marketplace, Paginated, VerificationLevel } from "@/lib/types";

const MARKETPLACE_OPTIONS: { value: Marketplace; label: string; icon: string }[] = [
  { value: "AMAZON", label: "Amazon", icon: "📦" },
  { value: "MERCADO_LIBRE", label: "Mercado Libre", icon: "🛒" },
  { value: "TIKTOK_SHOP", label: "TikTok Shop", icon: "🎵" },
];

export default function CreatorsPage() {
  return (
    <AppShell>
      <CreatorsDiscovery />
    </AppShell>
  );
}

function CreatorsDiscovery() {
  const { token } = useAuth();
  const favorites = useFavoriteIds();

  const [search, setSearch] = useState("");
  const [marketplace, setMarketplace] = useState<Marketplace | undefined>();
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [categorySlug, setCategorySlug] = useState<string | undefined>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<Paginated<CreatorProfile> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Category[]>("/categories")
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Paginated<CreatorProfile>>("/creators", {
        token,
        query: {
          q: search || undefined,
          marketplace,
          category: categorySlug,
          verificationLevel: verifiedOnly ? ("IDENTITY" as VerificationLevel) : undefined,
          page,
          pageSize: 12,
        },
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? translateApiError(err.message) : "No pudimos cargar los creadores.");
    } finally {
      setIsLoading(false);
    }
  }, [token, search, marketplace, categorySlug, verifiedOnly, page]);

  useEffect(() => {
    // Refetching whenever a filter/page changes is the whole point of this
    // effect - the loading/error state it sets can't be derived from props.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  // Any filter change resets pagination back to page 1.
  function updateFilter(fn: () => void) {
    fn();
    setPage(1);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Creadores</h1>
        <p className="text-sm text-muted">Buscá creadores por nombre, categoría o marketplace.</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          load();
        }}
        className="relative"
      >
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar creador por nombre…"
          className="h-12 rounded-full pl-10"
        />
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Chip active={verifiedOnly} icon={<Star className="size-3.5" />} onClick={() => updateFilter(() => setVerifiedOnly((v) => !v))}>
          Verificados
        </Chip>
        {MARKETPLACE_OPTIONS.map((option) => (
          <Chip
            key={option.value}
            icon={option.icon}
            active={marketplace === option.value}
            onClick={() => updateFilter(() => setMarketplace((m) => (m === option.value ? undefined : option.value)))}
          >
            {option.label}
          </Chip>
        ))}
        <Chip icon={<SlidersHorizontal className="size-3.5" />} active={showFilters} onClick={() => setShowFilters((v) => !v)}>
          Filtrar
        </Chip>
      </div>

      {showFilters && (
        <Card className="p-4">
          <p className="mb-2 text-sm font-medium">Categoría</p>
          <div className="flex flex-wrap gap-2">
            <Chip active={!categorySlug} onClick={() => updateFilter(() => setCategorySlug(undefined))}>
              Todas
            </Chip>
            {categories.map((c) => (
              <Chip key={c.id} active={categorySlug === c.slug} onClick={() => updateFilter(() => setCategorySlug(c.slug))}>
                {c.name}
              </Chip>
            ))}
          </div>
        </Card>
      )}

      {error && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
      {favorites.error && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{favorites.error}</p>}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="aspect-square w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : result && result.data.length === 0 ? (
        <EmptyState
          icon={UserX}
          title="No encontramos creadores con esos filtros"
          description="Probá ajustando la búsqueda o quitando algún filtro."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {result?.data.map((creator) => (
              <CreatorCard
                key={creator.id}
                creator={creator}
                isFavorited={favorites.enabled ? favorites.isFavorited(creator.id) : undefined}
                onToggleFavorite={favorites.enabled ? () => favorites.toggle(creator.id) : undefined}
              />
            ))}
          </div>

          {result && <Pagination page={page} totalPages={result.meta.totalPages} onChange={setPage} />}
        </>
      )}
    </div>
  );
}
