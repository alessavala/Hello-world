"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users } from "lucide-react";
import { ToolHeader } from "@/components/tools/tool-header";
import { ToolCta } from "@/components/tools/tool-cta";
import { NumberField } from "@/components/tools/number-field";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/format";

const schema = z.object({
  inversionPublicitaria: z.coerce.number().min(0),
  costosCreadores: z.coerce.number().min(0),
  costosAgencia: z.coerce.number().min(0),
  software: z.coerce.number().min(0),
  produccionContenido: z.coerce.number().min(0),
  nuevosClientes: z.coerce.number().min(1),
  ltvPromedio: z.coerce.number().min(0).optional(),
  ingresoMensualCliente: z.coerce.number().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Result {
  cac: number;
  cacMaximoPermitido: number | null;
  periodoRecuperacionMeses: number | null;
  ratioLtvCac: number | null;
}

function calculate(v: FormValues): Result {
  const inversionTotal = v.inversionPublicitaria + v.costosCreadores + v.costosAgencia + v.software + v.produccionContenido;
  const cac = inversionTotal / v.nuevosClientes;
  const cacMaximoPermitido = v.ltvPromedio ? v.ltvPromedio / 3 : null;
  const periodoRecuperacionMeses = v.ingresoMensualCliente ? cac / v.ingresoMensualCliente : null;
  const ratioLtvCac = v.ltvPromedio ? v.ltvPromedio / cac : null;
  return { cac, cacMaximoPermitido, periodoRecuperacionMeses, ratioLtvCac };
}

function healthBadge(ratio: number) {
  if (ratio < 1) return <Badge variant="destructive">No rentable</Badge>;
  if (ratio < 3) return <Badge variant="warning">Riesgo</Badge>;
  return <Badge variant="success">Saludable</Badge>;
}

export function CacCalculator() {
  const [result, setResult] = useState<Result | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  return (
    <div className="flex flex-col gap-8">
      <ToolHeader
        icon={Users}
        title="Calculadora de CAC"
        description="Cuánto te cuesta conseguir un cliente nuevo, sumando publicidad, creadores, agencia, software y producción de contenido."
      />

      <form onSubmit={handleSubmit((v) => setResult(calculate(v)))} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField label="Inversión publicitaria" registration={register("inversionPublicitaria")} error={errors.inversionPublicitaria?.message} />
        <NumberField label="Costos de creadores" registration={register("costosCreadores")} error={errors.costosCreadores?.message} />
        <NumberField label="Costos de agencia" registration={register("costosAgencia")} error={errors.costosAgencia?.message} />
        <NumberField label="Software" registration={register("software")} error={errors.software?.message} />
        <NumberField label="Producción de contenido" registration={register("produccionContenido")} error={errors.produccionContenido?.message} />
        <NumberField label="Nuevos clientes" registration={register("nuevosClientes")} error={errors.nuevosClientes?.message} />
        <NumberField
          label="LTV promedio"
          suffix="opcional"
          registration={register("ltvPromedio")}
          error={errors.ltvPromedio?.message}
        />
        <NumberField
          label="Ingreso mensual promedio por cliente"
          suffix="opcional"
          registration={register("ingresoMensualCliente")}
          error={errors.ingresoMensualCliente?.message}
        />
        <div className="flex items-end sm:col-span-2">
          <Button type="submit" className="w-full sm:w-auto">
            Calcular
          </Button>
        </div>
      </form>

      {result && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="CAC" value={formatCurrency(result.cac)} tone="primary" />
            <StatCard label="CAC máximo recomendado" value={result.cacMaximoPermitido !== null ? formatCurrency(result.cacMaximoPermitido) : "—"} tone="amber" />
            <StatCard
              label="Periodo de recuperación"
              value={result.periodoRecuperacionMeses !== null ? `${formatNumber(result.periodoRecuperacionMeses)} meses` : "—"}
              tone="indigo"
            />
            <div className="flex flex-col justify-center gap-2 rounded-xl border border-border bg-card p-5 shadow-sm">
              <span className="text-sm font-medium text-muted">Ratio LTV:CAC</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-semibold text-foreground">{result.ratioLtvCac !== null ? `${formatNumber(result.ratioLtvCac)}x` : "—"}</span>
                {result.ratioLtvCac !== null && healthBadge(result.ratioLtvCac)}
              </div>
            </div>
          </div>

          <ToolCta
            title={`Tu CAC es de ${formatCurrency(result.cac)}.`}
            description="Los creadores suelen bajar el CAC de marcas de ecommerce - descubrí cuánto podrías ahorrar."
            href="/creators"
            ctaLabel="Buscar creadores"
          />
        </div>
      )}
    </div>
  );
}
