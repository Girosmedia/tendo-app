'use client';

import { usePosStore } from '@/hooks/use-pos';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign } from 'lucide-react';

interface TotalsPanelProps {
  onCheckout: () => void;
  disabled?: boolean;
}

export function TotalsPanel({ onCheckout, disabled = false }: TotalsPanelProps) {
  const items = usePosStore((state) => state.items);
  const getTotals = usePosStore((state) => state.getTotals);
  
  const totals = getTotals();
  const isEmpty = items.length === 0;
  const isDisabled = isEmpty || disabled;
  
  // Calcular total de descuentos en items
  const totalItemDiscounts = items.reduce((sum, item) => sum + item.discount, 0);

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal:</span>
          <span className="font-medium">
            ${totals.subtotal.toLocaleString('es-CL')}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">IVA (19%):</span>
          <span className="font-medium">
            ${totals.taxAmount.toLocaleString('es-CL')}
          </span>
        </div>

        {totalItemDiscounts > 0 && (
          <div className="flex justify-between text-sm text-success">
            <span className="font-medium">Descuentos:</span>
            <span className="font-medium">
              -${totalItemDiscounts.toLocaleString('es-CL')}
            </span>
          </div>
        )}

        <div className="border-t pt-3">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total:</span>
            <span className="text-3xl font-bold text-primary">
              ${totals.total.toLocaleString('es-CL')}
            </span>
          </div>
          <p className="text-xs text-muted-foreground text-right mt-1">
            {totals.itemCount} {totals.itemCount === 1 ? 'artículo' : 'artículos'}
          </p>
        </div>

        <Button
          className="w-full h-14 text-lg font-semibold"
          disabled={isDisabled}
          onClick={onCheckout}
        >
          <DollarSign className="mr-2 h-5 w-5" />
          {disabled && !isEmpty ? 'Abre una caja para cobrar' : 'Cobrar (F2)'}
        </Button>

        {!isEmpty && !disabled && (
          <p className="text-xs text-center text-muted-foreground">
            Presiona F2 para continuar
          </p>
        )}
      </div>
    </Card>
  );
}
