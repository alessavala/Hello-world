"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShoppingBag } from "lucide-react";
import { ToolHeader } from "@/components/tools/tool-header";
import { ToolCta } from "@/components/tools/tool-cta";
import { NumberField } from "@/components/tools/number-field";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";

const schema = z.object({
  precioVenta: z.coerce.number().min(0.01),
  costoProducto: z.coerce.number().min(0),
  comisionTiktokShop: z.coerce.number().min(0).max(100),
  costoPorMuestra: z.coerce.number().min(0),
  muestrasEnviadas: z.coerce.number().min(0),
  inversionPublicidad: z.coerce.number().min(0),
  pagoCreadores: z.coerce.number().min(0),
  ventasGeneradas: z.coerce.number().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Result {
  comisionMonto: number;
  contribucionPorUnidad: number;
  inversionTotal: number;
  puntoEquilibrioUnidades: number;
  ingresosNecesarios: number;
  ventasGeneradas?: number;
  utilidadNeta: number | null;
  roi: number | null;
  roas: number | null;
}

function calculate(v: FormValues): Result {
  const comisionMonto = v.precioVenta * (v.comisionTiktokShop / 100);
  const contribucionPorUnidad = v.precioVenta - v.costoProducto - comisionMonto;
  const costoMuestras = v.costoPorMuestra * v.muestrasEnviadas;
  const inversionTotal = costoMuestras + v.inversionPublicidad + v.pagoCreadores;
  const puntoEquilibrioUnidades = contribucionPorUnidad > 0 ? Math.ceil(inversionTotal / contribucionPorUnidad) : Infinity;
  const ingresosNecesarios = Number.isFinite(puntoEquilibrioUnidades) ? puntoEquilibrioUnidades * v.precioVenta : Infinity;

  let utilidadNeta: number | null = null;
  let roi: number | null = null;
  let roas: number | null = null;
  if (v.ventasGeneradas) {
    const ingresosReales = v.ventasGeneradas * v.precioVenta;
    utilidadNeta = v.ventasGeneradas * contribucionPorUnidad - inversionTotal;
    roi = inversionTotal > 0 ? (utilidadNeta / inversionTotal) * 100 : 0;
    roas = inversionTotal > 0 ? ingresosReales / inversionTotal : 0;
  }

  return { comisionMonto, contribucionPorUnidad, inversionTotal, puntoEquilibrioUnidades, ingresosNecesarios, utilidadNeta, roi, roas };
}

export function TiktokShopCalculator() {
  const [result, setResult] = useState<Result | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  return (
    <div className="flex flex-col gap-8">
      <ToolHeader
        icon={ShoppingBag}
        title="Calculadora de rendimiento TikTok Shop"
        description="Sumá el costo de las muestras que enviás a creadores, la publicidad y la comisión de TikTok Shop, y mirá cuántas ventas necesitás para llegar al punto de equilibrio."
      />

      <form onSubmit={handleSubmit((v) => setResult(calculate(v)))} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField label="Precio de venta" registration={register("precioVenta")} error={errors.precioVenta?.message} />
        <NumberField label="Costo del producto" suffix="por unidad" registration={register("costoProducto")} error={errors.costoProducto?.message} />
        <NumberField
          label="Comisión de TikTok Shop"
          suffix="%"
          registration={register("comisionTiktokShop")}
          error={errors.comisionTiktokShop?.message}
        />
        <NumberField
          label="Costo por muestra"
          suffix="por unidad enviada"
          registration={register("costoPorMuestra")}
          error={errors.costoPorMuestra?.message}
        />
        <NumberField
          label="Muestras enviadas a creadores"
          registration={register("muestrasEnviadas")}
          error={errors.muestrasEnviadas?.message}
        />
        <NumberField
          label="Inversión en publicidad (TikTok Ads)"
          registration={register("inversionPublicidad")}
          error={errors.inversionPublicidad?.message}
        />
        <NumberField label="Pago a creadores" suffix="además de las muestras" registration={register("pagoCreadores")} error={errors.pagoCreadores?.message} />
        <NumberField
          label="Ventas generadas"
          suffix="opcional, para ver tu resultado real"
          registration={register("ventasGeneradas")}
          error={errors.ventasGeneradas?.message}
        />
        <div className="flex items-end">
          <Button type="submit" className="w-full">
            Calcular
          </Button>
        </div>
      </form>

      {result && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Contribución por unidad" value={formatCurrency(result.contribucionPorUnidad)} tone="primary" />
            <StatCard label="Inversión total" value={formatCurrency(result.inversionTotal)} tone="amber" />
            <StatCard
              label="Punto de equilibrio"
              value={Number.isFinite(result.puntoEquilibrioUnidades) ? `${result.puntoEquilibrioUnidades} unidades` : "—"}
              tone="indigo"
            />
            <StatCard
              label="Ingresos necesarios"
              value={Number.isFinite(result.ingresosNecesarios) ? formatCurrency(result.ingresosNecesarios) : "—"}
              tone="indigo"
            />
            {result.utilidadNeta !== null && (
              <StatCard label="Utilidad neta real" value={formatCurrency(result.utilidadNeta)} tone={result.utilidadNeta >= 0 ? "success" : "pink"} />
            )}
            {result.roi !== null && (
              <StatCard label="ROI real" value={formatPercent(result.roi)} tone={result.roi >= 0 ? "success" : "pink"} />
            )}
            {result.roas !== null && <StatCard label="ROAS real" value={`${formatNumber(result.roas)}x`} tone="indigo" />}
          </div>

          <ToolCta
            title={
              Number.isFinite(result.puntoEquilibrioUnidades)
                ? `Necesitás vender ${result.puntoEquilibrioUnidades} unidades para recuperar lo invertido en muestras, publicidad y creadores.`
                : "Con estos números el margen por unidad no alcanza para cubrir la inversión - ajustá el precio, el costo o la comisión."
            }
            description="Sumá más creadores especializados en TikTok Shop para llegar antes a tu punto de equilibrio."
            href="/creators"
            ctaLabel="Buscar creadores"
          />
        </div>
      )}
    </div>
  );
}
