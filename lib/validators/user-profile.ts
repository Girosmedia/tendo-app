import { z } from 'zod';
import { AVATAR_OPTION_VALUES } from '@/lib/constants/avatar-options';

export const updateUserProfileSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    .max(100, { message: 'El nombre no puede exceder 100 caracteres' })
    .optional(),
  jobTitle: z
    .string()
    .max(100, { message: 'El cargo no puede exceder 100 caracteres' })
    .optional(),
  image: z
    .string()
    .url({ message: 'Avatar inválido' })
    .refine((value) => AVATAR_OPTION_VALUES.includes(value), {
      message: 'Debes elegir un avatar de las opciones disponibles',
    })
    .optional(),
});

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
