import { z } from 'zod'

const imageUrlSchema = z.union([
  z.string().url('Debe ser una URL válida'),
  z.string().startsWith('/', 'Debe ser una URL válida o ruta relativa iniciada con /'),
  z.literal(''),
  z.null(),
])

/**
 * Schema base para validación de productos en API (backend)
 * Usa tipos numéricos directos
 */
export const productApiSchema = z.object({
  type: z.enum(['PRODUCT', 'SERVICE']),
  categoryId: z.string().nullable().optional(),
  sku: z.string().min(1, 'El SKU es requerido').max(50),
  name: z.string().min(1, 'El nombre es requerido').max(200),
  description: z.string().optional(),
  imageUrl: imageUrlSchema.optional(),
  price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  cost: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).default(19),
  trackInventory: z.boolean().default(false),
  currentStock: z.number().int().min(0).default(0),
  minStock: z.number().int().min(0).default(0),
  unit: z.string().default('unidad'),
  isActive: z.boolean().default(true),
})

/**
 * Schema para actualización de productos en API (todos los campos opcionales)
 */
export const productUpdateApiSchema = productApiSchema.partial()

/**
 * Schema para formularios de cliente (usa strings para inputs numéricos)
 * Transformación a números se hace antes de enviar a API
 */
export const productFormSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  sku: z.string().min(1, 'El SKU es obligatorio').max(50),
  description: z.string().optional(),
  type: z.enum(['PRODUCT', 'SERVICE']),
  categoryId: z.string().optional(),
  price: z.string().min(1, 'El precio es obligatorio'),
  cost: z.string().optional(),
  taxRate: z.string().optional(),
  trackInventory: z.boolean().optional(),
  currentStock: z.string().optional(),
  minStock: z.string().optional(),
  unit: z.string().optional(),
  isActive: z.boolean().optional(),
})

/**
 * Schema para edición de productos (formulario cliente)
 * Similar al de creación pero con campos nullable en lugar de optional
 */
export const productEditFormSchema = z.object({
  type: z.enum(['PRODUCT', 'SERVICE']),
  categoryId: z.string().nullable(),
  sku: z.string().min(1, 'El SKU es requerido').max(50),
  name: z.string().min(1, 'El nombre es requerido').max(200),
  description: z.string().nullable(),
  imageUrl: imageUrlSchema,
  price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  cost: z.number().min(0).nullable(),
  taxRate: z.number().min(0).max(100),
  trackInventory: z.boolean(),
  currentStock: z.number().int().min(0),
  minStock: z.number().int().min(0),
  unit: z.string(),
  isActive: z.boolean(),
})

/**
 * Schema compacto para flujo rápido de creación con etiquetas
 * Solo campos esenciales, el resto se asigna con defaults
 */
export const productCompactFormSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  sku: z.string().min(1, 'El SKU es obligatorio'),
  price: z.string().min(1, 'El precio es obligatorio'),
  description: z.string().optional(),
})

/**
 * Tipos derivados de los schemas
 */
export type ProductApiInput = z.infer<typeof productApiSchema>
export type ProductUpdateApiInput = z.infer<typeof productUpdateApiSchema>
export type ProductFormData = z.infer<typeof productFormSchema>
export type ProductEditFormData = z.infer<typeof productEditFormSchema>
export type ProductCompactFormData = z.infer<typeof productCompactFormSchema>

/**
 * Helper para transformar datos del formulario a formato API
 * Convierte strings numéricos a números
 */
export function transformFormDataToApi(data: ProductFormData): Omit<ProductApiInput, 'type'> & { type: 'PRODUCT' | 'SERVICE' } {
  return {
    type: data.type,
    categoryId: data.categoryId || null,
    sku: data.sku,
    name: data.name,
    description: data.description || undefined,
    price: parseFloat(data.price),
    cost: data.cost ? parseFloat(data.cost) : undefined,
    taxRate: data.taxRate ? parseFloat(data.taxRate) : 19,
    trackInventory: data.trackInventory ?? false,
    currentStock: data.currentStock ? parseInt(data.currentStock) : 0,
    minStock: data.minStock ? parseInt(data.minStock) : 0,
    unit: data.unit || 'unidad',
    isActive: data.isActive ?? true,
  }
}

/**
 * Helper para transformar datos del formulario compacto a formato API
 */
export function transformCompactFormDataToApi(data: ProductCompactFormData): ProductApiInput {
  return {
    type: 'PRODUCT',
    categoryId: null,
    sku: data.sku,
    name: data.name,
    description: data.description,
    price: parseFloat(data.price),
    taxRate: 19,
    trackInventory: false,
    currentStock: 0,
    minStock: 0,
    unit: 'unidad',
    isActive: true,
  }
}
