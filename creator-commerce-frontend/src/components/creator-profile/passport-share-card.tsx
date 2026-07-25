"use client";

import { Share2, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PassportShareCard({ creatorId }: { creatorId: string }) {
  const url = typeof window !== "undefined" ? `${window.location.origin}/p/${creatorId}` : `/p/${creatorId}`;

  function copyLink() {
    navigator.clipboard.writeText(url);
    toast.success("Enlace copiado al portapapeles");
  }

  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-center gap-2">
        <Share2 className="size-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Compartir mi Creator Passport</p>
      </div>
      <p className="text-sm text-muted">
        Cualquier persona puede ver tu Creator Passport con este enlace, sin necesidad de crear una cuenta - usalo en tu bio o al
        contactar marcas.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="flex-1" />
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={copyLink}>
            <Copy className="size-4" />
            Copiar
          </Button>
          <a href={`/p/${creatorId}`} target="_blank" rel="noreferrer">
            <Button type="button" variant="outline">
              <ExternalLink className="size-4" />
              Ver
            </Button>
          </a>
        </div>
      </div>
    </Card>
  );
}
