import { ButtonHTMLAttributes } from "react";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: React.ReactNode;
}

export function Chip({ active = false, icon, className = "", children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
        active
          ? "border-accent bg-accent/15 text-accent-foreground"
          : "border-border bg-surface text-foreground hover:bg-brand-pill/50"
      } ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
