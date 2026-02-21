'use client';

import { useState } from 'react';
import { usePosStore } from '@/hooks/use-pos';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TotalsPanelProps {
  onCheckout: () => void;
  disabled?: boolean;
}

export function TotalsPanel({ onCheckout, disabled = false }: TotalsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const items = usePosStore((state) => state.items);
  const getTotals = usePosStore((state) => state.getTotals);

  const totals = getTotals();
  const isEmpty = items.length === 0;
  const isDisabled = isEmpty || disabled;
  const totalItemDiscounts = items.reduce((sum, item) => sum + item.discount, 0);

  return (
    <div className="border-t bg-background shadow-[0_-4px_16px_-2px_hsl(var(--foreground)/0.06)]">
      {/* Desglose expandible — desliza hacia arriba */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isExpanded ? 'max-h-40' : 'max-h-0',
        )}
      >
        <div className="px-4 pt-3 pb-1 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal (sin IVA):</span>
            <span className="font-medium tabular-nums">
              ${totals.subtotal.toLocaleString('es-CL')}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">IVA (19%):</span>
            <span className="font-medium tabular-nums">
              ${totals.taxAmount.toLocaleString('es-CL')}
            </span>
          </div>
          {totalItemDiscounts > 0 && (
            <div className="flex justify-between text-sm text-success">
              <span className="font-medium">Descuentos aplicados:</span>
              <span className="font-medium tabular-nums">
                −${totalItemDiscounts.toLocaleString('es-CL')}
              </span>
            </div>
          )}
          <div className="border-t border-dashed" />
        </div>
      </div>

      {/* Barra siempre visible */}
      <div className="flex items-center gap-2 px-3 py-3">
        {/* Área clicable para expandir/colapsar */}
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className={cn(
            'flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 transition-colors',
            'hover:bg-muted/60 active:bg-muted',
            isEmpty && 'pointer-events-none opacity-50',
          )}
          disabled={isEmpty}
          title={isExpanded ? 'Ocultar desglose' : 'Ver desglose (IVA, subtotal)'}
        >
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="text-xs font-medium tabular-nums">
              {totals.itemCount} {totals.itemCount === 1 ? 'art.' : 'arts.'}
            </span>
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5 transition-transform duration-200" />
            )}
          </div>

          <div className="ml-auto flex items-baseline gap-1">
            <span className="text-xs text-muted-foreground font-medium">Total</span>
            <span
              className={cn(
                'text-2xl font-bold tabular-nums leading-none transition-colors',
                isEmpty ? 'text-muted-foreground' : 'text-success',
              )}
            >
              ${totals.total.toLocaleString('es-CL')}
            </span>
          </div>
        </button>

        {/* Botón cobrar */}
        <Button
          variant="success"
          size="lg"
          className="shrink-0 gap-1.5 font-semibold"
          disabled={isDisabled}
          onClick={onCheckout}
        >
          {disabled && !isEmpty ? (
            'Sin caja abierta'
          ) : (
            <>
              Cobrar
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
