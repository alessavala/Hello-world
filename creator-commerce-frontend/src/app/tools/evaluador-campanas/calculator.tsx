"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ClipboardCheck, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { ToolHeader } from "@/components/tools/tool-header";
import { ToolCta } from "@/components/tools/tool-cta";
import { NumberField } from "@/components/tools/number-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";

const schema = z.object({
  impresiones: z.coerce.number().min(1),
  clics: z.coerce.number().min(0),
  conversiones: z.coerce.number().min(0),
  ventas: z.coerce.number().min(0),
  costoCreador: z.coerce.number().min(0.01),
  contenidoGenerado: z.coerce.number().min(1),
});

type FormValues = z.infer<typeof schema>;

type Status = "fuerte" | "atencion" | "problema";

interface Metric {
  label: string;
  value: string;
  subscore: number;
  status: Status;
  strengthText: string;
  problemText: string;
}

interface Evaluation {
  score: number;
  scoreLabel: string;
  metrics: Metric[];
  ctr: number;
  tasaConversion: number;
  roas: number;
  cpc: number;
  cpa: number;
  costoPorContenido: number;
}

function scoreLinear(value: number, min: number, max: number): number {
  if (max === min) return 0;
  const pct = ((value - min) / (max - min)) * 100;
  return Math.min(100, Math.max(0, Math.round(pct)));
}

function statusFromSubscore(subscore: number): Status {
  if (subscore >= 70) return "fuerte";
  if (subscore >= 40) return "atencion";
  return "problema";
}

function evaluate(v: FormValues): Evaluation {
  const ctr = (v.clics / v.impresiones) * 100;
  const tasaConversion = v.clics > 0 ? (v.conversiones / v.clics) * 100 : 0;
  const roas = v.costoCreador > 0 ? v.ventas / v.costoCreador : 0;
  const cpc = v.clics > 0 ? v.costoCreador / v.clics : Infinity;
  const cpa = v.conversiones > 0 ? v.costoCreador / v.conversiones : Infinity;
  const costoPorContenido = v.contenidoGenerado > 0 ? v.costoCreador / v.contenidoGenerado : Infinity;

  const ctrScore = scoreLinear(ctr, 0, 3);
  const conversionScore = scoreLinear(tasaConversion, 0, 5);
  const roasScore = scoreLinear(roas, 1, 5);

  const metrics: Metric[] = [
    {
      label: "CTR (clics / impresiones)",
      value: formatPercent(ctr),
      subscore: ctrScore,
      status: statusFromSubscore(ctrScore),
      strengthText: `Tu CTR de ${formatPercent(ctr)} está por encima del promedio del sector (referencia: ~1.5%).`,
      problemText: `Tu CTR de ${formatPercent(ctr)} está por debajo del promedio (~1.5%) - revisá el hook del contenido o el público al que llega.`,
    },
    {
      label: "Tasa de conversión (ventas / clics)",
      value: formatPercent(tasaConversion),
      subscore: conversionScore,
      status: statusFromSubscore(conversionScore),
      strengthText: `Tu tasa de conversión de ${formatPercent(tasaConversion)} es sólida (referencia: ~3%).`,
      problemText: `Tu tasa de conversión de ${formatPercent(tasaConversion)} está baja (referencia: ~3%) - revisá la landing, el precio o el link de compra.`,
    },
    {
      label: "ROAS (ventas / costo del creador)",
      value: `${formatNumber(roas)}x`,
      subscore: roasScore,
      status: statusFromSubscore(roasScore),
      strengthText: `Tu ROAS de ${formatNumber(roas)}x indica que la inversión en el creador se pagó sola y generó ganancia.`,
      problemText: `Tu ROAS de ${formatNumber(roas)}x está por debajo de 1.5x - la campaña no está recuperando lo invertido en el creador con margen.`,
    },
  ];

  const score = Math.round((ctrScore + conversionScore + roasScore) / 3);
  const scoreLabel = score >= 70 ? "Campaña sólida" : score >= 40 ? "Con oportunidades de mejora" : "Necesita ajustes importantes";

  return { score, scoreLabel, metrics, ctr, tasaConversion, roas, cpc, cpa, costoPorContenido };
}

function scoreBadgeVariant(score: number) {
  if (score >= 70) return "success" as const;
  if (score >= 40) return "warning" as const;
  return "destructive" as const;
}

function StatusIcon({ status }: { status: Status }) {
  if (status === "fuerte") return <CheckCircle2 className="size-4 text-success" />;
  if (status === "atencion") return <AlertTriangle className="size-4 text-warning" />;
  return <AlertCircle className="size-4 text-destructive" />;
}

export function EvaluadorCampanasCalculator() {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const strengths = evaluation?.metrics.filter((m) => m.status === "fuerte") ?? [];
  const problems = evaluation?.metrics.filter((m) => m.status === "problema") ?? [];
  const watch = evaluation?.metrics.filter((m) => m.status === "atencion") ?? [];

  return (
    <div className="flex flex-col gap-8">
      <ToolHeader
        icon={ClipboardCheck}
        title="Evaluador de campañas"
        description="Pegá los resultados reales de tu campaña con un creador y recibí un score de 0 a 100 con fortalezas, problemas y recomendaciones."
      />

      <form onSubmit={handleSubmit((v) => setEvaluation(evaluate(v)))} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField label="Impresiones / alcance" registration={register("impresiones")} error={errors.impresiones?.message} />
        <NumberField label="Clics" registration={register("clics")} error={errors.clics?.message} />
        <NumberField label="Conversiones (ventas)" registration={register("conversiones")} error={errors.conversiones?.message} />
        <NumberField label="Ingresos generados" registration={register("ventas")} error={errors.ventas?.message} />
        <NumberField label="Costo del creador" registration={register("costoCreador")} error={errors.costoCreador?.message} />
        <NumberField
          label="Piezas de contenido generadas"
          registration={register("contenidoGenerado")}
          error={errors.contenidoGenerado?.message}
        />
        <div className="flex items-end sm:col-span-2">
          <Button type="submit" className="w-full sm:w-auto">
            Evaluar campaña
          </Button>
        </div>
      </form>

      {evaluation && (
        <div className="flex flex-col gap-6">
          <Card className="flex flex-col items-center gap-3 p-8 text-center">
            <span className="text-sm font-medium text-muted">Campaign Score</span>
            <span className="text-5xl font-bold text-foreground">{evaluation.score}</span>
            <Badge variant={scoreBadgeVariant(evaluation.score)}>{evaluation.scoreLabel}</Badge>
          </Card>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard label="CPC efectivo" value={Number.isFinite(evaluation.cpc) ? formatCurrency(evaluation.cpc) : "—"} tone="indigo" />
            <StatCard label="CPA efectivo" value={Number.isFinite(evaluation.cpa) ? formatCurrency(evaluation.cpa) : "—"} tone="amber" />
            <StatCard
              label="Costo por pieza de contenido"
              value={Number.isFinite(evaluation.costoPorContenido) ? formatCurrency(evaluation.costoPorContenido) : "—"}
              tone="pink"
            />
          </div>

          <Card className="flex flex-col gap-4 p-6">
            <p className="text-sm font-semibold text-foreground">Detalle por métrica</p>
            {evaluation.metrics.map((m) => (
              <div key={m.label} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <StatusIcon status={m.status} />
                  <span className="text-sm text-foreground">{m.label}</span>
                </div>
                <span className="text-sm font-semibold text-foreground">{m.value}</span>
              </div>
            ))}
          </Card>

          {strengths.length > 0 && (
            <Card className="flex flex-col gap-2 border-success/30 bg-success/5 p-6">
              <p className="text-sm font-semibold text-success">Fortalezas</p>
              <ul className="flex flex-col gap-1.5">
                {strengths.map((m) => (
                  <li key={m.label} className="text-sm text-foreground">
                    {m.strengthText}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {watch.length > 0 && (
            <Card className="flex flex-col gap-2 border-warning/30 bg-warning/5 p-6">
              <p className="text-sm font-semibold text-warning">Por mejorar</p>
              <ul className="flex flex-col gap-1.5">
                {watch.map((m) => (
                  <li key={m.label} className="text-sm text-foreground">
                    {m.problemText}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {problems.length > 0 && (
            <Card className="flex flex-col gap-2 border-destructive/30 bg-destructive/5 p-6">
              <p className="text-sm font-semibold text-destructive">Problemas</p>
              <ul className="flex flex-col gap-1.5">
                {problems.map((m) => (
                  <li key={m.label} className="text-sm text-foreground">
                    {m.problemText}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <ToolCta
            title="¿Buscás mejorar estos números en tu próxima campaña?"
            description="Encontrá creadores verificados con el rendimiento que tu marca necesita."
            href="/creators"
            ctaLabel="Buscar creadores"
          />
        </div>
      )}
    </div>
  );
}
