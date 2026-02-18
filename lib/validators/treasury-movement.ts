import { z } from 'zod';

export const treasuryMovementTypeEnum = z.enum(['INFLOW', 'OUTFLOW']);

export const treasuryMovementCategoryEnum = z.enum([
  'CAPITAL_INJECTION',
  'OWNER_WITHDRAWAL',
  'LOAN_IN',
  'LOAN_OUT',
  'ACCOUNT_PAYABLE_PAYMENT',
  'OTHER',
]);

export const treasuryMovementSourceEnum = z.enum(['CASH', 'BANK', 'TRANSFER', 'OTHER']);

export const createTreasuryMovementSchema = z.object({
  type: treasuryMovementTypeEnum,
  category: treasuryMovementCategoryEnum.default('OTHER'),
  source: treasuryMovementSourceEnum.default('OTHER'),
  title: z.string().min(2).max(120),
  description: z.string().max(4000).optional().nullable(),
  reference: z.string().max(120).optional().nullable(),
  amount: z.number().positive(),
  occurredAt: z.string().datetime().optional().nullable(),
  accountPayableId: z.string().optional().nullable(),
});

export const treasuryMovementQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
  type: treasuryMovementTypeEnum.optional(),
  category: treasuryMovementCategoryEnum.optional(),
});

export const updateTreasuryMovementSchema = createTreasuryMovementSchema
  .omit({ accountPayableId: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar',
  });

export type CreateTreasuryMovementInput = z.infer<typeof createTreasuryMovementSchema>;
export type TreasuryMovementQueryInput = z.infer<typeof treasuryMovementQuerySchema>;
export type UpdateTreasuryMovementInput = z.infer<typeof updateTreasuryMovementSchema>;
