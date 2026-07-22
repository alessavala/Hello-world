import Link from "next/link";
import type { CreatorProfile } from "@/lib/types";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

interface CreatorCardProps {
  creator: CreatorProfile;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
}

export function CreatorCard({ creator, isFavorited, onToggleFavorite }: CreatorCardProps) {
  const topFollowers = creator.socialAccounts.reduce((max, s) => Math.max(max, s.followers), 0);
  const isVerified = creator.verificationLevel !== "REGISTERED";

  return (
    <Link
      href={`/creators/${creator.id}`}
      className="group block overflow-hidden rounded-3xl border border-border bg-surface shadow-sm transition hover:shadow-md"
    >
      <div className="relative aspect-square w-full bg-brand-pill">
        {creator.profilePhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={creator.profilePhotoUrl} alt={creator.displayName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-muted">
            {initials(creator.displayName) || "?"}
          </div>
        )}

        {isVerified && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-accent-olive px-3 py-1 text-xs font-semibold text-accent-olive-foreground shadow-sm">
            ⭐ Verificado
          </span>
        )}

        {onToggleFavorite && (
          <button
            type="button"
            aria-label={isFavorited ? "Quitar de favoritos" : "Guardar en favoritos"}
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite();
            }}
            className={`absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm shadow-sm transition ${
              isFavorited ? "bg-accent-pink text-accent-pink-foreground" : "bg-foreground/85 text-background hover:bg-accent-pink"
            }`}
          >
            {isFavorited ? "♥" : "♡"}
          </button>
        )}

        <span className="absolute bottom-3 right-3 inline-flex items-center rounded-full bg-foreground/85 px-3 py-1 text-xs font-semibold text-background">
          {Math.round(creator.reliabilityScore)} pts
        </span>
      </div>

      <div className="p-4">
        <h3 className="truncate font-semibold">{creator.displayName}</h3>
        <p className="truncate text-sm text-muted">
          {[creator.city, creator.country].filter(Boolean).join(", ")}
          {topFollowers > 0 ? ` · ${new Intl.NumberFormat("es-MX", { notation: "compact" }).format(topFollowers)} seguidores` : ""}
        </p>

        {creator.categories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {creator.categories.slice(0, 3).map((c) => (
              <span key={c.categoryId} className="rounded-full bg-brand-pill px-2.5 py-1 text-xs font-medium text-foreground/80">
                {c.category.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
