"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Package } from "lucide-react";
import { ToolHeader } from "@/components/tools/tool-header";
import { ToolCta } from "@/components/tools/tool-cta";
import { NumberField } from "@/components/tools/number-field";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { formatCurrency, formatPercent } from "@/lib/format";

const schema = z.object({
  precioVenta: z.coerce.number().min(0.01),
  costoProducto: z.coerce.number().min(0),
  costoImportacion: z.coerce.number().min(0),
  tarifaReferencia: z.coerce.number().min(0).max(100),
  tarifaFba: z.coerce.number().min(0),
  almacenamiento: z.coerce.number().min(0),
  publicidad: z.coerce.number().min(0),
  devoluciones: z.coerce.number().min(0).max(100),
  iva: z.coerce.number().min(0).max(100),
});

type FormValues = z.infer<typeof schema>;

interface Result {
  utilidadNetaPorUnidad: number;
  margenPorcentual: number;
  roiInventario: number;
  acosMaximo: number;
  precioMinimoRentable: number;
}

function calculate(v: FormValues): Result {
  const costosSinPublicidad = v.costoProducto + v.costoImportacion + v.tarifaFba + v.almacenamiento;
  const tarifaReferenciaMonto = v.precioVenta * (v.tarifaReferencia / 100);
  const impuestosMonto = v.precioVenta * (v.iva / 100);
  const devolucionesMonto = v.precioVenta * (v.devoluciones / 100);
  const margenAntesPublicidad = v.precioVenta - costosSinPublicidad - tarifaReferenciaMonto - impuestosMonto - devolucionesMonto;
  const acosMaximo = (margenAntesPublicidad / v.precioVenta) * 100;
  const utilidadNetaPorUnidad = margenAntesPublicidad - v.publicidad;
  const margenPorcentual = (utilidadNetaPorUnidad / v.precioVenta) * 100;
  const inversionUnidad = v.costoProducto + v.costoImportacion;
  const roiInventario = inversionUnidad > 0 ? (utilidadNetaPorUnidad / inversionUnidad) * 100 : 0;
  const tasaDeducciones = v.tarifaReferencia / 100 + v.iva / 100 + v.devoluciones / 100;
  const precioMinimoRentable = tasaDeducciones < 1 ? (costosSinPublicidad + v.publicidad) / (1 - tasaDeducciones) : Infinity;
  return { utilidadNetaPorUnidad, margenPorcentual, roiInventario, acosMaximo, precioMinimoRentable };
}

export function AmazonFbaCalculator() {
  const [result, setResult] = useState<Result | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  return (
    <div className="flex flex-col gap-8">
      <ToolHeader
        icon={Package}
        title="Calculadora Amazon FBA"
        description="Tu margen real por unidad después de tarifas, envío FBA, devoluciones e impuestos - y cuánto podés gastar en Ads sin perder plata."
      />

      <form onSubmit={handleSubmit((v) => setResult(calculate(v)))} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField label="Precio de venta" registration={register("precioVenta")} error={errors.precioVenta?.message} />
        <NumberField label="Costo del producto" registration={register("costoProducto")} error={errors.costoProducto?.message} />
        <NumberField label="Costo de importación" registration={register("costoImportacion")} error={errors.costoImportacion?.message} />
        <NumberField label="Tarifa de referencia" suffix="%" registration={register("tarifaReferencia")} error={errors.tarifaReferencia?.message} />
        <NumberField label="Tarifa FBA" registration={register("tarifaFba")} error={errors.tarifaFba?.message} />
        <NumberField label="Almacenamiento" registration={register("almacenamiento")} error={errors.almacenamiento?.message} />
        <NumberField label="Publicidad" suffix="por unidad" registration={register("publicidad")} error={errors.publicidad?.message} />
        <NumberField label="Devoluciones estimadas" suffix="%" registration={register("devoluciones")} error={errors.devoluciones?.message} />
        <NumberField label="IVA u otros impuestos" suffix="%" registration={register("iva")} error={errors.iva?.message} />
        <div className="flex items-end">
          <Button type="submit" className="w-full">
            Calcular
          </Button>
        </div>
      </form>

      {result && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard
              label="Utilidad neta por unidad"
              value={formatCurrency(result.utilidadNetaPorUnidad)}
              tone={result.utilidadNetaPorUnidad >= 0 ? "success" : "pink"}
            />
            <StatCard label="Margen %" value={formatPercent(result.margenPorcentual)} tone="primary" />
            <StatCard label="ROI sobre inventario" value={formatPercent(result.roiInventario)} tone="indigo" />
            <StatCard label="ACOS máximo permitido" value={formatPercent(result.acosMaximo)} tone="amber" />
            <StatCard
              label="Precio mínimo rentable"
              value={Number.isFinite(result.precioMinimoRentable) ? formatCurrency(result.precioMinimoRentable) : "—"}
              tone="amber"
            />
          </div>

          <ToolCta
            title={`Tu ACOS máximo rentable es de ${formatPercent(result.acosMaximo)}.`}
            description="Encontrá creadores afiliados para vender más sin depender solo de Amazon Ads."
            href="/creators"
            ctaLabel="Buscar creadores"
          />
        </div>
      )}
    </div>
  );
}
