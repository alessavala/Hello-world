import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-accent text-accent-foreground hover:brightness-95 disabled:opacity-50",
  secondary: "bg-surface text-foreground border border-border hover:bg-brand-pill/60 disabled:opacity-50",
  danger: "bg-rose-100 text-rose-700 hover:bg-rose-200 disabled:opacity-50",
  ghost: "text-foreground hover:bg-brand-pill/60 disabled:opacity-50",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", className = "", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
});
