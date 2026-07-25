"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles, Copy } from "lucide-react";
import { toast } from "sonner";
import { ToolHeader } from "@/components/tools/tool-header";
import { ToolCta } from "@/components/tools/tool-cta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

const FORMATOS = [
  { id: "problema-solucion", label: "Problema → Solución" },
  { id: "testimonio", label: "Testimonio" },
  { id: "unboxing", label: "Unboxing" },
  { id: "comparativa", label: "Comparativa" },
  { id: "storytelling", label: "Storytelling" },
  { id: "5-beneficios", label: "5 beneficios" },
  { id: "pregunta-respuesta", label: "Pregunta y respuesta" },
  { id: "antes-despues", label: "Antes y después" },
  { id: "pov", label: "POV" },
  { id: "tutorial", label: "Tutorial" },
] as const;

const schema = z.object({
  producto: z.string().min(2, "Contanos el nombre del producto o marca"),
  audiencia: z.string().min(2, "¿A quién le hablás?"),
  beneficio: z.string().min(2, "¿Qué problema resuelve o qué beneficio da?"),
  formato: z.enum(FORMATOS.map((f) => f.id) as [string, ...string[]]),
});

type FormValues = z.infer<typeof schema>;

interface Script {
  hook: string;
  desarrollo: string;
  demostracion: string;
  pruebaSocial: string;
  cta: string;
}

function generate(v: FormValues): Script {
  const { producto, audiencia, beneficio } = v;
  switch (v.formato) {
    case "problema-solucion":
      return {
        hook: `Si sos ${audiencia} y todavía no probaste esto, tenés que verlo.`,
        desarrollo: `Durante mucho tiempo el problema fue "${beneficio.toLowerCase()}"... hasta que encontré ${producto}.`,
        demostracion: `Mostrá el "antes" (el problema en acción) y después usá ${producto} en tiempo real, cámara en mano.`,
        pruebaSocial: `"No puedo creer que nadie me lo haya recomendado antes" — reacción genuina a cámara.`,
        cta: `Link en mi perfil / bio para conseguir ${producto} — no te quedes con el problema.`,
      };
    case "testimonio":
      return {
        hook: `Llevo [X semanas] usando ${producto} y esto es lo que cambió.`,
        desarrollo: `Antes de usarlo, mi situación con "${beneficio.toLowerCase()}" era distinta. Contá tu experiencia personal, con detalles reales.`,
        demostracion: `Mostrá ${producto} en tu rutina diaria, tal cual lo usás vos.`,
        pruebaSocial: `Mirá a cámara: "Se los digo con la mano en el corazón, para ${audiencia} esto vale la pena."`,
        cta: `Yo lo compré en [tienda] — les dejo el link para que lo prueben ustedes también.`,
      };
    case "unboxing":
      return {
        hook: `Llegó esto que pedí y ${audiencia} tiene que verlo antes de comprar.`,
        desarrollo: `Abrí el paquete a cámara, comentá el packaging, lo que incluye y la primera impresión de ${producto}.`,
        demostracion: `Probalo en vivo apenas lo sacás de la caja — primera reacción sin editar.`,
        pruebaSocial: `"Tiene [X mil] reseñas y ahora entiendo por qué" — mencioná rating/reviews reales si los tenés.`,
        cta: `Dejo el link para que lo consigan ustedes también antes de que se agote.`,
      };
    case "comparativa":
      return {
        hook: `Probé ${producto} contra lo que usaba antes y el resultado me sorprendió.`,
        desarrollo: `Poné lado a lado la opción anterior vs. ${producto}, enfocándote en "${beneficio.toLowerCase()}".`,
        demostracion: `Split screen o corte rápido mostrando el mismo uso con ambas opciones.`,
        pruebaSocial: `"La diferencia se nota a simple vista" — mostrá el resultado final de cada una.`,
        cta: `Si tenés que elegir uno para ${audiencia}, este es el que yo recomiendo — link abajo.`,
      };
    case "storytelling":
      return {
        hook: `Esto me pasó la semana pasada y terminó cambiando cómo resuelvo "${beneficio.toLowerCase()}".`,
        desarrollo: `Contá la historia en primera persona: el momento en que descubriste ${producto} y por qué lo probaste.`,
        demostracion: `Recreá el momento clave usando ${producto}, con tomas naturales, no de estudio.`,
        pruebaSocial: `"Se lo conté a mis amigas/os de ${audiencia} y todos terminaron pidiéndomelo."`,
        cta: `Si te pasa lo mismo que a mí, te dejo el link para que lo pruebes.`,
      };
    case "5-beneficios":
      return {
        hook: `5 razones por las que ${producto} se volvió indispensable para mí.`,
        desarrollo: `Enumerá 5 beneficios concretos, empezando por "${beneficio.toLowerCase()}", uno por corte de cámara.`,
        demostracion: `Un plano corto por beneficio, mostrando ${producto} en uso real.`,
        pruebaSocial: `"El beneficio #[X] fue el que más me sorprendió" — remarcá el más fuerte para ${audiencia}.`,
        cta: `Todo esto por [precio/promo] — link en la bio.`,
      };
    case "pregunta-respuesta":
      return {
        hook: `"¿${producto} realmente sirve para ${beneficio.toLowerCase()}?" — Te respondo.`,
        desarrollo: `Respondé la pregunta más común que te hacen sobre ${producto}, con tu experiencia real.`,
        demostracion: `Mostrá ${producto} resolviendo justo esa duda, en tiempo real.`,
        pruebaSocial: `"Me lo preguntan todo el tiempo en los comentarios" — mencioná que es una duda recurrente de ${audiencia}.`,
        cta: `Cualquier otra duda, dejámela en los comentarios — y el link para comprarlo, en la bio.`,
      };
    case "antes-despues":
      return {
        hook: `Esto es lo que cambió en [X tiempo] usando ${producto}.`,
        desarrollo: `Mostrá el "antes" ligado a "${beneficio.toLowerCase()}" y contá qué te llevó a probar ${producto}.`,
        demostracion: `Corte directo al "después": el resultado real, sin filtros.`,
        pruebaSocial: `"No es magia, es constancia + el producto correcto" — hablale directo a ${audiencia}.`,
        cta: `Si querés tu propio "antes y después", el link está en mi bio.`,
      };
    case "pov":
      return {
        hook: `POV: sos ${audiencia} y por fin encontrás algo que resuelve "${beneficio.toLowerCase()}".`,
        desarrollo: `Grabá en primera persona (POV), mostrando tu día a día con ${producto} como si la cámara fuera los ojos del espectador.`,
        demostracion: `Interactuá con ${producto} directamente frente a cámara, gestos y reacciones incluidas.`,
        pruebaSocial: `Texto en pantalla: "Si esto te pasa a vos también, seguí viendo."`,
        cta: `Guardá este video para cuando lo necesites — link para conseguirlo en la bio.`,
      };
    case "tutorial":
      return {
        hook: `Así uso ${producto} para resolver "${beneficio.toLowerCase()}" en menos de [X minutos].`,
        desarrollo: `Explicá paso a paso cómo se usa ${producto}, en 3 a 5 pasos numerados y fáciles de seguir.`,
        demostracion: `Mostrá cada paso en cámara, en tiempo real, con el resultado final al terminar.`,
        pruebaSocial: `"Lo probé yo misma/o antes de recomendártelo a vos, ${audiencia}."`,
        cta: `Guardá este tutorial y conseguí ${producto} con el link de mi bio.`,
      };
    default:
      return { hook: "", desarrollo: "", demostracion: "", pruebaSocial: "", cta: "" };
  }
}

const SECTION_LABELS: { key: keyof Script; label: string }[] = [
  { key: "hook", label: "Hook (primeros 3 segundos)" },
  { key: "desarrollo", label: "Desarrollo" },
  { key: "demostracion", label: "Demostración" },
  { key: "pruebaSocial", label: "Prueba social" },
  { key: "cta", label: "Call to action" },
];

export function GuionUgcGenerator() {
  const [script, setScript] = useState<Script | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { formato: FORMATOS[0].id } });

  function copyAll() {
    if (!script) return;
    const text = SECTION_LABELS.map((s) => `${s.label}:\n${script[s.key]}`).join("\n\n");
    navigator.clipboard.writeText(text);
    toast.success("Guion copiado al portapapeles");
  }

  return (
    <div className="flex flex-col gap-8">
      <ToolHeader
        icon={Sparkles}
        title="Generador de guion UGC"
        description="Elegí un formato y armá en segundos la estructura de tu próximo video: hook, desarrollo, demostración, prueba social y CTA."
      />

      <form onSubmit={handleSubmit((v) => setScript(generate(v as FormValues)))} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Producto o marca</Label>
          <Input placeholder="Ej: Suero facial Glow" {...register("producto")} />
          {errors.producto && <span className="text-xs text-destructive">{errors.producto.message}</span>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Público objetivo</Label>
          <Input placeholder="Ej: mujeres de 25 a 35 años" {...register("audiencia")} />
          {errors.audiencia && <span className="text-xs text-destructive">{errors.audiencia.message}</span>}
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label>Beneficio principal o problema que resuelve</Label>
          <Input placeholder="Ej: piel opaca y manchada" {...register("beneficio")} />
          {errors.beneficio && <span className="text-xs text-destructive">{errors.beneficio.message}</span>}
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label>Formato del video</Label>
          <select
            {...register("formato")}
            className="flex h-10 w-full rounded-lg border border-input bg-card px-3.5 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {FORMATOS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end sm:col-span-2">
          <Button type="submit" className="w-full sm:w-auto">
            Generar guion
          </Button>
        </div>
      </form>

      {script && (
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-5 p-6">
            {SECTION_LABELS.map((s) => (
              <div key={s.key} className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-primary">{s.label}</span>
                <p className="text-sm text-foreground">{script[s.key]}</p>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="self-start" onClick={copyAll}>
              <Copy className="size-4" />
              Copiar guion
            </Button>
          </Card>

          <ToolCta
            title="¿Querés que un creador grabe este guion por vos?"
            description="Encontrá creadores verificados que ya trabajan con marcas como la tuya."
            href="/creators"
            ctaLabel="Buscar creadores"
          />
        </div>
      )}
    </div>
  );
}
