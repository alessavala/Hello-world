"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Repeat } from "lucide-react";
import { ToolHeader } from "@/components/tools/tool-header";
import { ToolCta } from "@/components/tools/tool-cta";
import { NumberField } from "@/components/tools/number-field";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/format";

const schema = z.object({
  ticketPromedio: z.coerce.number().min(0.01),
  frecuenciaAnual: z.coerce.number().min(0),
  margenBruto: z.coerce.number().min(0).max(100),
  duracionAnios: z.coerce.number().min(0),
  tasaRecompra: z.coerce.number().min(0).max(100),
  cacActual: z.coerce.number().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Result {
  ltvBruto: number;
  ltvConMargen: number;
  cacRecomendado: number;
  ratioLtvCac: number | null;
}

function calculate(v: FormValues): Result {
  const duracionEfectiva = v.duracionAnios * (v.tasaRecompra / 100);
  const ltvBruto = v.ticketPromedio * v.frecuenciaAnual * duracionEfectiva;
  const ltvConMargen = ltvBruto * (v.margenBruto / 100);
  const cacRecomendado = ltvConMargen / 3;
  const ratioLtvCac = v.cacActual ? ltvConMargen / v.cacActual : null;
  return { ltvBruto, ltvConMargen, cacRecomendado, ratioLtvCac };
}

function healthBadge(ratio: number) {
  if (ratio < 1) return <Badge variant="destructive">No rentable</Badge>;
  if (ratio < 3) return <Badge variant="warning">Riesgo</Badge>;
  return <Badge variant="success">Saludable</Badge>;
}

export function LtvCalculator() {
  const [result, setResult] = useState<Result | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  return (
    <div className="flex flex-col gap-8">
      <ToolHeader
        icon={Repeat}
        title="Calculadora de LTV"
        description="El valor de vida de tu cliente promedio, ajustado por tasa de recompra y margen - y el CAC máximo que te conviene pagar."
      />

      <form onSubmit={handleSubmit((v) => setResult(calculate(v)))} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField label="Ticket promedio" registration={register("ticketPromedio")} error={errors.ticketPromedio?.message} />
        <NumberField label="Frecuencia de compra" suffix="veces por año" registration={register("frecuenciaAnual")} error={errors.frecuenciaAnual?.message} />
        <NumberField label="Margen bruto" suffix="%" registration={register("margenBruto")} error={errors.margenBruto?.message} />
        <NumberField label="Duración promedio del cliente" suffix="años" registration={register("duracionAnios")} error={errors.duracionAnios?.message} />
        <NumberField label="Tasa de recompra" suffix="%" registration={register("tasaRecompra")} error={errors.tasaRecompra?.message} />
        <NumberField label="Tu CAC actual" suffix="opcional" registration={register("cacActual")} error={errors.cacActual?.message} />
        <div className="flex items-end">
          <Button type="submit" className="w-full">
            Calcular
          </Button>
        </div>
      </form>

      {result && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard label="LTV bruto" value={formatCurrency(result.ltvBruto)} tone="indigo" />
            <StatCard label="LTV con margen" value={formatCurrency(result.ltvConMargen)} tone="primary" />
            <StatCard label="CAC recomendado" value={formatCurrency(result.cacRecomendado)} tone="amber" />
            {result.ratioLtvCac !== null && (
              <div className="flex flex-col justify-center gap-2 rounded-xl border border-border bg-card p-5 shadow-sm">
                <span className="text-sm font-medium text-muted">Ratio LTV:CAC</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-semibold text-foreground">{formatNumber(result.ratioLtvCac)}x</span>
                  {healthBadge(result.ratioLtvCac)}
                </div>
              </div>
            )}
          </div>

          <ToolCta
            title={`Tu CAC recomendado es de ${formatCurrency(result.cacRecomendado)} o menos.`}
            description="Compará ese número contra lo que gastás hoy en performance y evaluá sumar creadores para bajarlo."
            href="/creators"
            ctaLabel="Buscar creadores"
          />
        </div>
      )}
    </div>
  );
}
