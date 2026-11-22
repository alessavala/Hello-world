"use client";

import { useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SocialEmbed } from "@/components/social-embed";
import { PLATFORM_LABEL, PLATFORM_STYLE } from "@/lib/platform-style";
import { canEmbed, embedAspect, PLATFORM_HOME_LABEL } from "@/lib/video-embed";
import type { PortfolioItem } from "@/lib/types";

// The UGC portfolio as a responsive poster grid (4/3/2 columns) instead of
// an uncontrolled horizontal scroll of live embeds. Nothing mounts a real
// TikTok/Instagram/YouTube player until a card is opened, and closing the
// modal unmounts it again (Radix Dialog only renders Content while open) -
// so a profile with a dozen clips never has a dozen iframes/widgets running
// at once.
export function PortfolioGallery({ items }: { items: PortfolioItem[] }) {
  const [openItem, setOpenItem] = useState<PortfolioItem | null>(null);

  if (items.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <PortfolioCard key={item.id} item={item} onPlay={() => setOpenItem(item)} />
        ))}
      </div>

      <Dialog open={!!openItem} onOpenChange={(open) => !open && setOpenItem(null)}>
        <DialogContent className="max-w-xl">
          {openItem && (
            <>
              <DialogTitle className="pr-6">{openItem.title}</DialogTitle>
              <SocialEmbed item={openItem} />
              <a
                href={openItem.contentUrl}
                target="_blank"
                rel="noreferrer"
                className="flex w-fit items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                {PLATFORM_HOME_LABEL[openItem.platform] ?? "Ver original"}
                <ExternalLink className="size-3.5" />
              </a>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function PortfolioCard({ item, onPlay }: { item: PortfolioItem; onPlay: () => void }) {
  const style = PLATFORM_STYLE[item.platform];
  const Icon = style?.icon;
  const portrait = embedAspect(item.platform, item.contentUrl) === "portrait";
  const playable = canEmbed(item.platform, item.contentUrl);

  return (
    <button
      type="button"
      onClick={onPlay}
      className={`group relative flex w-full flex-col overflow-hidden rounded-[18px] border border-border bg-card text-left shadow-sm transition hover:shadow-md ${
        portrait ? "aspect-[9/16]" : "aspect-video"
      }`}
    >
      {item.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.thumbnailUrl} alt={item.title} className="absolute inset-0 h-full w-full rounded-[16px] object-cover" />
      ) : (
        <div className={`absolute inset-0 rounded-[16px] ${style?.bg ?? "bg-muted-surface"}`} />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/10" />

      {Icon && (
        <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-[11px] font-semibold text-foreground backdrop-blur-sm">
          <Icon className={`size-3 ${style?.text ?? ""}`} />
          {PLATFORM_LABEL[item.platform] ?? item.platform}
        </span>
      )}

      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md transition group-hover:scale-110">
          <Play className="size-5 translate-x-0.5 fill-current" />
        </span>
      </span>

      <span className="absolute inset-x-0 bottom-0 line-clamp-2 px-2.5 pb-2.5 text-xs font-medium text-white">
        {item.title}
        {!playable && <span className="ml-1 text-white/70">· se abre en {PLATFORM_LABEL[item.platform]}</span>}
      </span>
    </button>
  );
}
