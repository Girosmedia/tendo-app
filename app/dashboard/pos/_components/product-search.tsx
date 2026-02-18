'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Package, Barcode } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePosStore } from '@/hooks/use-pos';
import { toast } from 'sonner';

interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  currentStock: number;
  imageUrl?: string | null;
  taxRate: number;
}

export function ProductSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [barcodeBuffer, setBarcodeBuffer] = useState('');
  const barcodeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const addItem = usePosStore((state) => state.addItem);
  const refreshKey = usePosStore((state) => state.refreshKey);

  // Fetch productos con filtro
  useEffect(() => {
    const controller = new AbortController();
    
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (searchTerm) {
          params.set('search', searchTerm);
        }
        params.set('type', 'PRODUCT'); // Solo productos físicos, excluir servicios
        params.set('isActive', 'true'); // Solo productos activos
        params.set('limit', '20');
        
        const res = await fetch(`/api/products?${params}`, {
          signal: controller.signal,
        });
        
        if (!res.ok) throw new Error('Error al cargar productos');
        const { products: data } = await res.json();
        setProducts(data || []);
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== 'AbortError') {
          toast.error('Error al cargar productos');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    const debounceTimer = setTimeout(fetchProducts, 300);
    
    return () => {
      clearTimeout(debounceTimer);
      controller.abort();
    };
  }, [searchTerm, refreshKey]);

  // Manejo de escáner de código de barras
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo en un input
      if (document.activeElement?.tagName === 'INPUT' && 
          document.activeElement !== inputRef.current) {
        return;
      }

      // Si es Enter, procesar código de barras
      if (e.key === 'Enter' && barcodeBuffer) {
        e.preventDefault();
        handleBarcodeScanned(barcodeBuffer);
        setBarcodeBuffer('');
        return;
      }

      // Acumular caracteres del código de barras
      if (e.key.length === 1) {
        e.preventDefault();
        setBarcodeBuffer((prev) => prev + e.key);
        
        // Limpiar buffer después de 100ms de inactividad
        if (barcodeTimerRef.current) {
          clearTimeout(barcodeTimerRef.current);
        }
        barcodeTimerRef.current = setTimeout(() => {
          setBarcodeBuffer('');
        }, 100);
      }
    };

    // Atajo F3 para enfocar búsqueda
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      window.removeEventListener('keydown', handleKeyDown);
      if (barcodeTimerRef.current) {
        clearTimeout(barcodeTimerRef.current);
      }
    };
  }, [barcodeBuffer]);

  const handleBarcodeScanned = (barcode: string) => {
    const product = products?.find((p) => p.sku === barcode);
    if (product) {
      handleAddToCart(product);
      setSearchTerm('');
    } else {
      toast.error(`Producto no encontrado: ${barcode}`);
    }
  };

  const handleAddToCart = (product: Product) => {
    console.log('[POS] handleAddToCart called:', { productId: product.id, name: product.name, stock: product.currentStock });
    
    if (product.currentStock <= 0) {
      toast.error('Producto sin stock');
      return;
    }
    
    try {
      addItem({
        id: product.id,
        sku: product.sku,
        name: product.name,
        price: Number(product.price),
        currentStock: product.currentStock,
        taxRate: Number(product.taxRate),
      });
      console.log('[POS] Item added successfully');
      toast.success(`${product.name} agregado al carrito`);
    } catch (error) {
      console.error('[POS] Error adding item:', error);
      toast.error('Error al agregar producto');
    }
  };

  const filteredProducts = products || [];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="product-search-input"
            ref={inputRef}
            placeholder="Buscar por nombre o SKU (F3)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-12 text-base"
            autoFocus
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <Barcode className="h-3 w-3" />
          Escáner de código de barras habilitado
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Package className="h-12 w-12 mb-2" />
            <p className="text-sm">
              {searchTerm ? 'No se encontraron productos' : 'Busca un producto para comenzar'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredProducts.map((product) => (
              <Button
                key={product.id}
                variant="outline"
                className="h-auto p-3 justify-start hover:bg-primary/10 hover:border-primary active:scale-[0.98] transition-all min-h-[48px] cursor-pointer touch-manipulation"
                onClick={() => handleAddToCart(product)}
                onTouchEnd={(e) => {
                  // Prevenir el click duplicado en dispositivos táctiles
                  e.preventDefault();
                  if (product.currentStock > 0) {
                    handleAddToCart(product);
                  }
                }}
                disabled={product.currentStock <= 0}
              >
                <div className="flex w-full items-start gap-3">
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center shrink-0">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p
                      className="overflow-hidden text-sm font-medium leading-tight break-words [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
                      title={product.name}
                    >
                      {product.name}
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-xs text-muted-foreground" title={`SKU: ${product.sku}`}>
                        SKU: {product.sku}
                      </p>
                      <p className="shrink-0 text-base font-bold">
                        ${product.price.toLocaleString('es-CL')}
                      </p>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Stock: {product.currentStock}
                    </p>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
