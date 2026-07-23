import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <ol className={cn("flex items-center", className)}>
      {steps.map((step, i) => {
        const isComplete = i < currentStep;
        const isCurrent = i === currentStep;
        return (
          <li key={step} className={cn("flex items-center", i !== steps.length - 1 && "flex-1")}>
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  isComplete && "border-primary bg-primary text-primary-foreground",
                  isCurrent && !isComplete && "border-primary text-primary",
                  !isComplete && !isCurrent && "border-border text-muted",
                )}
              >
                {isComplete ? <Check className="size-4" /> : i + 1}
              </span>
              <span className={cn("whitespace-nowrap text-xs font-medium", isCurrent ? "text-foreground" : "text-muted")}>{step}</span>
            </div>
            {i !== steps.length - 1 && (
              <div className={cn("mx-2 mb-5 h-px flex-1 transition-colors", isComplete ? "bg-primary" : "bg-border")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
