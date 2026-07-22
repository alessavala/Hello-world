"use client";

import { useCallback, useEffect, useState } from "react";
import { BasicInfoForm } from "./creator-profile/basic-info-form";
import { SocialAccountsSection } from "./creator-profile/social-accounts-section";
import { MarketplacesSection } from "./creator-profile/marketplaces-section";
import { CategoriesSection } from "./creator-profile/categories-section";
import { apiFetch, ApiError } from "@/lib/api";
import { translateApiError } from "@/lib/error-messages";
import { useAuth } from "@/lib/auth-context";
import type { CreatorProfile } from "@/lib/types";

export function CreatorProfileForm() {
  const { token } = useAuth();
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!token) return;
    return apiFetch<CreatorProfile>("/creators/me", { token })
      .then(setCreator)
      .catch((err) => {
        if (!(err instanceof ApiError && err.status === 404)) {
          setError(err instanceof ApiError ? translateApiError(err.message) : "No pudimos cargar tu perfil.");
        }
      });
  }, [token]);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading the existing profile on mount is what this effect does
    setIsLoading(true);
    refresh()?.finally(() => setIsLoading(false));
  }, [token, refresh]);

  if (isLoading) return <p className="text-sm text-muted">Cargando…</p>;
  if (error) return <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>;

  return (
    <div className="flex max-w-lg flex-col gap-6">
      {!creator && (
        <p className="rounded-2xl bg-brand-pill px-4 py-3 text-sm">
          Completá tu información básica primero. Después vas a poder agregar redes sociales, marketplaces y categorías.
        </p>
      )}

      <BasicInfoForm creator={creator} onSaved={setCreator} />

      {creator && (
        <>
          <SocialAccountsSection accounts={creator.socialAccounts} onChange={refresh} />
          <MarketplacesSection marketplaces={creator.marketplaces} onChange={refresh} />
          <CategoriesSection selected={creator.categories} onChange={refresh} />
        </>
      )}
    </div>
  );
}
