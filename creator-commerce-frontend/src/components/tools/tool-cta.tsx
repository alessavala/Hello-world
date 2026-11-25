import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ToolCta({ title, description, href, ctaLabel }: { title: string; description: string; href: string; ctaLabel: string }) {
  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-6">
      <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted">{description}</p>
      <Link href={href} className="mt-4 inline-block">
        <Button>
          {ctaLabel}
          <ArrowRight />
        </Button>
      </Link>
    </Card>
  );
}
