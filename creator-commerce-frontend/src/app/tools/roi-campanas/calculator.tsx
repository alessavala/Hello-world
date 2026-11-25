"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TrendingUp } from "lucide-react";
import { ToolHeader } from "@/components/tools/tool-header";
import { ToolCta } from "@/components/tools/tool-cta";
import { NumberField } from "@/components/tools/number-field";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";

const schema = z.object({
  costoProducto: z.coerce.number().min(0),
  costoEnvio: z.coerce.number().min(0),
  pagoCreador: z.coerce.number().min(0),
  comisionMarketplace: z.coerce.number().min(0).max(100),
  ventasGeneradas: z.coerce.number().min(1),
  ticketPromedio: z.coerce.number().min(0.01),
  margenBruto: z.coerce.number().min(0).max(100),
});

type FormValues = z.infer<typeof schema>;

interface Result {
  ingresos: number;
  inversionTotal: number;
  utilidadBruta: number;
  utilidadNeta: number;
  roi: number;
  roas: number;
  puntoEquilibrioUnidades: number;
  ventasParaRecuperar: number;
}

function calculate(v: FormValues): Result {
  const ingresos = v.ventasGeneradas * v.ticketPromedio;
  const costoVariableUnitario = v.costoProducto + v.costoEnvio;
  const comisionMonto = ingresos * (v.comisionMarketplace / 100);
  const inversionTotal = costoVariableUnitario * v.ventasGeneradas + v.pagoCreador + comisionMonto;
  const utilidadBruta = ingresos * (v.margenBruto / 100);
  const utilidadNeta = utilidadBruta - inversionTotal;
  const roi = inversionTotal > 0 ? (utilidadNeta / inversionTotal) * 100 : 0;
  const roas = inversionTotal > 0 ? ingresos / inversionTotal : 0;
  const contribucionPorUnidad = v.ticketPromedio - costoVariableUnitario - v.ticketPromedio * (v.comisionMarketplace / 100);
  const puntoEquilibrioUnidades = contribucionPorUnidad > 0 ? Math.ceil(v.pagoCreador / contribucionPorUnidad) : Infinity;
  const ventasParaRecuperar = contribucionPorUnidad > 0 ? Math.ceil(inversionTotal / contribucionPorUnidad) : Infinity;
  return { ingresos, inversionTotal, utilidadBruta, utilidadNeta, roi, roas, puntoEquilibrioUnidades, ventasParaRecuperar };
}

export function RoiCampanasCalculator() {
  const [result, setResult] = useState<Result | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  return (
    <div className="flex flex-col gap-8">
      <ToolHeader
        icon={TrendingUp}
        title="Calculadora de ROI de campañas con creadores"
        description="Metele los números de tu campaña y mirá si es rentable antes de lanzarla - o evaluá una que ya corriste."
      />

      <form onSubmit={handleSubmit((v) => setResult(calculate(v)))} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField label="Costo del producto" suffix="por unidad" registration={register("costoProducto")} error={errors.costoProducto?.message} />
        <NumberField label="Costo de envío" suffix="por unidad" registration={register("costoEnvio")} error={errors.costoEnvio?.message} />
        <NumberField label="Pago al creador" suffix="total" registration={register("pagoCreador")} error={errors.pagoCreador?.message} />
        <NumberField
          label="Comisión del marketplace"
          suffix="%"
          registration={register("comisionMarketplace")}
          error={errors.comisionMarketplace?.message}
        />
        <NumberField label="Ventas generadas" suffix="unidades" registration={register("ventasGeneradas")} error={errors.ventasGeneradas?.message} />
        <NumberField label="Ticket promedio" suffix="$" registration={register("ticketPromedio")} error={errors.ticketPromedio?.message} />
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
            <StatCard label="Inversión total" value={formatCurrency(result.inversionTotal)} tone="amber" />
            <StatCard label="Ingresos" value={formatCurrency(result.ingresos)} tone="primary" />
            <StatCard label="Utilidad neta" value={formatCurrency(result.utilidadNeta)} tone={result.utilidadNeta >= 0 ? "success" : "pink"} />
            <StatCard label="ROI" value={formatPercent(result.roi)} tone={result.roi >= 0 ? "success" : "pink"} />
            <StatCard label="ROAS" value={`${formatNumber(result.roas)}x`} tone="indigo" />
            <StatCard label="Utilidad bruta" value={formatCurrency(result.utilidadBruta)} tone="primary" />
            <StatCard
              label="Punto de equilibrio"
              value={Number.isFinite(result.puntoEquilibrioUnidades) ? `${result.puntoEquilibrioUnidades} unidades` : "—"}
              tone="amber"
            />
            <StatCard
              label="Ventas para recuperar inversión"
              value={Number.isFinite(result.ventasParaRecuperar) ? `${result.ventasParaRecuperar} unidades` : "—"}
              tone="amber"
            />
          </div>

          <ToolCta
            title={
              Number.isFinite(result.ventasParaRecuperar)
                ? `Tu campaña necesita al menos ${result.ventasParaRecuperar} ventas para ser rentable.`
                : "Con estos números la campaña no recupera la inversión - ajustá el pago al creador o el ticket promedio."
            }
            description="Encontrá creadores especializados en tu categoría para maximizar tus chances de llegar a ese número."
            href="/creators"
            ctaLabel="Buscar creadores"
          />
        </div>
      )}
    </div>
  );
}
