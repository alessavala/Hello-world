"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CreatorCard } from "@/components/creator-card";
import { apiFetch, ApiError } from "@/lib/api";
import { translateApiError } from "@/lib/error-messages";
import { useAuth } from "@/lib/auth-context";
import type { CreatorProfile, Paginated } from "@/lib/types";

export default function FavoritesPage() {
  return (
    <AppShell>
      <FavoritesList />
    </AppShell>
  );
}

function FavoritesList() {
  const { token, user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [result, setResult] = useState<Paginated<CreatorProfile> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // A CREATOR/ADMIN landing here has nothing to see - bounce them out,
    // which this effect is exactly responsible for doing.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!authLoading && user && user.role !== "BRAND") router.replace("/creators");
  }, [authLoading, user, router]);

  const load = useCallback(() => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    return apiFetch<Paginated<CreatorProfile>>("/favorites", { token, query: { pageSize: 24 } })
      .then(setResult)
      .catch((err) => setError(err instanceof ApiError ? translateApiError(err.message) : "No pudimos cargar tus favoritos."))
      .finally(() => setIsLoading(false));
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading the saved list on mount is what this effect does
    load();
  }, [load]);

  async function remove(creatorId: string) {
    if (!token) return;
    await apiFetch(`/favorites/${creatorId}`, { method: "DELETE", token }).catch(() => {});
    load();
  }

  if (user && user.role !== "BRAND") return null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Favoritos</h1>
        <p className="text-sm text-muted">Los creadores que guardaste para contactar más adelante.</p>
      </div>

      {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {isLoading ? (
        <p className="py-16 text-center text-sm text-muted">Cargando favoritos…</p>
      ) : result && result.data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border py-16 text-center">
          <p className="text-lg font-semibold">Todavía no guardaste ningún creador</p>
          <p className="text-sm text-muted">Tocá el corazón en cualquier perfil para guardarlo acá.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {result?.data.map((creator) => (
            <CreatorCard key={creator.id} creator={creator} isFavorited onToggleFavorite={() => remove(creator.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
