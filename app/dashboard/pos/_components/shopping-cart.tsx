'use client';

import { useState } from 'react';
import { usePosStore } from '@/hooks/use-pos';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Trash2, ShoppingCart as CartIcon, Tag } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ItemDiscountDialog } from './item-discount-dialog';

export function ShoppingCart() {
  const items = usePosStore((state) => state.items);
  const updateQuantity = usePosStore((state) => state.updateQuantity);
  const updateDiscount = usePosStore((state) => state.updateDiscount);
  const removeItem = usePosStore((state) => state.removeItem);
  const clearCart = usePosStore((state) => state.clearCart);
  const [discountingItemId, setDiscountingItemId] = useState<string | null>(null);

  const handleClearCart = () => {
    if (items.length === 0) return;

    const confirmed = window.confirm('¿Deseas limpiar todo el carrito? Esta acción no se puede deshacer.');
    if (!confirmed) return;

    clearCart();
  };

  if (items.length === 0) {
    return (
      <Card className="flex h-full min-h-60 flex-col items-center justify-center p-8 text-muted-foreground">
        <CartIcon className="mb-4 h-14 w-14 opacity-15" />
        <p className="text-sm text-center font-medium">El carrito está vacío</p>
        <p className="mt-1 text-xs text-center text-muted-foreground/70">
          Agrega productos para comenzar
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex h-full min-h-72 flex-col gap-0 overflow-hidden py-0">
      {/* Header compacto */}
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <CartIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">
            {items.length} {items.length === 1 ? 'producto' : 'productos'}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClearCart}
          className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-destructive"
          title="Limpiar carrito (F4)"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Limpiar
        </Button>
      </div>

      {/* Lista de ítems — diseño 2 filas por ítem */}
      <div className="min-h-0 flex-1 overflow-y-auto p-2 space-y-1.5">
        {items.map((item) => {
          const originalPrice = item.quantity * item.unitPrice;
          const itemTotal = originalPrice - item.discount;
          const hasDiscount = item.discount > 0;

          return (
            <div
              key={item.id}
              className="rounded-lg border bg-card px-3 py-2 transition-colors hover:bg-accent/40"
            >
              {/* Fila 1: nombre + total */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-snug">{item.name}</p>
                  {hasDiscount && (
                    <Badge variant="success" className="mt-0.5 text-xs">
                      {item.discountPercent > 0
                        ? `-${item.discountPercent}%`
                        : `-$${item.discount.toLocaleString('es-CL')}`}
                    </Badge>
                  )}
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums">
                  ${Math.round(itemTotal).toLocaleString('es-CL')}
                </span>
              </div>

              {/* Fila 2: precio unitario + controles */}
              <div className="mt-1.5 flex items-center justify-between gap-1">
                <span className="text-xs text-muted-foreground tabular-nums">
                  ${item.unitPrice.toLocaleString('es-CL')} c/u
                  {hasDiscount && (
                    <span className="ml-1.5 line-through opacity-60">
                      ${originalPrice.toLocaleString('es-CL')}
                    </span>
                  )}
                </span>

                <div className="flex items-center gap-0.5">
                  {/* Descuento */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setDiscountingItemId(item.id)}
                    title="Aplicar descuento"
                  >
                    <Tag className="h-3.5 w-3.5" />
                  </Button>

                  {/* Cantidad */}
                  <div className="flex items-center rounded-md border">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-r-none border-r"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-semibold tabular-nums">
                      {item.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-l-none border-l"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      title={item.quantity >= item.stock ? 'Stock máximo alcanzado' : ''}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Eliminar */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground/60 hover:text-destructive"
                    onClick={() => removeItem(item.productId)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialog para aplicar descuentos */}
      <ItemDiscountDialog
        item={items.find(i => i.id === discountingItemId) || null}
        open={!!discountingItemId}
        onClose={() => setDiscountingItemId(null)}
        onApply={(discount, discountPercent) => {
          const item = items.find(i => i.id === discountingItemId);
          if (item) {
            updateDiscount(item.productId, discount, discountPercent);
          }
          setDiscountingItemId(null);
        }}
      />
    </Card>
  );
}
