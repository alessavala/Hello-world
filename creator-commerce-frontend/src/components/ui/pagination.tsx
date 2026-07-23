import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(Math.max(1, page - 1))}>
        <ChevronLeft />
        Anterior
      </Button>
      <span className="text-sm text-muted">
        Página {page} de {totalPages}
      </span>
      <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onChange(Math.min(totalPages, page + 1))}>
        Siguiente
        <ChevronRight />
      </Button>
    </div>
  );
}
