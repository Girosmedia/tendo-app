'use client';

import { useState, useEffect } from 'react';
import { CartItem } from '@/hooks/use-pos';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Percent, DollarSign, AlertCircle } from 'lucide-react';

interface ItemDiscountDialogProps {
  item: CartItem | null;
  open: boolean;
  onClose: () => void;
  onApply: (discount: number, discountPercent: number) => void;
}

export function ItemDiscountDialog({
  item,
  open,
  onClose,
  onApply,
}: ItemDiscountDialogProps) {
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('percent');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [error, setError] = useState('');

  // Resetear valores cuando abre el dialog
  useEffect(() => {
    if (open && item) {
      setDiscountAmount(item.discount);
      setDiscountPercent(item.discountPercent);
      setError('');
    }
  }, [open, item]);

  if (!item) return null;

  const itemTotal = item.quantity * item.unitPrice;
  const maxDiscount = itemTotal;

  // Sincronizar valores según el tipo activo
  const handleAmountChange = (value: number) => {
    setDiscountAmount(value);
    // Calcular el porcentaje equivalente
    const percent = itemTotal > 0 ? (value / itemTotal) * 100 : 0;
    setDiscountPercent(Math.round(percent * 100) / 100); // Redondear a 2 decimales
    validateDiscount(value);
  };

  const handlePercentChange = (value: number) => {
    setDiscountPercent(value);
    // Calcular el monto equivalente
    const amount = (itemTotal * value) / 100;
    setDiscountAmount(Math.round(amount));
    validateDiscount(amount);
  };

  const validateDiscount = (amount: number) => {
    if (amount > maxDiscount) {
      setError(`El descuento no puede superar $${maxDiscount.toLocaleString('es-CL')}`);
    } else if (amount < 0) {
      setError('El descuento debe ser mayor o igual a 0');
    } else {
      setError('');
    }
  };

  const handleApply = () => {
    if (error) return;
    
    // Validación adicional de permisos (por ahora solo validamos lógica)
    if (discountPercent > 15) {
      const confirmed = window.confirm(
        `¿Estás seguro de aplicar un descuento del ${discountPercent}%? Esto es un descuento alto.`
      );
      if (!confirmed) return;
    }

    onApply(discountAmount, discountPercent);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !error) {
      handleApply();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const originalPrice = itemTotal;
  const priceWithDiscount = originalPrice - discountAmount;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>Aplicar Descuento</DialogTitle>
          <DialogDescription>
            {item.name} - Cantidad: {item.quantity}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview de precios */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Precio original:</span>
              <span className={`text-lg font-medium ${discountAmount > 0 ? 'line-through text-muted-foreground' : ''}`}>
                ${originalPrice.toLocaleString('es-CL')}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Con descuento:</span>
                <span className="text-2xl font-bold text-green-600">
                  ${priceWithDiscount.toLocaleString('es-CL')}
                </span>
              </div>
            )}
          </div>

          {/* Tabs para tipo de descuento */}
          <Tabs value={discountType} onValueChange={(v) => setDiscountType(v as 'amount' | 'percent')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="amount">
                <DollarSign className="h-4 w-4 mr-2" />
                Monto
              </TabsTrigger>
              <TabsTrigger value="percent">
                <Percent className="h-4 w-4 mr-2" />
                Porcentaje
              </TabsTrigger>
            </TabsList>

            <TabsContent value="amount" className="space-y-3">
              <div>
                <Label htmlFor="discount-amount">Descuento en pesos ($)</Label>
                <Input
                  id="discount-amount"
                  type="number"
                  min="0"
                  max={maxDiscount}
                  step="100"
                  value={discountAmount}
                  onChange={(e) => handleAmountChange(Number(e.target.value))}
                  className="text-lg h-12 mt-1"
                  autoFocus
                />
              </div>
            </TabsContent>

            <TabsContent value="percent" className="space-y-3">
              <div>
                <Label htmlFor="discount-percent">Descuento en porcentaje (%)</Label>
                <Input
                  id="discount-percent"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={discountPercent}
                  onChange={(e) => handlePercentChange(Number(e.target.value))}
                  className="text-lg h-12 mt-1"
                  autoFocus
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Mensaje de error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Atajos rápidos */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handlePercentChange(5)}
            >
              5%
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handlePercentChange(10)}
            >
              10%
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handlePercentChange(15)}
            >
              15%
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handlePercentChange(20)}
            >
              20%
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleApply} disabled={!!error || discountAmount === 0}>
            Aplicar Descuento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
