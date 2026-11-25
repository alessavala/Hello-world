import type { Metadata } from "next";
import { PublicShell, ToolBackLink } from "@/components/tools/public-shell";
import { TiktokShopCalculator } from "./calculator";

export const metadata: Metadata = {
  title: "Calculadora de rendimiento TikTok Shop | creator.hub",
  description: "Sumá el costo de muestras, publicidad y comisión de TikTok Shop y calculá tu punto de equilibrio en ventas.",
};

export default function Page() {
  return (
    <PublicShell>
      <ToolBackLink />
      <TiktokShopCalculator />
    </PublicShell>
  );
}
