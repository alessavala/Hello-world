import type { BadgeProps } from "@/components/ui/badge";

const PALETTE: NonNullable<BadgeProps["variant"]>[] = ["default", "pink", "indigo", "success", "warning"];

const GRADIENTS = [
  "from-primary/25 to-chart-4/25",
  "from-chart-5/25 to-warning/25",
  "from-chart-4/25 to-chart-5/25",
  "from-success/25 to-primary/25",
  "from-warning/25 to-chart-5/25",
];

function hashOf(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash;
}

// Deterministic so the same category always gets the same color across
// renders/pages, without needing a color field from the backend.
export function paletteVariant(seed: string): NonNullable<BadgeProps["variant"]> {
  return PALETTE[hashOf(seed) % PALETTE.length];
}

// Same idea, but a gradient class for avatar/placeholder backgrounds.
export function paletteGradient(seed: string): string {
  return GRADIENTS[hashOf(seed) % GRADIENTS.length];
}
