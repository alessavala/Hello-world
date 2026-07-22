"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ReviewForm } from "@/components/review-form";
import { apiFetch, ApiError } from "@/lib/api";
import { translateApiError } from "@/lib/error-messages";
import { useAuth } from "@/lib/auth-context";
import type { Collaboration, CollaborationStatus } from "@/lib/types";

const STATUS_LABEL: Record<CollaborationStatus, string> = {
  ACCEPTED: "Aceptada",
  SAMPLE_PENDING: "Muestra pendiente",
  SAMPLE_SENT: "Muestra enviada",
  SAMPLE_RECEIVED: "Muestra recibida",
  CONTENT_IN_PROGRESS: "Contenido en progreso",
  DRAFT_SUBMITTED: "Borrador enviado",
  CHANGES_REQUESTED: "Cambios solicitados",
  FINAL_SUBMITTED: "Versión final enviada",
  APPROVED: "Aprobada",
  PUBLISHED: "Publicada",
  COMPLETED: "Completada",
  DISPUTED: "En disputa",
  CANCELLED: "Cancelada",
};

const STATUS_STYLE: Partial<Record<CollaborationStatus, string>> = {
  COMPLETED: "bg-accent-olive/15 text-accent-olive",
  DISPUTED: "bg-rose-100 text-rose-700",
  CANCELLED: "bg-border text-muted",
};

export default function CollaborationsPage() {
  return (
    <AppShell>
      <CollaborationsList />
    </AppShell>
  );
}

function CollaborationsList() {
  const { token, user } = useAuth();
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    return apiFetch<Collaboration[]>("/collaborations", { token })
      .then(setCollaborations)
      .catch((err) => setError(err instanceof ApiError ? translateApiError(err.message) : "No pudimos cargar tus colaboraciones."))
      .finally(() => setIsLoading(false));
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading the collaboration list on mount is what this effect does
    load();
  }, [load]);

  if (isLoading) return <p className="py-16 text-center text-sm text-muted">Cargando colaboraciones…</p>;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Colaboraciones</h1>
        <p className="text-sm text-muted">El estado de tus campañas aceptadas, de aplicación a entrega.</p>
      </div>

      {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {collaborations.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border py-16 text-center">
          <p className="text-lg font-semibold">Todavía no tenés colaboraciones</p>
          <p className="text-sm text-muted">Van a aparecer acá apenas se acepte una aplicación o invitación.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {collaborations.map((c) => {
            const counterpartLabel = user?.role === "BRAND" ? c.creator?.displayName : c.campaign?.brand?.businessName;
            const alreadyReviewed = c.reviews?.some((r) => r.reviewerUserId === user?.id);
            const canReview = c.status === "COMPLETED" && !alreadyReviewed;

            return (
              <li key={c.id} className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Link href={`/campaigns`} className="font-semibold hover:underline">
                      {c.campaign?.name ?? "Campaña"}
                    </Link>
                    <p className="text-sm text-muted">con {counterpartLabel ?? "—"}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[c.status] ?? "bg-brand-pill text-foreground"}`}>
                    {STATUS_LABEL[c.status]}
                  </span>
                </div>

                {canReview && (
                  <div className="mt-3">
                    {reviewingId === c.id ? (
                      <ReviewForm
                        collaborationId={c.id}
                        showWouldWorkAgain={user?.role === "BRAND"}
                        onDone={() => {
                          setReviewingId(null);
                          load();
                        }}
                      />
                    ) : (
                      <button type="button" onClick={() => setReviewingId(c.id)} className="text-sm font-semibold text-accent hover:underline">
                        Dejar reseña
                      </button>
                    )}
                  </div>
                )}
                {alreadyReviewed && <p className="mt-3 text-xs text-muted">Ya dejaste tu reseña para esta colaboración.</p>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
