import { z } from 'zod';

/**
 * Esquema para abrir una nueva caja
 */
export const openCashRegisterSchema = z.object({
  openingCash: z
    .number({ message: 'El fondo inicial es requerido' })
    .nonnegative({ message: 'El fondo inicial no puede ser negativo' })
    .finite(),
  notes: z
    .string()
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .optional(),
});

export type OpenCashRegisterInput = z.infer<typeof openCashRegisterSchema>;

/**
 * Esquema para cerrar una caja existente
 */
export const closeCashRegisterSchema = z.object({
  actualCash: z
    .number({ message: 'El conteo de efectivo es requerido' })
    .nonnegative({ message: 'El efectivo contado no puede ser negativo' })
    .finite(),
  notes: z
    .string()
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .optional(),
});

export type CloseCashRegisterInput = z.infer<typeof closeCashRegisterSchema>;

/**
 * Esquema para query params de listado de cajas
 */
export const listCashRegistersSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type ListCashRegistersQuery = z.infer<typeof listCashRegistersSchema>;
