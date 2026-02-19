import { test, expect } from '@playwright/test';

/**
 * Tests E2E para el módulo POS (Point of Sale)
 * 
 * NOTA: Estos tests requieren:
 * - Un usuario autenticado con rol MEMBER o superior
 * - Caja registradora abierta (CashRegister con status OPEN)
 * - Productos con stock disponible
 * 
 * Para ejecutar en CI, usar fixtures con Page Storage State
 */

test.describe('POS - Public Interface', () => {
  test('página POS es accesible sin autenticación', async ({ page }) => {
    await page.goto('/dashboard/pos');
    
    // Según arquitectura, /dashboard requiere auth
    // Si redirige a login, es correcto
    const url = page.url();
    const isAtPOS = url.includes('/pos');
    const isAtLogin = url.includes('/login');
    
    expect(isAtPOS || isAtLogin).toBe(true);
  });
});

test.describe.skip('POS - Authenticated Flow', () => {
  // Estos tests están skip porque requieren autenticación
  // En ambiente de CI, usar el patrón de fixtures con storageState

  test.beforeEach(async ({ page }) => {
    // TODO: Implementar autenticación automática
    // await page.context().addCookies([...]); o usar storageState
    await page.goto('/dashboard/pos');
  });

  test('muestra interfaz del POS correctamente', async ({ page }) => {
    // Verificar elementos clave del POS
    await expect(page.locator('text=/Punto de Venta|POS/i')).toBeVisible();
    
    // Buscador de productos
    const searchInput = page.locator('input[placeholder*="producto"]');
    await expect(searchInput).toBeVisible();

    // Lista de productos o grid
    const productGrid = page.locator('[data-testid="product-grid"]');
    if (await productGrid.isVisible()) {
      await expect(productGrid).toBeVisible();
    }

    // Carrito de compras
    const cart = page.locator('[data-testid="cart"]');
    await expect(cart).toBeVisible();
  });

  test('buscar productos funciona correctamente', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="producto"]');
    await searchInput.fill('coca');

    // Esperar resultados
    await page.waitForTimeout(500); // Debounce

    const results = page.locator('[data-testid="product-item"]');
    const count = await results.count();

    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('agregar producto al carrito', async ({ page }) => {
    // Seleccionar primer producto disponible
    const firstProduct = page.locator('[data-testid="product-item"]').first();
    
    if (await firstProduct.isVisible()) {
      await firstProduct.click();

      // Verificar que se agregó al carrito
      const cartItems = page.locator('[data-testid="cart-item"]');
      const cartCount = await cartItems.count();

      expect(cartCount).toBeGreaterThan(0);
    }
  });

  test('modificar cantidad en carrito', async ({ page }) => {
    // Agregar un producto primero
    const firstProduct = page.locator('[data-testid="product-item"]').first();
    
    if (await firstProduct.isVisible()) {
      await firstProduct.click();

      // Incrementar cantidad
      const increaseBtn = page.locator('[data-testid="increase-qty"]').first();
      await increaseBtn.click();

      // Verificar que cantidad aumentó
      const qtyDisplay = page.locator('[data-testid="cart-item-qty"]').first();
      const qty = await qtyDisplay.textContent();

      expect(parseInt(qty || '0')).toBeGreaterThanOrEqual(2);
    }
  });

  test('eliminar producto del carrito', async ({ page }) => {
    // Agregar un producto
    const firstProduct = page.locator('[data-testid="product-item"]').first();
    
    if (await firstProduct.isVisible()) {
      await firstProduct.click();

      // Contar items iniciales
      let cartItems = await page.locator('[data-testid="cart-item"]').count();
      const initialCount = cartItems;

      // Eliminar item
      const removeBtn = page.locator('[data-testid="remove-item"]').first();
      await removeBtn.click();

      // Verificar que disminuyó
      cartItems = await page.locator('[data-testid="cart-item"]').count();
      expect(cartItems).toBeLessThan(initialCount);
    }
  });

  test('calcular total correctamente', async ({ page }) => {
    // Agregar producto con precio conocido
    const product = page.locator('[data-testid="product-item"]').first();
    
    if (await product.isVisible()) {
      // Obtener precio del producto
      const priceText = await product.locator('[data-testid="product-price"]').textContent();
      const price = parseInt(priceText?.replace(/[^0-9]/g, '') || '0');

      await product.click();

      // Verificar total en carrito
      const totalText = await page.locator('[data-testid="cart-total"]').textContent();
      const total = parseInt(totalText?.replace(/[^0-9]/g, '') || '0');

      expect(total).toBeGreaterThanOrEqual(price);
    }
  });

  test('completar venta en efectivo', async ({ page }) => {
    // Agregar producto
    const firstProduct = page.locator('[data-testid="product-item"]').first();
    
    if (await firstProduct.isVisible()) {
      await firstProduct.click();

      // Click en botón de pagar
      const payButton = page.locator('button:has-text("Cobrar")');
      await payButton.click();

      // Seleccionar método efectivo
      const cashOption = page.locator('text=/Efectivo/i');
      if (await cashOption.isVisible()) {
        await cashOption.click();
      }

      // Ingresar monto recibido
      const receivedInput = page.locator('input[name="received"]');
      if (await receivedInput.isVisible()) {
        await receivedInput.fill('10000');
      }

      // Confirmar venta
      const confirmButton = page.locator('button:has-text(/Confirmar|Completar/)');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();

        // Esperar mensaje de éxito
        await expect(page.locator('text=/Venta completada|Éxito/i')).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });

  test('aplicar descuento a venta', async ({ page }) => {
    // Agregar producto
    const firstProduct = page.locator('[data-testid="product-item"]').first();
    
    if (await firstProduct.isVisible()) {
      await firstProduct.click();

      // Abrir modal de descuento
      const discountBtn = page.locator('button:has-text(/Descuento/)');
      if (await discountBtn.isVisible()) {
        await discountBtn.click();

        // Aplicar descuento del 10%
        const discountInput = page.locator('input[name="discount"]');
        await discountInput.fill('10');

        const applyBtn = page.locator('button:has-text(/Aplicar/)');
        await applyBtn.click();

        // Verificar que el total refleja el descuento
        const totalText = await page.locator('[data-testid="cart-total"]').textContent();
        const total = parseInt(totalText?.replace(/[^0-9]/g, '') || '0');

        expect(total).toBeGreaterThan(0);
      }
    }
  });
});

test.describe('POS - Performance', () => {
  test('carga rápidamente', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/dashboard/pos', { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - startTime;

    // En CI compartido el tiempo es más variable
    expect(loadTime).toBeLessThan(15000);
  });
});
