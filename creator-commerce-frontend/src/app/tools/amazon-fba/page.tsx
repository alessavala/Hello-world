import type { Metadata } from "next";
import { PublicShell, ToolBackLink } from "@/components/tools/public-shell";
import { AmazonFbaCalculator } from "./calculator";

export const metadata: Metadata = {
  title: "Calculadora Amazon FBA | creator.hub",
  description: "Calculá gratis tu margen por unidad, ROI sobre inventario y el ACOS máximo rentable para vender en Amazon FBA.",
};

export default function Page() {
  return (
    <PublicShell>
      <ToolBackLink />
      <AmazonFbaCalculator />
    </PublicShell>
  );
}
