import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "./card";

const TONE_CLASSES = {
  primary: "bg-primary/10 text-primary",
  pink: "bg-chart-5/10 text-chart-5",
  indigo: "bg-chart-4/10 text-chart-4",
  amber: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
} as const;

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: keyof typeof TONE_CLASSES;
  trend?: { value: string; direction: "up" | "down" };
  className?: string;
}

export function StatCard({ label, value, icon: Icon, tone = "primary", trend, className }: StatCardProps) {
  return (
    <Card className={cn("flex flex-col gap-3 overflow-hidden p-5", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted">{label}</span>
        {Icon && (
          <span className={cn("flex size-9 items-center justify-center rounded-xl", TONE_CLASSES[tone])}>
            <Icon className="size-5" />
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-semibold tracking-tight text-foreground">{value}</span>
        {trend && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-semibold",
              trend.direction === "up" ? "text-success" : "text-destructive",
            )}
          >
            {trend.direction === "up" ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {trend.value}
          </span>
        )}
      </div>
    </Card>
  );
}
