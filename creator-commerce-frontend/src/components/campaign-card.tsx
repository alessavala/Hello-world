import { Button } from "./button";
import type { Campaign, CampaignStatus } from "@/lib/types";

const MARKETPLACE_LABEL: Record<string, string> = { AMAZON: "Amazon", MERCADO_LIBRE: "Mercado Libre", TIKTOK_SHOP: "TikTok Shop" };
const COMPENSATION_LABEL: Record<string, string> = {
  PRODUCT_ONLY: "Solo producto",
  FIXED_FEE: "Pago fijo",
  EXTERNAL_COMMISSION: "Comisión externa",
  HYBRID: "Producto + pago fijo",
};

const STATUS_STYLE: Record<CampaignStatus, string> = {
  DRAFT: "bg-brand-pill text-foreground",
  PUBLISHED: "bg-emerald-100 text-emerald-700",
  PAUSED: "bg-amber-100 text-amber-700",
  CLOSED: "bg-zinc-200 text-zinc-600",
  CANCELLED: "bg-rose-100 text-rose-700",
};

const STATUS_LABEL: Record<CampaignStatus, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicada",
  PAUSED: "Pausada",
  CLOSED: "Cerrada",
  CANCELLED: "Cancelada",
};

interface BrandActions {
  role: "BRAND";
  onStatusChange: (campaign: Campaign, status: CampaignStatus) => void;
}

interface CreatorActions {
  role: "CREATOR";
  onApply: (campaign: Campaign) => void;
  applied?: boolean;
}

export function CampaignCard({ campaign, actions }: { campaign: Campaign; actions: BrandActions | CreatorActions }) {
  return (
    <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold">{campaign.name}</h3>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[campaign.status]}`}>
          {STATUS_LABEL[campaign.status]}
        </span>
      </div>

      {campaign.brand && (
        <p className="mb-2 flex items-center gap-1.5 text-sm text-muted">
          {campaign.brand.businessName}
          {campaign.brand.verificationStatus && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-accent-olive/15 px-2 py-0.5 text-xs font-semibold text-accent-olive">
              ⭐ Verificada
            </span>
          )}
        </p>
      )}

      <p className="mb-3 line-clamp-2 text-sm text-muted">{campaign.description}</p>

      <div className="mb-3 flex flex-wrap gap-1.5 text-xs">
        <span className="rounded-full bg-brand-pill px-2.5 py-1 font-medium">{MARKETPLACE_LABEL[campaign.marketplace]}</span>
        {campaign.category && <span className="rounded-full bg-brand-pill px-2.5 py-1 font-medium">{campaign.category.name}</span>}
        <span className="rounded-full bg-brand-pill px-2.5 py-1 font-medium">{COMPENSATION_LABEL[campaign.compensationType]}</span>
        <span className="rounded-full bg-brand-pill px-2.5 py-1 font-medium">{campaign.creatorsRequired} creador(es)</span>
      </div>

      {actions.role === "BRAND" ? (
        <div className="flex flex-wrap gap-2">
          {campaign.status === "DRAFT" && (
            <Button variant="primary" onClick={() => actions.onStatusChange(campaign, "PUBLISHED")}>
              Publicar
            </Button>
          )}
          {campaign.status === "PUBLISHED" && (
            <>
              <Button variant="secondary" onClick={() => actions.onStatusChange(campaign, "PAUSED")}>
                Pausar
              </Button>
              <Button variant="secondary" onClick={() => actions.onStatusChange(campaign, "CLOSED")}>
                Cerrar
              </Button>
            </>
          )}
          {campaign.status === "PAUSED" && (
            <>
              <Button variant="primary" onClick={() => actions.onStatusChange(campaign, "PUBLISHED")}>
                Reanudar
              </Button>
              <Button variant="secondary" onClick={() => actions.onStatusChange(campaign, "CLOSED")}>
                Cerrar
              </Button>
            </>
          )}
        </div>
      ) : (
        <Button variant="primary" disabled={actions.applied} onClick={() => actions.onApply(campaign)}>
          {actions.applied ? "Ya te postulaste" : "Postularme"}
        </Button>
      )}
    </div>
  );
}
