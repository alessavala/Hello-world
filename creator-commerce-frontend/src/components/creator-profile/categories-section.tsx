"use client";

import { useEffect, useState } from "react";
import { Chip } from "../chip";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Category, CreatorCategory } from "@/lib/types";

export function CategoriesSection({ selected, onChange }: { selected: CreatorCategory[]; onChange: () => void }) {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Category[]>("/categories")
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const selectedIds = new Set(selected.map((c) => c.categoryId));

  async function toggle(categoryId: string) {
    if (!token) return;
    setPending(categoryId);
    try {
      if (selectedIds.has(categoryId)) {
        await apiFetch(`/creators/me/categories/${categoryId}`, { method: "DELETE", token });
      } else {
        await apiFetch(`/creators/me/categories/${categoryId}`, { method: "POST", token });
      }
      onChange();
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold">Categorías / nichos</h3>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <Chip key={c.id} active={selectedIds.has(c.id)} onClick={() => toggle(c.id)} disabled={pending === c.id}>
            {c.name}
          </Chip>
        ))}
      </div>
    </div>
  );
}
