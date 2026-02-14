import { create } from 'zustand';

export interface CartItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  stock: number;
  taxRate: number;
  discount: number;
  discountPercent: number;
}

interface CartTotals {
  subtotal: number;
  taxAmount: number;
  total: number;
  itemCount: number;
}

interface PosStore {
  items: CartItem[];
  customerId: string | null;
  refreshKey: number;
  
  // Acciones del carrito
  addItem: (product: {
    id: string;
    sku: string;
    name: string;
    price: number;
    currentStock: number;
    taxRate: number;
  }) => void;
  
  removeItem: (productId: string) => void;
  
  updateQuantity: (productId: string, quantity: number) => void;
  
  updateDiscount: (productId: string, discount: number, discountPercent: number) => void;
  
  clearCart: () => void;
  
  setCustomer: (customerId: string | null) => void;
  
  incrementRefreshKey: () => void;
  
  // Computed totals
  getTotals: () => CartTotals;
}

export const usePosStore = create<PosStore>((set, get) => ({
  items: [],
  customerId: null,
  refreshKey: 0,
  
  addItem: (product) => {
    const items = get().items;
    const existingItem = items.find(item => item.productId === product.id);
    
    if (existingItem) {
      // Incrementar cantidad si ya existe (validar stock)
      if (existingItem.quantity < existingItem.stock) {
        set({
          items: items.map(item =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        });
      }
    } else {
      // Agregar nuevo item
      const newItem: CartItem = {
        id: crypto.randomUUID(),
        productId: product.id,
        sku: product.sku,
        name: product.name,
        quantity: 1,
        unitPrice: product.price,
        stock: product.currentStock,
        taxRate: product.taxRate,
        discount: 0,
        discountPercent: 0,
      };
      
      set({ items: [...items, newItem] });
    }
  },
  
  removeItem: (productId) => {
    set({
      items: get().items.filter(item => item.productId !== productId)
    });
  },
  
  updateQuantity: (productId, quantity) => {
    const items = get().items;
    const item = items.find(i => i.productId === productId);
    
    if (!item) return;
    
    // Validar: cantidad mínima 1, máxima stock disponible
    const newQuantity = Math.max(1, Math.min(quantity, item.stock));
    
    set({
      items: items.map(i =>
        i.productId === productId
          ? { ...i, quantity: newQuantity }
          : i
      )
    });
  },
  
  updateDiscount: (productId, discount, discountPercent) => {
    set({
      items: get().items.map(item =>
        item.productId === productId
          ? { ...item, discount, discountPercent }
          : item
      )
    });
  },
  
  clearCart: () => {
    set({ items: [], customerId: null });
  },
  
  setCustomer: (customerId) => {
    set({ customerId });
  },
  
  incrementRefreshKey: () => {
    set((state) => ({ refreshKey: state.refreshKey + 1 }));
  },
  
  getTotals: () => {
    const items = get().items;
    
    // IMPORTANTE: unitPrice ya incluye IVA (precio final de venta)
    // El total es simplemente precio * cantidad - descuento
    let total = 0;
    let taxAmount = 0;
    
    items.forEach(item => {
      const itemTotal = (item.quantity * item.unitPrice) - item.discount;
      // Desglosamos el IVA: IVA = Total - (Total / (1 + taxRate/100))
      const itemNeto = itemTotal / (1 + item.taxRate / 100);
      const itemTax = itemTotal - itemNeto;
      
      total += itemTotal;
      taxAmount += itemTax;
    });
    
    const subtotal = total - taxAmount; // Neto (sin IVA)
    
    return {
      subtotal: Math.round(subtotal),
      taxAmount: Math.round(taxAmount),
      total: Math.round(total),
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    };
  },
}));
