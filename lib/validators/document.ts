import { z } from 'zod';

// Enums
export const DocumentTypeEnum = z.enum([
  'SALE',
  'QUOTE',
  'INVOICE',
  'RECEIPT',
  'CREDIT_NOTE',
]);

export const DocumentStatusEnum = z.enum([
  'DRAFT',
  'PENDING',
  'APPROVED',
  'PAID',
  'CANCELLED',
]);

export const PaymentMethodEnum = z.enum([
  'CASH',
  'CARD',
  'TRANSFER',
  'CHECK',
  'CREDIT',
  'MULTI',
]);

// Schema para crear/actualizar items de documento
export const documentItemSchema = z.object({
  productId: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  name: z.string().min(1, 'El nombre del producto/servicio es requerido'),
  description: z.string().optional().nullable(),
  quantity: z
    .number()
    .positive('La cantidad debe ser mayor a 0')
    .max(9999999, 'Cantidad demasiado grande'),
  unit: z.string().default('unidad'),
  unitPrice: z
    .number()
    .nonnegative('El precio unitario no puede ser negativo')
    .max(9999999999, 'Precio demasiado alto'),
  discount: z
    .number()
    .nonnegative('El descuento no puede ser negativo')
    .default(0),
  discountPercent: z
    .number()
    .min(0)
    .max(100, 'El descuento porcentual debe estar entre 0 y 100')
    .optional()
    .nullable(),
  taxRate: z
    .number()
    .min(0)
    .max(100, 'La tasa de impuesto debe estar entre 0 y 100')
    .default(19),
});

// Schema para crear documento
export const createDocumentSchema = z.object({
  customerId: z.string().optional().nullable(),
  type: DocumentTypeEnum.default('SALE'),
  status: DocumentStatusEnum.default('DRAFT'),
  docPrefix: z.string().optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(), // ISO string
  paymentMethod: PaymentMethodEnum.default('CASH'),
  taxRate: z
    .number()
    .min(0)
    .max(100, 'La tasa de impuesto debe estar entre 0 y 100')
    .default(19),
  discount: z
    .number()
    .nonnegative('El descuento no puede ser negativo')
    .default(0),
  cashReceived: z
    .number()
    .nonnegative('El monto recibido no puede ser negativo')
    .optional()
    .nullable(),
  notes: z.string().max(5000).optional().nullable(),
  items: z
    .array(documentItemSchema)
    .min(1, 'El documento debe tener al menos un ítem'),
});

// Schema para actualizar documento
export const updateDocumentSchema = z.object({
  customerId: z.string().optional().nullable(),
  status: DocumentStatusEnum.optional(),
  dueAt: z.string().datetime().optional().nullable(),
  paymentMethod: PaymentMethodEnum.optional(),
  paidAt: z.string().datetime().optional().nullable(),
  discount: z.number().nonnegative().optional(),
  cashReceived: z.number().nonnegative().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

// Tipos TypeScript derivados
export type DocumentItemInput = z.infer<typeof documentItemSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type DocumentType = z.infer<typeof DocumentTypeEnum>;
export type DocumentStatus = z.infer<typeof DocumentStatusEnum>;
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;
