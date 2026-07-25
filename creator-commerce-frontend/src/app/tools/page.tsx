import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardCheck, MousePointerClick, Package, Repeat, ShoppingBag, Sparkles, Target, TrendingUp, Users } from "lucide-react";
import { PublicShell } from "@/components/tools/public-shell";
import { Card } from "@/components/ui/card";
import { TOOLS } from "./tools-list";

export const metadata: Metadata = {
  title: "Herramientas gratuitas para vender más | creator.hub",
  description:
    "Calculadoras gratis de ROI, ROAS, CAC, LTV, Amazon FBA y más para marcas y creadores de contenido en Amazon, Mercado Libre y TikTok Shop.",
};

const ICONS = { TrendingUp, Package, Users, Repeat, Target, MousePointerClick, Sparkles, ClipboardCheck, ShoppingBag };

export default function ToolsPage() {
  return (
    <PublicShell>
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Herramientas gratuitas para vender más</h1>
        <p className="max-w-xl text-muted">
          Calculadoras pensadas para marcas y creadores que venden en Amazon, Mercado Libre y TikTok Shop. Sin registro, resultado
          instantáneo.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TOOLS.map((tool) => {
          const Icon = ICONS[tool.icon];
          return (
            <Link key={tool.slug} href={`/tools/${tool.slug}`}>
              <Card className="flex h-full flex-col gap-3 p-6 transition hover:shadow-md">
                <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 text-primary">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="font-semibold text-foreground">{tool.name}</p>
                  <p className="mt-1 text-sm text-muted">{tool.description}</p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </PublicShell>
  );
}
