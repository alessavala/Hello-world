import { SelectHTMLAttributes, forwardRef } from "react";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className = "", children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={`w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});
