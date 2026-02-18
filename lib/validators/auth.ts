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

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'El email es requerido' })
    .email({ message: 'Email inválido' }),
});

export const resetPasswordSchema = z
  .object({
    email: z
      .string()
      .min(1, { message: 'El email es requerido' })
      .email({ message: 'Email inválido' }),
    token: z
      .string()
      .min(1, { message: 'El token es requerido' }),
    password: z
      .string()
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

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: 'La contraseña actual es requerida' }),
    newPassword: z
      .string()
      .min(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres' })
      .max(100, { message: 'La nueva contraseña no puede exceder 100 caracteres' }),
    confirmNewPassword: z
      .string()
      .min(1, { message: 'Debes confirmar la nueva contraseña' }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmNewPassword'],
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
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
