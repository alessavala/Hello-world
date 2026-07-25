import type { Metadata } from "next";
import { PublicShell, ToolBackLink } from "@/components/tools/public-shell";
import { RoiCampanasCalculator } from "./calculator";

export const metadata: Metadata = {
  title: "Calculadora de ROI de campañas con creadores | creator.hub",
  description: "Calculá gratis la inversión, ROI, ROAS y punto de equilibrio de una campaña con creadores de contenido.",
};

export default function Page() {
  return (
    <PublicShell>
      <ToolBackLink />
      <RoiCampanasCalculator />
    </PublicShell>
  );
}
