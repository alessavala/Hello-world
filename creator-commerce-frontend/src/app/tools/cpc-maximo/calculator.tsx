"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MousePointerClick } from "lucide-react";
import { ToolHeader } from "@/components/tools/tool-header";
import { ToolCta } from "@/components/tools/tool-cta";
import { NumberField } from "@/components/tools/number-field";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { formatCurrency } from "@/lib/format";

const schema = z.object({
  precioVenta: z.coerce.number().min(0.01),
  margenBruto: z.coerce.number().min(0).max(100),
  costosVariables: z.coerce.number().min(0),
  tasaDevolucion: z.coerce.number().min(0).max(100),
  tasaConversion: z.coerce.number().min(0.01).max(100),
});

type FormValues = z.infer<typeof schema>;

interface Result {
  utilidadDisponible: number;
  cpaMaximo: number;
  cpcMaximo: number;
}

function calculate(v: FormValues): Result {
  const utilidadDisponible =
    v.precioVenta * (v.margenBruto / 100) - v.costosVariables - v.precioVenta * (v.tasaDevolucion / 100);
  const cpaMaximo = Math.max(utilidadDisponible, 0);
  const cpcMaximo = cpaMaximo * (v.tasaConversion / 100);
  return { utilidadDisponible, cpaMaximo, cpcMaximo };
}

export function CpcMaximoCalculator() {
  const [result, setResult] = useState<Result | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  return (
    <div className="flex flex-col gap-8">
      <ToolHeader
        icon={MousePointerClick}
        title="Calculadora de CPC máximo rentable"
        description="El costo por clic más alto que podés pagar en Meta Ads, TikTok Ads o Amazon Ads sin perder plata en cada venta."
      />

      <form onSubmit={handleSubmit((v) => setResult(calculate(v)))} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField label="Precio de venta" registration={register("precioVenta")} error={errors.precioVenta?.message} />
        <NumberField label="Margen bruto" suffix="%" registration={register("margenBruto")} error={errors.margenBruto?.message} />
        <NumberField
          label="Costos variables"
          suffix="por venta"
          registration={register("costosVariables")}
          error={errors.costosVariables?.message}
        />
        <NumberField
          label="Tasa de devolución"
          suffix="%"
          registration={register("tasaDevolucion")}
          error={errors.tasaDevolucion?.message}
        />
        <NumberField
          label="Tasa de conversión"
          suffix="%"
          registration={register("tasaConversion")}
          error={errors.tasaConversion?.message}
        />
        <div className="flex items-end">
          <Button type="submit" className="w-full">
            Calcular
          </Button>
        </div>
      </form>

      {result && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard label="Utilidad disponible por venta" value={formatCurrency(result.utilidadDisponible)} tone="primary" />
            <StatCard label="CPA máximo" value={formatCurrency(result.cpaMaximo)} tone="amber" />
            <StatCard label="CPC máximo" value={formatCurrency(result.cpcMaximo)} tone="success" />
          </div>

          <ToolCta
            title={`Tu CPC máximo rentable es de ${formatCurrency(result.cpcMaximo)}.`}
            description="Si tu CPC actual en Ads está por encima de ese número, los creadores pueden darte ventas a un costo más bajo."
            href="/creators"
            ctaLabel="Buscar creadores"
          />
        </div>
      )}
    </div>
  );
}
