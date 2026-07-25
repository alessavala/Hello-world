import type { UseFormRegisterReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface NumberFieldProps {
  label: string;
  suffix?: string;
  error?: string;
  registration: UseFormRegisterReturn;
  placeholder?: string;
}

export function NumberField({ label, suffix, error, registration, placeholder }: NumberFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={registration.name}>
        {label}
        {suffix && <span className="text-muted"> ({suffix})</span>}
      </Label>
      <Input id={registration.name} type="number" step="any" inputMode="decimal" placeholder={placeholder} {...registration} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
