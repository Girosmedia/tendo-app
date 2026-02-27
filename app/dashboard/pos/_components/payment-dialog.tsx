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
import { CurrencyInput } from '@/components/ui/numeric-input';
import { Label } from '@/components/ui/label';
import {
  CreditCard,
  Banknote,
  Building2,
  Handshake,
  Layers,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  DollarSign,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { calculateDocumentTotals } from '@/lib/utils/document-totals';
import { roundCashPaymentAmount } from '@/lib/utils/cash-rounding';

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT' | 'MULTI';
type CardType = 'DEBIT' | 'CREDIT';

const paymentMethods = [
  { value: 'CASH' as const, label: 'Efectivo', icon: Banknote },
  { value: 'CARD' as const, label: 'Débito', icon: CreditCard, cardType: 'DEBIT' as CardType },
  { value: 'CARD' as const, label: 'Crédito', icon: CreditCard, cardType: 'CREDIT' as CardType },
  { value: 'TRANSFER' as const, label: 'Transferencia', icon: Building2 },
  { value: 'CREDIT' as const, label: 'Fiado', icon: Handshake },
  { value: 'MULTI' as const, label: 'Mixto', icon: Layers },
];

interface MultiPaymentItem {
  id: string;
  method: PaymentMethod;
  cardType?: CardType;
  amount: number;
}

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
  const [cardType, setCardType] = useState<CardType | ''>('');
  const [multiPayments, setMultiPayments] = useState<MultiPaymentItem[]>([]);
  const [currentMultiMethod, setCurrentMultiMethod] = useState<PaymentMethod | null>(null);
  const [currentMultiCardType, setCurrentMultiCardType] = useState<CardType | ''>('');
  const [currentMultiAmount, setCurrentMultiAmount] = useState('');

  const items = usePosStore((state) => state.items);
  const getTotals = usePosStore((state) => state.getTotals);
  
  const totals = getTotals();
  
  const requestedDiscountAmount = globalDiscountType === 'percent'
    ? Math.round((totals.total * globalDiscount) / 100)
    : globalDiscount;

  const totalsWithGlobalDiscount = calculateDocumentTotals(
    items.map((item) => ({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      taxRate: item.taxRate,
    })),
    requestedDiscountAmount
  );

  const discountAmount = Math.round(totalsWithGlobalDiscount.globalDiscountApplied);
  const subtotalWithGlobalDiscount = Math.round(totalsWithGlobalDiscount.subtotal);
  const taxAmountWithGlobalDiscount = Math.round(totalsWithGlobalDiscount.taxAmount);
  const exactFinalTotal = Math.max(0, Math.round(totalsWithGlobalDiscount.total));
  const roundedCashTotal = roundCashPaymentAmount(exactFinalTotal);
  const paymentTotal = selectedMethod === 'CASH' ? roundedCashTotal : exactFinalTotal;
  const cashRoundingAdjustment = roundedCashTotal - exactFinalTotal;

  const multiPaymentsTotal = multiPayments.reduce((sum, p) => sum + p.amount, 0);
  const multiPaymentsRemaining = Math.max(0, paymentTotal - multiPaymentsTotal);

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

  useEffect(() => {
    if (selectedMethod !== 'CARD') {
      setCardType('');
      return;
    }
  }, [selectedMethod]);

  // Calcular vuelto en tiempo real
  const cashChange = cashReceived
    ? Math.max(0, parseFloat(cashReceived) - paymentTotal)
    : 0;

  const canConfirm =
    selectedMethod &&
    (selectedMethod !== 'CASH' || parseFloat(cashReceived || '0') >= paymentTotal) &&
    (selectedMethod !== 'CREDIT' || (selectedCustomerId && !isCreditExceeded())) &&
    (selectedMethod !== 'CARD' || cardType) &&
    (selectedMethod !== 'MULTI' || (multiPaymentsTotal >= paymentTotal && multiPayments.length > 0));

  // Verificar si se excede el límite de crédito
  function isCreditExceeded() {
    if (selectedMethod !== 'CREDIT' || !selectedCustomerId) return false;
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return false;
    const availableCredit = customer.creditLimit - customer.currentDebt;
    return paymentTotal > availableCredit;
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
        cardType: selectedMethod === 'CARD' ? cardType : undefined,
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
        payments: selectedMethod === 'MULTI' ? multiPayments.map(p => ({
          paymentMethod: p.method,
          cardType: p.cardType,
          amount: p.amount,
        })) : undefined,
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
    setCardType('');
    setMultiPayments([]);
    setCurrentMultiMethod(null);
    setCurrentMultiCardType('');
    setCurrentMultiAmount('');
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
      setCardType('');
      setMultiPayments([]);
      setCurrentMultiMethod(null);
      setCurrentMultiCardType('');
      setCurrentMultiAmount('');
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
                ${paymentTotal.toLocaleString('es-CL')}
              </span>
            </div>

            {selectedMethod === 'CASH' && cashRoundingAdjustment !== 0 && (
              <div className="flex justify-between items-center p-3 rounded-lg border text-sm">
                <span className="text-muted-foreground">Ajuste redondeo efectivo:</span>
                <span className="font-medium">
                  {cashRoundingAdjustment > 0 ? '+' : ''}${cashRoundingAdjustment.toLocaleString('es-CL')}
                </span>
              </div>
            )}

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
            <Button 
              variant="success"
              size="lg"
              onClick={handleNewSale} 
              className="w-full"
            >
              Nueva Venta
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleClose}
              className="w-full"
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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
                <span className="font-medium">${subtotalWithGlobalDiscount.toLocaleString('es-CL')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA (19%):</span>
                <span className="font-medium">${taxAmountWithGlobalDiscount.toLocaleString('es-CL')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span className="font-medium">Descuento aplicado:</span>
                  <span className="font-medium">-${discountAmount.toLocaleString('es-CL')}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between items-center">
                <span className="text-lg font-semibold">Total a Pagar:</span>
                <span className="text-3xl font-bold text-success">
                  ${paymentTotal.toLocaleString('es-CL')}
                </span>
              </div>
              {selectedMethod === 'CASH' && cashRoundingAdjustment !== 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Ajuste redondeo efectivo:</span>
                  <span>{cashRoundingAdjustment > 0 ? '+' : ''}${cashRoundingAdjustment.toLocaleString('es-CL')}</span>
                </div>
              )}
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
            {requestedDiscountAmount > totals.total && (
              <p className="text-sm text-destructive">
                El descuento no puede superar el total de la venta
              </p>
            )}
          </div>

          {/* Método de pago */}
          <div className="space-y-2">
            <Label>Método de Pago</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {paymentMethods.map((method, idx) => {
                const Icon = method.icon;
                const isSelected = selectedMethod === method.value && (method.value !== 'CARD' || cardType === method.cardType);
                return (
                  <Button
                    key={`${method.value}-${idx}`}
                    variant={isSelected ? 'default' : 'outline'}
                    className={cn(
                      'h-20 flex-col gap-2',
                      isSelected && 'ring-2 ring-primary'
                    )}
                    onClick={() => {
                      setSelectedMethod(method.value);
                      if (method.value === 'CARD') {
                        setCardType(method.cardType as CardType);
                      } else {
                        setCardType('');
                      }
                    }}
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
              <CurrencyInput
                id="cashReceived"
                value={cashReceived ? parseFloat(cashReceived) : undefined}
                onChange={(value) => setCashReceived(value === undefined ? '' : value.toString())}
                className="h-14"
                autoFocus
                placeholder="$ 0"
              />
              {cashReceived && parseFloat(cashReceived) >= paymentTotal && (
                <div className="flex justify-between items-center p-3 bg-success/5 dark:bg-success/10 rounded-lg">
                  <span className="text-success">Vuelto:</span>
                  <span className="text-xl font-bold text-success">
                    ${Math.round(cashChange).toLocaleString('es-CL')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Pago Mixto */}
          {selectedMethod === 'MULTI' && (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Desglose de Pagos</h4>
                <div className="text-sm">
                  <span className="text-muted-foreground">Faltante: </span>
                  <span className={cn("font-bold", multiPaymentsRemaining > 0 ? "text-destructive" : "text-success")}>
                    ${multiPaymentsRemaining.toLocaleString('es-CL')}
                  </span>
                </div>
              </div>

              {/* Lista de pagos agregados */}
              {multiPayments.length > 0 && (
                <div className="space-y-2 mb-4">
                  {multiPayments.map((p) => (
                    <div key={p.id} className="flex justify-between items-center p-2 bg-background border rounded-md text-sm">
                      <div className="flex items-center gap-2">
                        {p.method === 'CASH' && <Banknote className="h-4 w-4 text-muted-foreground" />}
                        {p.method === 'CARD' && <CreditCard className="h-4 w-4 text-muted-foreground" />}
                        {p.method === 'TRANSFER' && <Building2 className="h-4 w-4 text-muted-foreground" />}
                        {p.method === 'CREDIT' && <Handshake className="h-4 w-4 text-muted-foreground" />}
                        <span>
                          {p.method === 'CASH' ? 'Efectivo' : 
                           p.method === 'CARD' ? (p.cardType === 'DEBIT' ? 'Débito' : 'Crédito') : 
                           p.method === 'TRANSFER' ? 'Transferencia' : 'Fiado'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">${p.amount.toLocaleString('es-CL')}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setMultiPayments(prev => prev.filter(item => item.id !== p.id))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulario para agregar pago */}
              {multiPaymentsRemaining > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-background p-3 rounded-md border">
                  <div className="md:col-span-5 space-y-1.5">
                    <Label className="text-xs">Método</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={currentMultiMethod === 'CARD' ? `${currentMultiMethod}-${currentMultiCardType}` : (currentMultiMethod || '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.startsWith('CARD-')) {
                          setCurrentMultiMethod('CARD');
                          setCurrentMultiCardType(val.split('-')[1] as CardType);
                        } else {
                          setCurrentMultiMethod(val as PaymentMethod);
                          setCurrentMultiCardType('');
                        }
                      }}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="CASH">Efectivo</option>
                      <option value="CARD-DEBIT">Débito</option>
                      <option value="CARD-CREDIT">Crédito</option>
                      <option value="TRANSFER">Transferencia</option>
                      <option value="CREDIT">Fiado</option>
                    </select>
                  </div>
                  <div className="md:col-span-5 space-y-1.5">
                    <Label className="text-xs">Monto</Label>
                    <CurrencyInput
                      value={currentMultiAmount ? parseFloat(currentMultiAmount) : undefined}
                      onChange={(value) => setCurrentMultiAmount(value === undefined ? '' : value.toString())}
                      className="h-10"
                      placeholder={`$ ${multiPaymentsRemaining.toLocaleString('es-CL')}`}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button 
                      type="button"
                      className="w-full h-10" 
                      disabled={!currentMultiMethod || !currentMultiAmount || parseFloat(currentMultiAmount) <= 0}
                      onClick={() => {
                        if (currentMultiMethod && currentMultiAmount) {
                          const amount = parseFloat(currentMultiAmount);
                          setMultiPayments(prev => [...prev, {
                            id: Math.random().toString(36).substring(7),
                            method: currentMultiMethod,
                            cardType: currentMultiMethod === 'CARD' ? currentMultiCardType || undefined : undefined,
                            amount
                          }]);
                          setCurrentMultiMethod(null);
                          setCurrentMultiCardType('');
                          setCurrentMultiAmount('');
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
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
                      (selectedCustomer.creditLimit - selectedCustomer.currentDebt) >= paymentTotal 
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
            variant="success"
            size="lg"
            onClick={handleConfirm}
            disabled={!canConfirm || isSubmitting}
            className="min-w-45"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <DollarSign className="mr-2 h-5 w-5" strokeWidth={2} />
                Confirmar Venta
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
