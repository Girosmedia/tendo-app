import { z } from 'zod';

export const operationalExpensePaymentMethodEnum = z.enum([
  'CASH',
  'CARD',
  'TRANSFER',
  'OTHER',
]);

export const createOperationalExpenseSchema = z.object({
  title: z
    .string()
    .min(2, 'El nombre del egreso debe tener al menos 2 caracteres')
    .max(120, 'El nombre del egreso no puede superar 120 caracteres'),
  description: z
    .string()
    .max(2000, 'La descripción no puede superar 2000 caracteres')
    .optional()
    .nullable(),
  category: z
    .string()
    .max(80, 'La categoría no puede superar 80 caracteres')
    .optional()
    .nullable(),
  amount: z
    .number({ message: 'El monto es requerido' })
    .positive('El monto debe ser mayor a 0')
    .max(999999999, 'El monto es demasiado alto'),
  paymentMethod: operationalExpensePaymentMethodEnum.default('CASH'),
  expenseDate: z
    .string()
    .datetime('La fecha del egreso debe ser válida')
    .optional()
    .nullable(),
  cashRegisterId: z.string().optional().nullable(),
});

export const updateOperationalExpenseSchema = createOperationalExpenseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar',
  });

export const operationalExpenseQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  paymentMethod: operationalExpensePaymentMethodEnum.optional(),
  cashRegisterId: z.string().optional(),
});

export type CreateOperationalExpenseInput = z.infer<typeof createOperationalExpenseSchema>;
export type UpdateOperationalExpenseInput = z.infer<typeof updateOperationalExpenseSchema>;
export type OperationalExpenseQueryInput = z.infer<typeof operationalExpenseQuerySchema>;