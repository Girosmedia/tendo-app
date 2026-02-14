'use client';

import { useState, useEffect } from 'react';
import { usePosStore } from '@/hooks/use-pos';
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
import {
  CreditCard,
  Banknote,
  Building2,
  FileText,
  Handshake,
  Layers,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'CHECK' | 'CREDIT' | 'MULTI';

const paymentMethods = [
  { value: 'CASH' as const, label: 'Efectivo', icon: Banknote },
  { value: 'CARD' as const, label: 'Tarjeta', icon: CreditCard },
  { value: 'TRANSFER' as const, label: 'Transferencia', icon: Building2 },
  { value: 'CHECK' as const, label: 'Cheque', icon: FileText },
  { value: 'CREDIT' as const, label: 'Crédito', icon: Handshake },
  { value: 'MULTI' as const, label: 'Mixto', icon: Layers },
];

interface Customer {
  id: string;
  name: string;
  rut: string;
  creditLimit: number;
  currentDebt: number;
}

export function PaymentDialog({ isOpen, onClose, onSuccess }: PaymentDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [cashReceived, setCashReceived] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [saleNumber, setSaleNumber] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [globalDiscountType, setGlobalDiscountType] = useState<'amount' | 'percent'>('percent');

  const items = usePosStore((state) => state.items);
  const getTotals = usePosStore((state) => state.getTotals);
  
  const totals = getTotals();
  
  // Calcular descuento global en monto
  const discountAmount = globalDiscountType === 'percent' 
    ? Math.round((totals.total * globalDiscount) / 100)
    : globalDiscount;
  
  // Total final con descuento global aplicado
  const finalTotal = Math.max(0, totals.total - discountAmount);

  // Fetch customers cuando se abre el diálogo
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchCustomers = async () => {
      try {
        setIsLoadingCustomers(true);
        const res = await fetch('/api/customers?limit=100');
        if (!res.ok) throw new Error('Error al cargar clientes');
        const { customers: data } = await res.json();
        setCustomers(data || []);
      } catch (error) {
        console.error('Error loading customers:', error);
        toast.error('Error al cargar clientes');
      } finally {
        setIsLoadingCustomers(false);
      }
    };
    
    fetchCustomers();
  }, [isOpen]);

  // Calcular vuelto en tiempo real
  const cashChange = cashReceived
    ? Math.max(0, parseFloat(cashReceived) - finalTotal)
    : 0;

  const canConfirm =
    selectedMethod &&
    (selectedMethod !== 'CASH' || parseFloat(cashReceived || '0') >= finalTotal) &&
    (selectedMethod !== 'CREDIT' || (selectedCustomerId && !isCreditExceeded()));

  // Verificar si se excede el límite de crédito
  function isCreditExceeded() {
    if (selectedMethod !== 'CREDIT' || !selectedCustomerId) return false;
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return false;
    const availableCredit = customer.creditLimit - customer.currentDebt;
    return finalTotal > availableCredit;
  }

  // Obtener cliente seleccionado
  const selectedCustomer = selectedCustomerId 
    ? customers.find(c => c.id === selectedCustomerId) 
    : null;

  // Crear la venta
  const handleConfirm = async () => {
    if (!canConfirm) return;
    
    try {
      setIsSubmitting(true);
      
      const payload = {
        type: 'SALE',
        status: 'PAID',
        paymentMethod: selectedMethod,
        customerId: selectedCustomerId || undefined,
        cashReceived: selectedMethod === 'CASH' ? parseFloat(cashReceived) : undefined,
        discount: discountAmount, // Descuento global sobre el total
        items: items.map((item) => ({
          productId: item.productId,
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          discountPercent: item.discountPercent,
          taxRate: item.taxRate,
        })),
      };

      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        
        // Manejo especial para error de caja no abierta
        if (error.code === 'NO_ACTIVE_CASH_REGISTER') {
          toast.error(error.error || 'Debes abrir una caja registradora', {
            description: 'Ve a Cierre de Caja para abrir una caja',
            duration: 5000,
          });
          onClose();
          return;
        }
        
        // Manejo especial para límite de crédito excedido
        if (error.code === 'CREDIT_LIMIT_EXCEEDED' && error.details) {
          toast.error('Límite de crédito excedido', {
            description: `Crédito disponible: $${error.details.availableCredit.toLocaleString('es-CL')}. Total de venta: $${error.details.saleTotal.toLocaleString('es-CL')}`,
            duration: 6000,
          });
          return;
        }
        
        throw new Error(error.error || 'Error al procesar la venta');
      }

      const data = await res.json();
      setSaleNumber(data.docNumber);
      setShowSuccess(true);
      toast.success('Venta registrada exitosamente');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al procesar la venta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewSale = () => {
    setSelectedMethod(null);
    setCashReceived('');
    setSelectedCustomerId('');
    setGlobalDiscount(0);
    setGlobalDiscountType('percent');
    setShowSuccess(false);
    setSaleNumber(null);
    onSuccess();
  };

  const handleClose = () => {
    if (showSuccess) {
      // Resetear estado local pero mantener el diálogo cerrado
      setSelectedMethod(null);
      setCashReceived('');
      setSelectedCustomerId('');
      setGlobalDiscount(0);
      setGlobalDiscountType('percent');
      setShowSuccess(false);
      setSaleNumber(null);
      // Llamar a onSuccess para limpiar carrito y refrescar productos
      onSuccess();
    } else {
      onClose();
    }
  };

  // Vista de éxito
  if (showSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4">
              <CheckCircle2 className="h-16 w-16 text-success" />
            </div>
            <DialogTitle className="text-center text-2xl">
              ¡Venta Completada!
            </DialogTitle>
            <DialogDescription className="text-center">
              Venta #{saleNumber} registrada exitosamente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
              <span className="text-muted-foreground">Total:</span>
              <span className="text-3xl font-bold">
                ${finalTotal.toLocaleString('es-CL')}
              </span>
            </div>

            {selectedMethod === 'CASH' && cashChange > 0 && (
              <div className="flex justify-between items-center p-4 bg-success/5 dark:bg-success/10 rounded-lg border border-success/20 dark:border-success/30">
                <span className="text-success font-medium">
                  Vuelto:
                </span>
                <span className="text-2xl font-bold text-success">
                  ${Math.round(cashChange).toLocaleString('es-CL')}
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="sm:flex-col gap-2">
            <Button onClick={handleNewSale} className="w-full h-12 text-base">
              Nueva Venta
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              className="w-full h-12 text-base"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Vista de pago
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Procesar Pago</DialogTitle>
          <DialogDescription>
            Selecciona el método de pago y confirma la venta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Resumen de Total */}
          <div className="space-y-3">
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">${totals.subtotal.toLocaleString('es-CL')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA (19%):</span>
                <span className="font-medium">${totals.taxAmount.toLocaleString('es-CL')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span className="font-medium">Descuento aplicado:</span>
                  <span className="font-medium">-${discountAmount.toLocaleString('es-CL')}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between items-center">
                <span className="text-lg font-semibold">Total a Pagar:</span>
                <span className="text-3xl font-bold text-primary">
                  ${finalTotal.toLocaleString('es-CL')}
                </span>
              </div>
            </div>
          </div>

          {/* Descuento Global (Opcional) */}
          <div className="space-y-2">
            <Label>Descuento sobre el Total (Opcional)</Label>
            <div className="flex gap-2">
              <div className="flex-1 flex gap-2">
                <Input
                  type="number"
                  min="0"
                  max={globalDiscountType === 'percent' ? 100 : totals.total}
                  step={globalDiscountType === 'percent' ? 1 : 100}
                  value={globalDiscount}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setGlobalDiscount(value);
                  }}
                  placeholder="0"
                  className="text-lg h-12"
                />
                <Button
                  variant={globalDiscountType === 'amount' ? 'default' : 'outline'}
                  onClick={() => setGlobalDiscountType('amount')}
                  className="h-12 w-20"
                >
                  $
                </Button>
                <Button
                  variant={globalDiscountType === 'percent' ? 'default' : 'outline'}
                  onClick={() => setGlobalDiscountType('percent')}
                  className="h-12 w-20"
                >
                  %
                </Button>
              </div>
            </div>
            {discountAmount > totals.total && (
              <p className="text-sm text-destructive">
                El descuento no puede superar el total de la venta
              </p>
            )}
          </div>

          {/* Método de pago */}
          <div className="space-y-2">
            <Label>Método de Pago</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <Button
                    key={method.value}
                    variant={selectedMethod === method.value ? 'default' : 'outline'}
                    className={cn(
                      'h-20 flex-col gap-2',
                      selectedMethod === method.value && 'ring-2 ring-primary'
                    )}
                    onClick={() => setSelectedMethod(method.value)}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-sm">{method.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Efectivo recibido */}
          {selectedMethod === 'CASH' && (
            <div className="space-y-2">
              <Label htmlFor="cashReceived">Efectivo Recibido</Label>
              <Input
                id="cashReceived"
                type="number"
                placeholder="0"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className="h-14 text-2xl text-right"
                autoFocus
              />
              {cashReceived && parseFloat(cashReceived) >= totals.total && (
                <div className="flex justify-between items-center p-3 bg-success/5 dark:bg-success/10 rounded-lg">
                  <span className="text-success">Vuelto:</span>
                  <span className="text-xl font-bold text-success">
                    ${Math.round(cashChange).toLocaleString('es-CL')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Cliente (requerido para crédito) */}
          {(selectedMethod === 'CREDIT' || selectedMethod) && (
            <div className="space-y-2">
              <Label htmlFor="customer">
                Cliente {selectedMethod === 'CREDIT' && '(Requerido)'}
              </Label>
              <select
                id="customer"
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                disabled={isLoadingCustomers}
              >
                <option value="">Sin cliente</option>
                {customers?.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.rut}
                  </option>
                ))}
              </select>

              {/* Mostrar información de crédito si el método es CREDIT */}
              {selectedMethod === 'CREDIT' && selectedCustomer && (
                <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Límite de crédito:</span>
                    <span className="font-medium">
                      ${selectedCustomer.creditLimit.toLocaleString('es-CL')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Deuda actual:</span>
                    <span className={cn(
                      "font-medium",
                      selectedCustomer.currentDebt > 0 && "text-warning"
                    )}>
                      ${selectedCustomer.currentDebt.toLocaleString('es-CL')}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between items-center">
                    <span className="font-semibold">Crédito disponible:</span>
                    <span className={cn(
                      "text-lg font-bold",
                      (selectedCustomer.creditLimit - selectedCustomer.currentDebt) >= finalTotal 
                        ? "text-success" 
                        : "text-destructive"
                    )}>
                      ${(selectedCustomer.creditLimit - selectedCustomer.currentDebt).toLocaleString('es-CL')}
                    </span>
                  </div>
                  {isCreditExceeded() && (
                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
                      <AlertTriangle className="h-4 w-4" />
                      <span>El total excede el crédito disponible del cliente</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar (Esc)
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || isSubmitting}
            className="min-w-[150px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              'Confirmar Venta'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
