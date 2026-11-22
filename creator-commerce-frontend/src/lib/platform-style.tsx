import type { IconType } from "react-icons";
import { FaAmazon } from "react-icons/fa6";
import { SiFacebook, SiInstagram, SiTiktok, SiYoutube } from "react-icons/si";

// Shared per-platform logo + brand color, used by both the public Creator
// Passport (social accounts, marketplaces) and the portfolio gallery, so the
// two don't drift out of sync with separate icon maps.

export const PLATFORM_LABEL: Record<string, string> = {
  TIKTOK: "TikTok",
  INSTAGRAM: "Instagram",
  YOUTUBE: "YouTube",
  FACEBOOK: "Facebook",
};

export const MARKETPLACE_LABEL: Record<string, string> = {
  AMAZON: "Amazon",
  MERCADO_LIBRE: "Mercado Libre",
  TIKTOK_SHOP: "TikTok Shop",
};

// react-icons/simple-icons has no Mercado Libre mark, so it gets a
// lettermark in its own brand colors instead of a generic store icon.
export function MercadoLibreMark({ className }: { className?: string }) {
  return <span className={`font-black ${className ?? ""}`}>ML</span>;
}

export const PLATFORM_STYLE: Record<string, { icon: IconType; bg: string; text: string }> = {
  TIKTOK: { icon: SiTiktok, bg: "bg-foreground/10", text: "text-foreground" },
  INSTAGRAM: { icon: SiInstagram, bg: "bg-[#E4405F]/10", text: "text-[#E4405F]" },
  YOUTUBE: { icon: SiYoutube, bg: "bg-[#FF0000]/10", text: "text-[#FF0000]" },
  FACEBOOK: { icon: SiFacebook, bg: "bg-[#1877F2]/10", text: "text-[#1877F2]" },
};

export const MARKETPLACE_STYLE: Record<string, { icon: IconType | typeof MercadoLibreMark; bg: string; text: string }> = {
  AMAZON: { icon: FaAmazon, bg: "bg-[#FF9900]/10", text: "text-[#FF9900]" },
  MERCADO_LIBRE: { icon: MercadoLibreMark, bg: "bg-[#FFE600]/20", text: "text-[#2D3277]" },
  TIKTOK_SHOP: { icon: SiTiktok, bg: "bg-foreground/10", text: "text-foreground" },
};
