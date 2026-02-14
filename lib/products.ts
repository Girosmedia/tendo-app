import { Prisma } from '@/lib/generated/prisma/client/client'

type Decimal = Prisma.Decimal

/**
 * Formatea un precio a formato chileno (CLP)
 */
export function formatPrice(price: number | Decimal, currency: string = 'CLP'): string {
  const numericPrice = typeof price === 'number' ? price : price.toNumber()
  
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericPrice)
}

/**
 * Formatea un SKU agregando prefijos o normalizándolo
 */
export function formatSKU(sku: string): string {
  return sku.toUpperCase().trim()
}

/**
 * Calcula el margen de ganancia
 */
export function calculateMargin(price: number | Decimal, cost: number | Decimal): number {
  const numericPrice = typeof price === 'number' ? price : price.toNumber()
  const numericCost = typeof cost === 'number' ? cost : cost.toNumber()
  
  if (numericPrice === 0) return 0
  
  return ((numericPrice - numericCost) / numericPrice) * 100
}

/**
 * Calcula el margen de ganancia formateado
 */
export function formatMargin(price: number | Decimal, cost: number | Decimal): string {
  const margin = calculateMargin(price, cost)
  return `${margin.toFixed(2)}%`
}

/**
 * Verifica si un producto tiene stock bajo
 */
export function isLowStock(currentStock: number, minStock: number, trackInventory: boolean): boolean {
  if (!trackInventory) return false
  return currentStock <= minStock
}

/**
 * Calcula el precio con IVA
 */
export function calculatePriceWithTax(price: number | Decimal, taxRate: number | Decimal): number {
  const numericPrice = typeof price === 'number' ? price : price.toNumber()
  const numericTaxRate = typeof taxRate === 'number' ? taxRate : taxRate.toNumber()
  
  return numericPrice * (1 + numericTaxRate / 100)
}

/**
 * Formatea el precio con IVA
 */
export function formatPriceWithTax(
  price: number | Decimal,
  taxRate: number | Decimal,
  currency: string = 'CLP'
): string {
  const priceWithTax = calculatePriceWithTax(price, taxRate)
  return formatPrice(priceWithTax, currency)
}

/**
 * Genera un SKU automático basado en el nombre del producto
 */
export function generateSKU(productName: string, counter: number = 1): string {
  const clean = productName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .substring(0, 10)
  
  return `${clean}-${String(counter).padStart(4, '0')}`
}

/**
 * Formatea la unidad de medida
 */
export function formatUnit(unit: string, quantity: number = 1): string {
  const units: Record<string, { singular: string; plural: string }> = {
    unidad: { singular: 'unidad', plural: 'unidades' },
    kg: { singular: 'kg', plural: 'kg' },
    litro: { singular: 'litro', plural: 'litros' },
    metro: { singular: 'metro', plural: 'metros' },
    caja: { singular: 'caja', plural: 'cajas' },
    paquete: { singular: 'paquete', plural: 'paquetes' },
  }
  
  const unitInfo = units[unit.toLowerCase()] || { singular: unit, plural: unit }
  return quantity === 1 ? unitInfo.singular : unitInfo.plural
}

/**
 * Calcula el valor total de inventario
 */
export function calculateInventoryValue(
  currentStock: number,
  cost: number | Decimal | null
): number {
  if (!cost) return 0
  const numericCost = typeof cost === 'number' ? cost : cost.toNumber()
  return currentStock * numericCost
}
