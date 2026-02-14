/**
 * Utilidades para SKUs y códigos de barras
 * Este archivo NO debe importar módulos de Node (como Prisma)
 * para que pueda ser usado en componentes cliente
 */

/**
 * Genera un SKU aleatorio en formato PROD-{timestamp}-{random}
 * Ejemplo: PROD-1676543210-X7K9
 */
export function generateRandomSKU(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PROD-${timestamp}-${random}`;
}

/**
 * Valida si un string parece ser un código de barras comercial
 * Detecta formatos comunes: EAN-13, UPC-A, CODE128, etc.
 */
export function isLikelyBarcode(value: string): boolean {
  // Remover espacios
  const clean = value.trim();
  
  // EAN-13: 13 dígitos
  if (/^\d{13}$/.test(clean)) return true;
  
  // UPC-A: 12 dígitos
  if (/^\d{12}$/.test(clean)) return true;
  
  // EAN-8: 8 dígitos
  if (/^\d{8}$/.test(clean)) return true;
  
  // CODE128: Generalmente alfanumérico, 6-20 caracteres
  if (/^[A-Z0-9]{6,20}$/.test(clean)) return true;
  
  return false;
}

/**
 * Normaliza un SKU/código de barras
 * Remueve espacios, guiones y convierte a mayúsculas
 */
export function normalizeSKU(value: string): string {
  return value
    .trim()
    .replace(/[\s\-]/g, '')
    .toUpperCase();
}
