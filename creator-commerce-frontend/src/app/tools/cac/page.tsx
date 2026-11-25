import type { Metadata } from "next";
import { PublicShell, ToolBackLink } from "@/components/tools/public-shell";
import { CacCalculator } from "./calculator";

export const metadata: Metadata = {
  title: "Calculadora de CAC (costo de adquisición de cliente) | creator.hub",
  description: "Calculá gratis cuánto te cuesta conseguir un cliente nuevo, y el CAC máximo recomendado según tu LTV.",
};

export default function Page() {
  return (
    <PublicShell>
      <ToolBackLink />
      <CacCalculator />
    </PublicShell>
  );
}
