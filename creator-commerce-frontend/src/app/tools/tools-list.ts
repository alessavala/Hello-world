export interface ToolMeta {
  slug: string;
  name: string;
  description: string;
  icon: "TrendingUp" | "Package" | "Users" | "Repeat" | "Target" | "MousePointerClick" | "Sparkles" | "ClipboardCheck" | "ShoppingBag";
}

export const TOOLS: ToolMeta[] = [
  {
    slug: "roi-campanas",
    name: "Calculadora de ROI de campañas",
    description: "Medí la rentabilidad de una campaña con creadores: inversión, ROI, ROAS y punto de equilibrio.",
    icon: "TrendingUp",
  },
  {
    slug: "amazon-fba",
    name: "Calculadora Amazon FBA",
    description: "Margen por unidad, ROI sobre inventario y el ACOS máximo que te podés permitir en Amazon Ads.",
    icon: "Package",
  },
  {
    slug: "cac",
    name: "Calculadora de CAC",
    description: "Cuánto te cuesta conseguir un cliente nuevo, y cuál es el máximo que te conviene pagar.",
    icon: "Users",
  },
  {
    slug: "ltv",
    name: "Calculadora de LTV",
    description: "El valor de vida de un cliente y el ratio LTV:CAC que indica si tu negocio es saludable.",
    icon: "Repeat",
  },
  {
    slug: "inversion-publicitaria",
    name: "Calculadora de inversión publicitaria",
    description: "Proyectá clics, ventas y ROAS antes de gastar un peso en Meta, TikTok o Amazon Ads.",
    icon: "Target",
  },
  {
    slug: "cpc-maximo",
    name: "Calculadora de CPC máximo rentable",
    description: "El costo por clic más alto que podés pagar sin perder plata en cada venta.",
    icon: "MousePointerClick",
  },
  {
    slug: "guion-ugc",
    name: "Generador de guion UGC",
    description: "Armá la estructura de tu próximo video (hook, desarrollo, prueba social y CTA) en segundos.",
    icon: "Sparkles",
  },
  {
    slug: "evaluador-campanas",
    name: "Evaluador de campañas",
    description: "Pegá los resultados reales de tu campaña y recibí un score con fortalezas y problemas.",
    icon: "ClipboardCheck",
  },
  {
    slug: "tiktok-shop",
    name: "Calculadora de rendimiento TikTok Shop",
    description: "Sumá muestras, publicidad y comisión de TikTok Shop y calculá tu punto de equilibrio.",
    icon: "ShoppingBag",
  },
];

export function toolBySlug(slug: string) {
  return TOOLS.find((t) => t.slug === slug);
}
