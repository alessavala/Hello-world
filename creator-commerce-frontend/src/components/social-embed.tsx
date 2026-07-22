"use client";

import { useEffect, useRef } from "react";
import type { PortfolioItem } from "@/lib/types";

// TikTok and Instagram both ship an official embed.js that hydrates
// blockquote placeholders into a live preview pulled straight from their own
// CDN - no media is downloaded or hosted by us, we just point at the link.
const EMBED_SCRIPTS: Partial<Record<PortfolioItem["platform"], string>> = {
  TIKTOK: "https://www.tiktok.com/embed.js",
  INSTAGRAM: "https://www.instagram.com/embed.js",
};

const loadedScripts = new Set<string>();

function loadEmbedScript(src: string) {
  if (loadedScripts.has(src)) {
    // Re-processing existing embeds (e.g. new items appended) needs each
    // platform's global re-scan hook, since the script only auto-runs once.
    const w = window as unknown as { tiktokEmbed?: { lib?: { render?: () => void } }; instgrm?: { Embeds?: { process?: () => void } } };
    w.tiktokEmbed?.lib?.render?.();
    w.instgrm?.Embeds?.process?.();
    return;
  }
  loadedScripts.add(src);
  const script = document.createElement("script");
  script.src = src;
  script.async = true;
  document.body.appendChild(script);
}

function tiktokVideoId(url: string): string | undefined {
  return url.match(/\/video\/(\d+)/)?.[1];
}

export function SocialEmbed({ item }: { item: PortfolioItem }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptSrc = EMBED_SCRIPTS[item.platform];

  useEffect(() => {
    if (scriptSrc) loadEmbedScript(scriptSrc);
  }, [scriptSrc]);

  if (item.platform === "TIKTOK") {
    return (
      <div ref={containerRef} className="w-[280px] shrink-0 overflow-hidden rounded-2xl">
        <blockquote
          className="tiktok-embed"
          cite={item.contentUrl}
          data-video-id={tiktokVideoId(item.contentUrl) ?? ""}
          style={{ maxWidth: 280, minWidth: 280 }}
        >
          <section>
            <a href={item.contentUrl} target="_blank" rel="noreferrer">
              {item.title}
            </a>
          </section>
        </blockquote>
      </div>
    );
  }

  if (item.platform === "INSTAGRAM") {
    return (
      <div ref={containerRef} className="w-[280px] shrink-0 overflow-hidden rounded-2xl">
        <blockquote className="instagram-media" data-instgrm-captioned data-instgrm-permalink={item.contentUrl} style={{ maxWidth: 280, minWidth: 280 }}>
          <a href={item.contentUrl} target="_blank" rel="noreferrer">
            {item.title}
          </a>
        </blockquote>
      </div>
    );
  }

  return (
    <a
      href={item.contentUrl}
      target="_blank"
      rel="noreferrer"
      className="relative flex aspect-[9/16] w-40 shrink-0 flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl bg-brand-pill p-3 text-center"
    >
      {item.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.thumbnailUrl} alt={item.title} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <>
          <span className="text-3xl">▶️</span>
          <span className="text-xs font-medium">{item.title}</span>
        </>
      )}
    </a>
  );
}
