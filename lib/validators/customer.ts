import { z } from 'zod';
import { validateRUT } from '@/lib/rut-validator';

// Schema para crear cliente
export const createCustomerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200),
  rut: z
    .string()
    .optional()
    .refine((val) => !val || validateRUT(val), {
      message: 'RUT inválido',
    }),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  company: z.string().optional(),
  creditLimit: z
    .number()
    .nonnegative('El límite de crédito debe ser positivo')
    .optional()
    .nullable(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

// Schema para actualizar cliente
export const updateCustomerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200).optional(),
  rut: z
    .string()
    .optional()
    .refine((val) => !val || validateRUT(val), {
      message: 'RUT inválido',
    }),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  creditLimit: z
    .number()
    .nonnegative('El límite de crédito debe ser positivo')
    .optional()
    .nullable(),
  currentDebt: z
    .number()
    .nonnegative('La deuda debe ser positiva')
    .optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// Tipos TypeScript derivados
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
