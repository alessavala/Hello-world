import { SocialEmbed } from "@/components/social-embed";
import type { PortfolioItem } from "@/lib/types";

// Responsive poster grid (2/3/4 columns) with each item's real embed mounted
// directly - no click-to-open modal. TikTok/Instagram still need one click on
// their own native player to start (that's the platform's embed policy, not
// something this page controls); YouTube clips autoplay muted on load (see
// the autoplay=1&mute=1 note in social-embed.tsx), since no browser allows
// autoplay with sound regardless of what an iframe requests.
export function PortfolioGallery({ items }: { items: PortfolioItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.id} className="flex flex-col gap-2">
          <SocialEmbed item={item} />
          <p className="text-center text-xs text-muted">{item.title}</p>
        </div>
      ))}
    </div>
  );
}
