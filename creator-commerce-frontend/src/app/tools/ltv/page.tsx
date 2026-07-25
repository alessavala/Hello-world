import type { Metadata } from "next";
import { PublicShell, ToolBackLink } from "@/components/tools/public-shell";
import { LtvCalculator } from "./calculator";

export const metadata: Metadata = {
  title: "Calculadora de LTV (valor de vida del cliente) | creator.hub",
  description: "Calculá gratis el LTV de tu cliente promedio y el ratio LTV:CAC para saber si tu negocio es saludable.",
};

export default function Page() {
  return (
    <PublicShell>
      <ToolBackLink />
      <LtvCalculator />
    </PublicShell>
  );
}
