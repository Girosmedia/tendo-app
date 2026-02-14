/**
 * Glosario Chileno - Tendo (Lenguaje Zimple)
 * 
 * Este glosario define los términos localizados para usuarios chilenos.
 * Evita términos técnicos en inglés y usa lenguaje cercano y comprensible.
 * 
 * @author Directora de Arte - Tendo Design System v1.0
 */

/**
 * Mapeo de términos técnicos a lenguaje chileno cercano
 */
export const GLOSSARY_CL = {
  // Términos Financieros
  'Balance': 'Plata en Caja',
  'Equity': 'Capital',
  'Accounts Receivable': 'Fiados',
  'Accounts Payable': 'Por Pagar',
  'Payroll': 'Sueldos',
  'Assets': 'Activos',
  'Liabilities': 'Deudas',
  'Revenue': 'Ingresos',
  'Expenses': 'Gastos',
  'Profit': 'Utilidad',
  'Loss': 'Pérdida',
  
  // Términos de Inventario
  'Stock': 'Stock',
  'Inventory': 'Inventario',
  'Product': 'Producto',
  'Service': 'Servicio',
  'SKU': 'Código',
  'Barcode': 'Código de Barras',
  'Out of Stock': 'Sin Stock',
  'Low Stock': 'Stock Bajo',
  
  // Términos de Ventas
  'Sale': 'Venta',
  'Quote': 'Cotización',
  'Invoice': 'Factura',
  'Receipt': 'Boleta',
  'Order': 'Pedido',
  'Customer': 'Cliente',
  'Supplier': 'Proveedor',
  
  // Términos de Caja
  'Cash Register': 'Caja',
  'Cash': 'Efectivo',
  'Card': 'Tarjeta',
  'Transfer': 'Transferencia',
  'Change': 'Vuelto',
  'Total': 'Total',
  'Subtotal': 'Subtotal',
  
  // Términos de Proyectos (Track Servicios)
  'Project': 'Obra',
  'Contractor': 'Contratista',
  'Labor': 'Mano de Obra',
  'Materials': 'Materiales',
  'Budget': 'Presupuesto',
  'Estimate': 'Cotización',
  
  // Estados de Documentos
  'Draft': 'Borrador',
  'Pending': 'Pendiente',
  'Sent': 'Enviado',
  'Approved': 'Aprobado',
  'Rejected': 'Rechazado',
  'Paid': 'Pagado',
  'Overdue': 'Atrasado',
  
  // Zona Horaria
  timezone: 'America/Santiago',
} as const;

/**
 * Formatea montos en pesos chilenos (CLP)
 * Sin decimales, separador de miles con punto
 * 
 * @param amount - Monto en pesos
 * @returns String formateado (ej: "$ 1.500")
 */
export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formatea montos sin símbolo de moneda
 * Útil para inputs y cálculos
 * 
 * @param amount - Monto
 * @returns String formateado sin símbolo (ej: "1.500")
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Traduce un término técnico a lenguaje chileno
 * 
 * @param term - Término técnico en inglés
 * @returns Término en español chileno, o el original si no existe traducción
 */
export function translate(term: keyof typeof GLOSSARY_CL): string {
  return GLOSSARY_CL[term] ?? term;
}

/**
 * Obtiene la zona horaria de Chile
 */
export function getChileTimezone(): string {
  return GLOSSARY_CL.timezone;
}

/**
 * Tipo para los términos del glosario
 */
export type GlossaryTerm = keyof typeof GLOSSARY_CL;
