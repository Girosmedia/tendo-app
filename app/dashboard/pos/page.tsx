'use client';

import { ProductSearch } from './_components/product-search';
import { ShoppingCart } from './_components/shopping-cart';
import { TotalsPanel } from './_components/totals-panel';
import { PaymentDialog } from './_components/payment-dialog';
import { usePosStore } from '@/hooks/use-pos';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Calculator } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function POSPage() {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [hasActiveCashRegister, setHasActiveCashRegister] = useState<boolean | null>(null);
  const [isCheckingCashRegister, setIsCheckingCashRegister] = useState(true);
  const items = usePosStore(state => state.items);
  const clearCart = usePosStore(state => state.clearCart);
  const incrementRefreshKey = usePosStore(state => state.incrementRefreshKey);
  
  // Verificar caja abierta al cargar
  useEffect(() => {
    checkActiveCashRegister();
  }, []);

  // Re-verificar caja cuando la ventana vuelve a tener foco
  useEffect(() => {
    const handleFocus = () => {
      checkActiveCashRegister();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  async function checkActiveCashRegister() {
    try {
      const res = await fetch('/api/cash-register/active');
      if (res.ok) {
        const data = await res.json();
        setHasActiveCashRegister(data.hasActiveCashRegister);
      } else {
        setHasActiveCashRegister(false);
      }
    } catch (error) {
      console.error('Error verificando caja:', error);
      setHasActiveCashRegister(false);
    } finally {
      setIsCheckingCashRegister(false);
    }
  }
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2 - Abrir diálogo de pago
      if (e.key === 'F2' && items.length > 0 && hasActiveCashRegister) {
        e.preventDefault();
        setIsPaymentOpen(true);
      }
      
      // F3 - Focus en búsqueda
      if (e.key === 'F3') {
        e.preventDefault();
        const searchInput = document.getElementById('product-search-input');
        searchInput?.focus();
      }
      
      // Escape - Cerrar diálogos
      if (e.key === 'Escape') {
        setIsPaymentOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items.length, hasActiveCashRegister]);
  
  const handlePaymentSuccess = () => {
    setIsPaymentOpen(false);
    clearCart();
    incrementRefreshKey();
  };

  const handleCheckout = () => {
    if (!hasActiveCashRegister) {
      toast.error('Debes abrir una caja registradora antes de procesar ventas');
      return;
    }
    setIsPaymentOpen(true);
  };
  
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <h1 className="text-2xl font-bold">Punto de Venta</h1>
        <p className="text-sm text-muted-foreground">
          F2: Cobrar • F3: Buscar • Esc: Cancelar
        </p>
      </div>

      {/* Alerta si no hay caja abierta */}
      {!isCheckingCashRegister && hasActiveCashRegister === false && (
        <Alert variant="destructive" className="m-4 mb-0">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              <strong>No tienes una caja abierta.</strong> Debes abrir una caja registradora antes de procesar ventas.
            </span>
            <Button asChild variant="outline" size="sm" className="ml-4">
              <Link href="/dashboard/cash-register">
                <Calculator className="mr-2 h-4 w-4" />
                Abrir Caja
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
          {/* Left Column: Product Search */}
          <div className="flex flex-col gap-4 overflow-hidden">
            <ProductSearch />
          </div>
          
          {/* Right Column: Cart & Totals */}
          <div className="flex flex-col gap-4 overflow-hidden">
            <ShoppingCart />
            <TotalsPanel 
              onCheckout={handleCheckout}
              disabled={!hasActiveCashRegister || isCheckingCashRegister}
            />
          </div>
        </div>
      </div>
      
      {/* Payment Dialog */}
      <PaymentDialog 
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
