import type { Metadata } from "next";
import { PublicShell, ToolBackLink } from "@/components/tools/public-shell";
import { CpcMaximoCalculator } from "./calculator";

export const metadata: Metadata = {
  title: "Calculadora de CPC máximo rentable | creator.hub",
  description: "El costo por clic más alto que podés pagar en Ads sin perder plata en cada venta.",
};

export default function Page() {
  return (
    <PublicShell>
      <ToolBackLink />
      <CpcMaximoCalculator />
    </PublicShell>
  );
}
