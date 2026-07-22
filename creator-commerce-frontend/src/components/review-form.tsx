"use client";

import { FormEvent, useState } from "react";
import { Button } from "./button";
import { Textarea } from "./input";
import { apiFetch, ApiError } from "@/lib/api";
import { translateApiError } from "@/lib/error-messages";
import { useAuth } from "@/lib/auth-context";

const RATING_FIELDS = [
  { key: "rating", label: "Calificación general" },
  { key: "communication", label: "Comunicación" },
  { key: "quality", label: "Calidad" },
  { key: "punctuality", label: "Puntualidad" },
] as const;

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} className={`text-lg ${n <= value ? "text-accent-yellow" : "text-border"}`}>
          ★
        </button>
      ))}
    </div>
  );
}

export function ReviewForm({
  collaborationId,
  showWouldWorkAgain,
  onDone,
}: {
  collaborationId: string;
  showWouldWorkAgain: boolean;
  onDone: () => void;
}) {
  const { token } = useAuth();
  const [ratings, setRatings] = useState<Record<(typeof RATING_FIELDS)[number]["key"], number>>({
    rating: 5,
    communication: 5,
    quality: 5,
    punctuality: 5,
  });
  const [wouldWorkAgain, setWouldWorkAgain] = useState(true);
  const [comments, setComments] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);
    setError(null);
    try {
      await apiFetch("/reviews", {
        method: "POST",
        token,
        body: { collaborationId, ...ratings, comments: comments || undefined, wouldWorkAgain: showWouldWorkAgain ? wouldWorkAgain : undefined },
      });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? translateApiError(err.message) : "No pudimos enviar tu reseña.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3 rounded-2xl bg-background p-4">
      {RATING_FIELDS.map((f) => (
        <div key={f.key} className="flex items-center justify-between">
          <span className="text-sm">{f.label}</span>
          <StarPicker value={ratings[f.key]} onChange={(v) => setRatings({ ...ratings, [f.key]: v })} />
        </div>
      ))}
      {showWouldWorkAgain && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={wouldWorkAgain} onChange={(e) => setWouldWorkAgain(e.target.checked)} />
          Volvería a trabajar con este creador
        </label>
      )}
      <Textarea placeholder="Comentario (opcional)" rows={3} value={comments} onChange={(e) => setComments(e.target.value)} />
      {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <Button type="submit" disabled={isSaving} className="w-fit">
        {isSaving ? "Enviando…" : "Enviar reseña"}
      </Button>
    </form>
  );
}
