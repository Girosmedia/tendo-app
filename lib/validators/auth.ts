import { z } from 'zod';
import { validateRUT } from '@/lib/utils/rut-validator';

// ============================================
// SCHEMAS DE AUTENTICACIÓN
// ============================================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'El email es requerido' })
    .email({ message: 'Email inválido' }),
  password: z
    .string()
    .min(1, { message: 'La contraseña es requerida' })
    .min(8, { message: 'La contraseña debe tener al menos 8 caracteres' }),
});

export const registerServerSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'El nombre es requerido' })
    .min(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    .max(100, { message: 'El nombre no puede exceder 100 caracteres' }),
  email: z
    .string()
    .min(1, { message: 'El email es requerido' })
    .email({ message: 'Email inválido' }),
  password: z
    .string()
    .min(1, { message: 'La contraseña es requerida' })
    .min(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    .max(100, { message: 'La contraseña no puede exceder 100 caracteres' }),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, { message: 'El nombre es requerido' })
      .min(2, { message: 'El nombre debe tener al menos 2 caracteres' })
      .max(100, { message: 'El nombre no puede exceder 100 caracteres' }),
    email: z
      .string()
      .min(1, { message: 'El email es requerido' })
      .email({ message: 'Email inválido' }),
    password: z
      .string()
      .min(1, { message: 'La contraseña es requerida' })
      .min(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
      .max(100, { message: 'La contraseña no puede exceder 100 caracteres' }),
    confirmPassword: z
      .string()
      .min(1, { message: 'Debes confirmar la contraseña' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

// ============================================
// SCHEMAS DE ORGANIZACIÓN
// ============================================

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'El nombre de la empresa es requerido' })
    .min(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    .max(100, { message: 'El nombre no puede exceder 100 caracteres' }),
  rut: z
    .string()
    .min(1, { message: 'El RUT es requerido' })
    .regex(/^[\d.]+-[\dkK]$/, {
      message: 'Formato de RUT inválido. Use XX.XXX.XXX-X',
    })
    .refine((rut) => validateRUT(rut), {
      message: 'RUT inválido. Verifique el dígito verificador',
    }),
  logoUrl: z.string().url({ message: 'URL de logo inválida' }).optional(),
});

export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    .max(100, { message: 'El nombre no puede exceder 100 caracteres' })
    .optional(),
  logoUrl: z.string().url({ message: 'URL de logo inválida' }).optional().nullable(),
});

// ============================================
// TYPES (inferidos de los schemas)
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RegisterServerInput = z.infer<typeof registerServerSchema>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
