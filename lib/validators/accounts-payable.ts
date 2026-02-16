import { z } from 'zod';

export const supplierStatusEnum = z.enum(['ACTIVE', 'INACTIVE']);

export const createSupplierSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre del proveedor debe tener al menos 2 caracteres')
    .max(120, 'El nombre del proveedor no puede superar 120 caracteres'),
  rut: z.string().max(20, 'El RUT no puede superar 20 caracteres').optional().nullable(),
  contactName: z
    .string()
    .max(120, 'El nombre de contacto no puede superar 120 caracteres')
    .optional()
    .nullable(),
  email: z.string().email('Correo inválido').optional().nullable(),
  phone: z
    .string()
    .max(30, 'El teléfono no puede superar 30 caracteres')
    .optional()
    .nullable(),
  address: z
    .string()
    .max(200, 'La dirección no puede superar 200 caracteres')
    .optional()
    .nullable(),
  notes: z.string().max(2000, 'Las notas no pueden superar 2000 caracteres').optional().nullable(),
  status: supplierStatusEnum.default('ACTIVE'),
});

export const updateSupplierSchema = createSupplierSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar',
  });

export const supplierQuerySchema = z.object({
  search: z.string().optional(),
  status: supplierStatusEnum.optional(),
});

export const accountPayableStatusEnum = z.enum([
  'PENDING',
  'PARTIAL',
  'PAID',
  'OVERDUE',
  'CANCELED',
]);

export const accountPayableDocumentTypeEnum = z.enum(['INVOICE', 'RECEIPT', 'OTHER']);

export const createAccountPayableSchema = z
  .object({
    supplierId: z.string().min(1, 'El proveedor es requerido'),
    documentType: accountPayableDocumentTypeEnum.default('INVOICE'),
    documentNumber: z
      .string()
      .max(60, 'El número de documento no puede superar 60 caracteres')
      .optional()
      .nullable(),
    issueDate: z.string().datetime('Fecha de emisión inválida'),
    dueDate: z.string().datetime('Fecha de vencimiento inválida'),
    amount: z
      .number({ message: 'El monto es requerido' })
      .positive('El monto debe ser mayor a 0')
      .max(9999999999, 'El monto es demasiado alto'),
    description: z
      .string()
      .max(200, 'La descripción no puede superar 200 caracteres')
      .optional()
      .nullable(),
    notes: z.string().max(2000, 'Las notas no pueden superar 2000 caracteres').optional().nullable(),
  })
  .refine((data) => new Date(data.dueDate) >= new Date(data.issueDate), {
    message: 'La fecha de vencimiento debe ser igual o posterior a la de emisión',
    path: ['dueDate'],
  });

export const updateAccountPayableSchema = z
  .object({
    supplierId: z.string().optional(),
    documentType: accountPayableDocumentTypeEnum.optional(),
    documentNumber: z.string().max(60).optional().nullable(),
    issueDate: z.string().datetime().optional(),
    dueDate: z.string().datetime().optional(),
    amount: z.number().positive().max(9999999999).optional(),
    balance: z.number().min(0).max(9999999999).optional(),
    description: z.string().max(200).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
    status: accountPayableStatusEnum.optional(),
    paidAt: z.string().datetime().optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar',
  });

export const registerAccountPayablePaymentSchema = z.object({
  paymentAmount: z
    .number({ message: 'El monto del pago es requerido' })
    .positive('El monto del pago debe ser mayor a 0')
    .max(9999999999, 'El monto es demasiado alto'),
  paidAt: z.string().datetime('Fecha de pago inválida').optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const accountPayableQuerySchema = z.object({
  search: z.string().optional(),
  supplierId: z.string().optional(),
  status: accountPayableStatusEnum.optional(),
  overdue: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
  startDueDate: z.string().datetime().optional(),
  endDueDate: z.string().datetime().optional(),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type SupplierQueryInput = z.infer<typeof supplierQuerySchema>;

export type CreateAccountPayableInput = z.infer<typeof createAccountPayableSchema>;
export type UpdateAccountPayableInput = z.infer<typeof updateAccountPayableSchema>;
export type RegisterAccountPayablePaymentInput = z.infer<
  typeof registerAccountPayablePaymentSchema
>;
export type AccountPayableQueryInput = z.infer<typeof accountPayableQuerySchema>;
