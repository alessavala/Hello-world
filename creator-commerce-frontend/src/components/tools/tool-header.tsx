import type { LucideIcon } from "lucide-react";

export function ToolHeader({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 text-primary">
        <Icon className="size-6" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      <p className="max-w-xl text-sm text-muted">{description}</p>
    </div>
  );
}
