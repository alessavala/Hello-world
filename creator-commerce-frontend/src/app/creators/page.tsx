"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Chip } from "@/components/chip";
import { CreatorCard } from "@/components/creator-card";
import { Button } from "@/components/button";
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
        <h1 className="text-2xl font-semibold">Creadores</h1>
        <p className="text-sm text-muted">Buscá creadores por nombre, categoría o marketplace.</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          load();
        }}
        className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1 shadow-sm"
      >
        <span aria-hidden>🔍</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar creador por nombre…"
          className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-muted"
        />
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Chip active={verifiedOnly} icon="⭐" onClick={() => updateFilter(() => setVerifiedOnly((v) => !v))}>
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
        <Chip icon="➕" active={showFilters} onClick={() => setShowFilters((v) => !v)}>
          Filtrar
        </Chip>
      </div>

      {showFilters && (
        <div className="rounded-3xl border border-border bg-surface p-4 shadow-sm">
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
        </div>
      )}

      {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {favorites.error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{favorites.error}</p>}

      {isLoading ? (
        <p className="py-16 text-center text-sm text-muted">Cargando creadores…</p>
      ) : result && result.data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border py-16 text-center">
          <p className="text-lg font-semibold">No encontramos creadores con esos filtros</p>
          <p className="text-sm text-muted">Probá ajustando la búsqueda o quitando algún filtro.</p>
        </div>
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

          {result && result.meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Anterior
              </Button>
              <span className="text-sm text-muted">
                Página {result.meta.page} de {result.meta.totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={page >= result.meta.totalPages}
                onClick={() => setPage((p) => Math.min(result.meta.totalPages, p + 1))}
              >
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
