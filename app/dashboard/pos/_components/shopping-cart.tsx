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
  const [discountingItemId, setDiscountingItemId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <Card className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
        <CartIcon className="h-16 w-16 mb-4 opacity-20" />
        <p className="text-sm text-center">
          El carrito está vacío
          <br />
          <span className="text-xs">Agrega productos para comenzar</span>
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Carrito de Compras</h3>
        <p className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? 'producto' : 'productos'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.map((item) => {
          // El precio unitario ya incluye IVA (precio final de venta)
          const originalPrice = item.quantity * item.unitPrice;
          const itemTotal = originalPrice - item.discount;
          const hasDiscount = item.discount > 0;

          return (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  {hasDiscount && (
                    <Badge variant="success" className="text-xs">
                      {item.discountPercent > 0 ? `-${item.discountPercent}%` : `-$${item.discount.toLocaleString('es-CL')}`}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>${item.unitPrice.toLocaleString('es-CL')} × {item.quantity}</span>
                  {hasDiscount && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="line-through">${originalPrice.toLocaleString('es-CL')}</span>
                    </>
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => setDiscountingItemId(item.id)}
                title="Aplicar descuento"
              >
                <Tag className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>

                <div className="w-12 text-center font-semibold">
                  {item.quantity}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  disabled={item.quantity >= item.stock}
                  title={item.quantity >= item.stock ? 'Stock máximo alcanzado' : ''}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-right shrink-0 min-w-[80px]">
                <p className="font-bold text-sm">
                  ${Math.round(itemTotal).toLocaleString('es-CL')}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-destructive hover:text-destructive"
                onClick={() => removeItem(item.productId)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
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
