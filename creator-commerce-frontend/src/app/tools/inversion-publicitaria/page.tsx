import type { Metadata } from "next";
import { PublicShell, ToolBackLink } from "@/components/tools/public-shell";
import { InversionPublicitariaCalculator } from "./calculator";

export const metadata: Metadata = {
  title: "Calculadora de inversión publicitaria | creator.hub",
  description: "Proyectá clics, ventas, CPA y ROAS antes de invertir en Meta Ads, TikTok Ads o Amazon Ads.",
};

export default function Page() {
  return (
    <PublicShell>
      <ToolBackLink />
      <InversionPublicitariaCalculator />
    </PublicShell>
  );
}
