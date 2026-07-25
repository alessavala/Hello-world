import type { Metadata } from "next";
import { PublicShell, ToolBackLink } from "@/components/tools/public-shell";
import { EvaluadorCampanasCalculator } from "./calculator";

export const metadata: Metadata = {
  title: "Evaluador de campañas | creator.hub",
  description: "Pegá los resultados reales de tu campaña con creadores y recibí un score de 0 a 100 con fortalezas y problemas.",
};

export default function Page() {
  return (
    <PublicShell>
      <ToolBackLink />
      <EvaluadorCampanasCalculator />
    </PublicShell>
  );
}
