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

      // F4 - Limpiar carrito
      if (e.key === 'F4' && items.length > 0) {
        e.preventDefault();
        const confirmed = window.confirm('¿Deseas limpiar todo el carrito? Esta acción no se puede deshacer.');
        if (confirmed) {
          clearCart();
          toast.success('Carrito limpiado');
        }
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
  }, [items.length, hasActiveCashRegister, clearCart]);
  
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
    // Tab bar mobile → md:hidden (visible solo < 768px)
    //
    // < md  : cancelamos px + pt pero NO pb → el pb-20 del layout protege el contenido
    //         de la tab bar. La página scrollea normalmente en 1 columna.
    //
    // >= md : tab bar oculta → cancelamos todo el padding del layout padre.
    //         Tomamos h-[calc(100dvh-3.5rem)] y overflow-hidden → layout fijo,
    //         sin scroll de página, TotalsPanel siempre visible al fondo.
    <div className="-mx-3 -mt-3 flex flex-col md:-mx-8 md:-mt-8 md:-mb-8 md:h-[calc(100dvh-3.5rem)] md:overflow-hidden">
      {/* Header — altura fija */}
      <div className="shrink-0 border-b bg-background px-4 py-3">
        <h1 className="text-xl font-bold">Punto de Venta</h1>
        <p className="text-xs text-muted-foreground">
          F2: Cobrar · F3: Buscar · F4: Limpiar carrito · Esc: Cancelar
        </p>
      </div>

      {/* Alerta si no hay caja abierta */}
      {!isCheckingCashRegister && hasActiveCashRegister === false && (
        <Alert variant="destructive" className="shrink-0 rounded-none border-x-0 border-t-0">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              <strong>No tienes una caja abierta.</strong> Debes abrir una caja registradora antes de procesar ventas.
            </span>
            <Button asChild variant="outline" size="sm" className="ml-4 shrink-0">
              <Link href="/dashboard/cash-register">
                <Calculator className="mr-2 h-4 w-4" />
                Abrir Caja
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Contenido principal */}
      {/* < md : scrollea normalmente (1 columna, tab bar visible) */}
      {/* >= md: min-h-0 + overflow-hidden → altura fija, no scroll de página */}
      <div className="flex-1 overflow-y-auto md:min-h-0 md:overflow-hidden">
        <div className="grid grid-cols-1 md:h-full md:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]">

          {/* ── Columna izquierda: Búsqueda de productos ── */}
          <div className="flex flex-col border-b p-3 md:h-full md:overflow-hidden md:border-b-0 md:border-r md:p-4">
            <ProductSearch />
          </div>

          {/* ── Columna derecha: Carrito + Totales ── */}
          {/* < md : flujo natural en columna, la página scrollea */}
          {/* >= md: h-full flex-col → carrito (flex-1 min-h-0) scrollea interno, totales (shrink-0) siempre visible */}
          <div className="flex flex-col md:h-full md:overflow-hidden">
            <div className="p-2 md:min-h-0 md:flex-1 md:overflow-hidden">
              <ShoppingCart />
            </div>
            <div className="shrink-0">
              <TotalsPanel
                onCheckout={handleCheckout}
                disabled={!hasActiveCashRegister || isCheckingCashRegister}
              />
            </div>
          </div>

        </div>
      </div>

      <PaymentDialog
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
