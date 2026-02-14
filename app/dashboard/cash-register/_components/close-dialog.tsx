'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { closeCashRegisterSchema, type CloseCashRegisterInput } from '@/lib/validators/cash-register';
import { Loader2, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface CashRegister {
  id: string;
  openingCash: number;
  expectedCash: number;
  openedAt: string;
  totalCashSales?: number;
  totalCardSales?: number;
  totalTransferSales?: number;
  totalMultiSales?: number;
  totalSales: number;
}

interface CloseDialogProps {
  cashRegister: CashRegister | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount);
};

export function CloseDialog({ cashRegister, open, onOpenChange, onSuccess }: CloseDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [difference, setDifference] = useState(0);

  const form = useForm<CloseCashRegisterInput>({
    resolver: zodResolver(closeCashRegisterSchema),
    defaultValues: {
      actualCash: 0,
      notes: '',
    },
  });

  const actualCashValue = form.watch('actualCash');

  useEffect(() => {
    if (cashRegister) {
      const diff = (actualCashValue || 0) - cashRegister.expectedCash;
      setDifference(diff);
    }
  }, [actualCashValue, cashRegister]);

  async function onSubmit(data: CloseCashRegisterInput) {
    if (!cashRegister) return;

    // Confirmar si hay diferencia significativa
    const absDifference = Math.abs(difference);
    if (absDifference > 5000) {
      const confirmed = window.confirm(
        `Hay una diferencia de ${formatCurrency(absDifference)} ${
          difference > 0 ? '(sobrante)' : '(faltante)'
        }. ¿Estás seguro de cerrar la caja?`
      );
      if (!confirmed) return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/cash-register/${cashRegister.id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al cerrar caja');
      }

      toast.success('Caja cerrada exitosamente');
      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al cerrar caja');
    } finally {
      setIsLoading(false);
    }
  }

  if (!cashRegister) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Cerrar Caja - Arqueo de Efectivo</DialogTitle>
          <DialogDescription>
            Al cerrar la caja, debes contar <strong>solo el efectivo físico</strong> (billetes y monedas). 
            Los vouchers de tarjeta y comprobantes de transferencia se verifican contra los registros del banco.
          </DialogDescription>
        </DialogHeader>

        {/* Resumen Completo de la Caja */}
        <div className="space-y-4">
          {/* Arqueo de Efectivo */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                💵 Arqueo de Efectivo
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fondo Inicial:</span>
                  <span className="font-medium">{formatCurrency(cashRegister.openingCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">+ Ventas en Efectivo:</span>
                  <span className="font-medium">
                    {formatCurrency((cashRegister.totalCashSales || 0))}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>= Efectivo Esperado:</span>
                  <span className="text-primary">{formatCurrency(cashRegister.expectedCash)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Otros Métodos de Pago (Solo Informativo) */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                📊 Otros Métodos de Pago (Solo Información)
              </h3>
              <div className="space-y-2 text-sm">
                {(cashRegister.totalCardSales || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">💳 Tarjetas (vouchers):</span>
                    <span className="font-medium">{formatCurrency(cashRegister.totalCardSales || 0)}</span>
                  </div>
                )}
                {(cashRegister.totalTransferSales || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">🏦 Transferencias:</span>
                    <span className="font-medium">{formatCurrency(cashRegister.totalTransferSales || 0)}</span>
                  </div>
                )}
                {(cashRegister.totalMultiSales || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">🔀 Pagos Mixtos:</span>
                    <span className="font-medium">{formatCurrency(cashRegister.totalMultiSales || 0)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total General:</span>
                  <span>{formatCurrency(cashRegister.totalSales)}</span>
                </div>
              </div>
              <Alert className="mt-3">
                <AlertDescription className="text-xs">
                  ℹ️ Estos montos no se arquean físicamente. Verifica que los vouchers de tarjeta y comprobantes de transferencia coincidan con estos totales.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="actualCash"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">
                    💵 Efectivo Real Contado (solo billetes y monedas)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      step="100"
                      autoFocus
                      className="text-lg"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cuenta solo el efectivo físico. NO incluyas vouchers ni comprobantes.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mostrar diferencia calculada */}
            {actualCashValue > 0 && (
              <div className="p-4 rounded-lg bg-muted">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Diferencia:</span>
                  <div className="flex items-center gap-2">
                    {difference > 0 ? (
                      <>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <Badge variant="default" className="bg-green-600">
                          + {formatCurrency(difference)}
                        </Badge>
                      </>
                    ) : difference < 0 ? (
                      <>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        <Badge variant="destructive">
                          {formatCurrency(difference)}
                        </Badge>
                      </>
                    ) : (
                      <Badge variant="secondary">Sin diferencia</Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Alerta si diferencia es significativa */}
            {Math.abs(difference) > 5000 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Hay una diferencia significativa de {formatCurrency(Math.abs(difference))}.
                  Por favor verifica el conteo y agrega una nota explicativa.
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas {Math.abs(difference) > 5000 && '(Requerido)'}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observaciones del cierre, justificación de diferencias..."
                      className="resize-none"
                      rows={3}
                      maxLength={500}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cerrar Caja
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
