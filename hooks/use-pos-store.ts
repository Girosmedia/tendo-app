import { create } from 'zustand';

interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  currentStock: number;
  imageUrl?: string | null;
  taxRate: number;
}

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  taxAmount: number;
  total: number;
}

interface POSStore {
  // Estado del carrito
  items: CartItem[];
  selectedCustomerId: string | null;
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'MULTI' | null;
  cashReceived: number;
  
  // Computed values
  itemCount: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  cashChange: number;
  
  // Actions
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  incrementQuantity: (productId: string) => void;
  decrementQuantity: (productId: string) => void;
  setCustomer: (customerId: string | null) => void;
  setPaymentMethod: (method: 'CASH' | 'CARD' | 'TRANSFER' | 'MULTI') => void;
  setCashReceived: (amount: number) => void;
  clearCart: () => void;
  calculateTotals: () => void;
}

// IMPORTANTE: product.price es BRUTO (incluye IVA)
// Cálculo correcto: total = qty * precioBruto, neto = total/1.19, iva = total - neto
const calculateItemTotals = (product: Product, quantity: number) => {
  const unitPrice = product.price; // Precio bruto (con IVA incluido)
  const totalBruto = quantity * unitPrice;
  
  // Calcular neto e IVA desde el bruto
  const divisor = 1 + (product.taxRate / 100);
  const subtotal = totalBruto / divisor; // Neto (base imponible)
  const taxAmount = totalBruto - subtotal; // IVA
  const total = totalBruto; // Total con IVA
  
  return { unitPrice, subtotal, taxAmount, total };
};

export const usePOSStore = create<POSStore>((set, get) => ({
  // Estado inicial
  items: [],
  selectedCustomerId: null,
  paymentMethod: null,
  cashReceived: 0,
  itemCount: 0,
  subtotal: 0,
  taxAmount: 0,
  total: 0,
  cashChange: 0,
  
  // Agregar producto al carrito
  addItem: (product, quantity = 1) => {
    const { items } = get();
    const existingItem = items.find((item) => item.product.id === product.id);
    
    if (existingItem) {
      // Si ya existe, incrementar cantidad
      const newQuantity = existingItem.quantity + quantity;
      get().updateQuantity(product.id, newQuantity);
    } else {
      // Agregar nuevo item
      const totals = calculateItemTotals(product, quantity);
      const newItem: CartItem = {
        product,
        quantity,
        ...totals,
      };
      
      set({ items: [...items, newItem] });
      get().calculateTotals();
    }
  },
  
  // Eliminar producto del carrito
  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.product.id !== productId),
    }));
    get().calculateTotals();
  },
  
  // Actualizar cantidad de un producto
  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    
    set((state) => ({
      items: state.items.map((item) => {
        if (item.product.id === productId) {
          const totals = calculateItemTotals(item.product, quantity);
          return { ...item, quantity, ...totals };
        }
        return item;
      }),
    }));
    get().calculateTotals();
  },
  
  // Incrementar cantidad en 1
  incrementQuantity: (productId) => {
    const item = get().items.find((i) => i.product.id === productId);
    if (item) {
      get().updateQuantity(productId, item.quantity + 1);
    }
  },
  
  // Decrementar cantidad en 1
  decrementQuantity: (productId) => {
    const item = get().items.find((i) => i.product.id === productId);
    if (item && item.quantity > 1) {
      get().updateQuantity(productId, item.quantity - 1);
    } else if (item && item.quantity === 1) {
      get().removeItem(productId);
    }
  },
  
  // Seleccionar cliente
  setCustomer: (customerId) => {
    set({ selectedCustomerId: customerId });
  },
  
  // Seleccionar método de pago
  setPaymentMethod: (method) => {
    set({ paymentMethod: method });
  },
  
  // Establecer efectivo recibido
  setCashReceived: (amount) => {
    const { total } = get();
    set({
      cashReceived: amount,
      cashChange: amount - total,
    });
  },
  
  // Limpiar carrito
  clearCart: () => {
    set({
      items: [],
      selectedCustomerId: null,
      paymentMethod: null,
      cashReceived: 0,
      itemCount: 0,
      subtotal: 0,
      taxAmount: 0,
      total: 0,
      cashChange: 0,
    });
  },
  
  // Calcular totales
  calculateTotals: () => {
    const { items, cashReceived } = get();
    
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = items.reduce((sum, item) => sum + item.taxAmount, 0);
    const total = subtotal + taxAmount;
    const cashChange = cashReceived - total;
    
    set({
      itemCount,
      subtotal,
      taxAmount,
      total,
      cashChange,
    });
  },
}));
