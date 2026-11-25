"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError } from "./api";
import { translateApiError } from "./error-messages";
import { useAuth } from "./auth-context";

export function useFavoriteIds() {
  const { token, user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const enabled = user?.role === "BRAND";

  const refresh = useCallback(() => {
    if (!token || !enabled) return;
    apiFetch<string[]>("/favorites/ids", { token })
      .then((list) => setIds(new Set(list)))
      .catch(() => {});
  }, [token, enabled]);

  useEffect(() => {
    // Loading which creators this brand already favorited is exactly what
    // this effect does - it can't be derived from render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (creatorId: string) => {
      if (!token) return;
      const wasFavorited = ids.has(creatorId);
      setError(null);
      setIds((prev) => {
        const next = new Set(prev);
        if (wasFavorited) next.delete(creatorId);
        else next.add(creatorId);
        return next;
      });
      try {
        await apiFetch(`/favorites/${creatorId}`, { method: wasFavorited ? "DELETE" : "POST", token });
      } catch (err) {
        setError(err instanceof ApiError ? translateApiError(err.message) : "No pudimos actualizar tus favoritos.");
        refresh();
      }
    },
    [token, ids, refresh],
  );

  return { enabled, isFavorited: (id: string) => ids.has(id), toggle, refresh, error };
}
