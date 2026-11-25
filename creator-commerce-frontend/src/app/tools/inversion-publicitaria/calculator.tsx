"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Target } from "lucide-react";
import { ToolHeader } from "@/components/tools/tool-header";
import { ToolCta } from "@/components/tools/tool-cta";
import { NumberField } from "@/components/tools/number-field";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/format";

const schema = z.object({
  presupuesto: z.coerce.number().min(0.01),
  cpcEsperado: z.coerce.number().min(0.01),
  conversionEstimada: z.coerce.number().min(0.01).max(100),
  ticketPromedio: z.coerce.number().min(0.01),
  margenBruto: z.coerce.number().min(0).max(100),
});

type FormValues = z.infer<typeof schema>;

interface Result {
  clics: number;
  conversiones: number;
  ingresos: number;
  cpa: number;
  roas: number;
  utilidad: number;
  cpaMaximoRentable: number;
}

function calculate(v: FormValues): Result {
  const clics = v.presupuesto / v.cpcEsperado;
  const conversiones = clics * (v.conversionEstimada / 100);
  const ingresos = conversiones * v.ticketPromedio;
  const cpa = conversiones > 0 ? v.presupuesto / conversiones : Infinity;
  const roas = ingresos / v.presupuesto;
  const utilidad = ingresos * (v.margenBruto / 100) - v.presupuesto;
  const cpaMaximoRentable = v.ticketPromedio * (v.margenBruto / 100);
  return { clics, conversiones, ingresos, cpa, roas, utilidad, cpaMaximoRentable };
}

function profitabilityBadge(cpa: number, cpaMaximoRentable: number) {
  if (!Number.isFinite(cpa)) return <Badge variant="destructive">Sin conversiones</Badge>;
  return cpa <= cpaMaximoRentable ? (
    <Badge variant="success">Rentable</Badge>
  ) : (
    <Badge variant="destructive">Por encima del máximo</Badge>
  );
}

export function InversionPublicitariaCalculator() {
  const [result, setResult] = useState<Result | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  return (
    <div className="flex flex-col gap-8">
      <ToolHeader
        icon={Target}
        title="Calculadora de inversión publicitaria"
        description="Proyectá clics, ventas, CPA y ROAS antes de invertir en Meta Ads, TikTok Ads o Amazon Ads - y conocé tu CPA máximo rentable."
      />

      <form onSubmit={handleSubmit((v) => setResult(calculate(v)))} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField label="Presupuesto" registration={register("presupuesto")} error={errors.presupuesto?.message} />
        <NumberField label="CPC esperado" registration={register("cpcEsperado")} error={errors.cpcEsperado?.message} />
        <NumberField
          label="Tasa de conversión estimada"
          suffix="%"
          registration={register("conversionEstimada")}
          error={errors.conversionEstimada?.message}
        />
        <NumberField label="Ticket promedio" registration={register("ticketPromedio")} error={errors.ticketPromedio?.message} />
        <NumberField label="Margen bruto" suffix="%" registration={register("margenBruto")} error={errors.margenBruto?.message} />
        <div className="flex items-end">
          <Button type="submit" className="w-full">
            Calcular
          </Button>
        </div>
      </form>

      {result && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Clics estimados" value={formatNumber(result.clics)} tone="indigo" />
            <StatCard label="Conversiones estimadas" value={formatNumber(result.conversiones)} tone="primary" />
            <StatCard label="Ingresos estimados" value={formatCurrency(result.ingresos)} tone="primary" />
            <StatCard label="ROAS" value={`${formatNumber(result.roas)}x`} tone="indigo" />
            <StatCard
              label="CPA estimado"
              value={Number.isFinite(result.cpa) ? formatCurrency(result.cpa) : "—"}
              tone="amber"
            />
            <StatCard label="CPA máximo rentable" value={formatCurrency(result.cpaMaximoRentable)} tone="amber" />
            <StatCard
              label="Utilidad estimada"
              value={formatCurrency(result.utilidad)}
              tone={result.utilidad >= 0 ? "success" : "pink"}
            />
            <div className="flex flex-col justify-center gap-2 rounded-xl border border-border bg-card p-5 shadow-sm">
              <span className="text-sm font-medium text-muted">Rentabilidad</span>
              <div className="flex items-center gap-2">{profitabilityBadge(result.cpa, result.cpaMaximoRentable)}</div>
            </div>
          </div>

          <ToolCta
            title={`Tu CPA máximo rentable es de ${formatCurrency(result.cpaMaximoRentable)}.`}
            description="Si tu CPC actual no te permite quedar por debajo de ese CPA, sumar creadores puede bajar tu costo por venta."
            href="/creators"
            ctaLabel="Buscar creadores"
          />
        </div>
      )}
    </div>
  );
}
