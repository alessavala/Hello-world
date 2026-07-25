import type { Metadata } from "next";
import { PublicShell, ToolBackLink } from "@/components/tools/public-shell";
import { GuionUgcGenerator } from "./calculator";

export const metadata: Metadata = {
  title: "Generador de guion UGC | creator.hub",
  description: "Armá la estructura de tu próximo video UGC (hook, desarrollo, demostración, prueba social y CTA) en segundos.",
};

export default function Page() {
  return (
    <PublicShell>
      <ToolBackLink />
      <GuionUgcGenerator />
    </PublicShell>
  );
}
