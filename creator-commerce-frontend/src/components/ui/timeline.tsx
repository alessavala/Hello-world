import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp?: string;
  icon?: LucideIcon;
  status?: "complete" | "current" | "upcoming";
}

export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cn("flex flex-col", className)}>
      {items.map((item, i) => {
        const Icon = item.icon;
        const isLast = i === items.length - 1;
        return (
          <li key={item.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2",
                  item.status === "complete" && "border-primary bg-primary/10 text-primary",
                  item.status === "current" && "border-primary bg-primary text-primary-foreground",
                  (item.status === "upcoming" || !item.status) && "border-border bg-muted-surface text-muted",
                )}
              >
                {Icon && <Icon className="size-4" />}
              </span>
              {!isLast && <div className="w-px flex-1 bg-border" />}
            </div>
            <div className={cn("flex-1 pb-8", isLast && "pb-0")}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                {item.timestamp && <span className="text-xs text-muted">{item.timestamp}</span>}
              </div>
              {item.description && <p className="mt-0.5 text-sm text-muted">{item.description}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
