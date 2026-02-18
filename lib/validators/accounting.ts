import { z } from 'zod';

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
const treasuryCategoryEnum = z.enum([
  'CAPITAL_INJECTION',
  'OWNER_WITHDRAWAL',
  'LOAN_IN',
  'LOAN_OUT',
  'ACCOUNT_PAYABLE_PAYMENT',
  'OTHER',
]);
const treasurySourceEnum = z.enum(['CASH', 'BANK', 'TRANSFER', 'OTHER']);

export const accountingMonthlyQuerySchema = z.object({
  month: z
    .string()
    .regex(monthRegex, 'El parámetro month debe tener formato YYYY-MM')
    .optional(),
  treasuryCategory: treasuryCategoryEnum.optional(),
  treasurySource: treasurySourceEnum.optional(),
});

export const accountingBalanceQuerySchema = z.object({
  month: z
    .string()
    .regex(monthRegex, 'El parámetro month debe tener formato YYYY-MM')
    .optional(),
  treasuryCategory: treasuryCategoryEnum.optional(),
  treasurySource: treasurySourceEnum.optional(),
});

export const accountingSeriesQuerySchema = z.object({
  months: z.coerce.number().int().min(3).max(24).default(6),
  treasuryCategory: treasuryCategoryEnum.optional(),
  treasurySource: treasurySourceEnum.optional(),
});

export type AccountingMonthlyQueryInput = z.infer<typeof accountingMonthlyQuerySchema>;
export type AccountingBalanceQueryInput = z.infer<typeof accountingBalanceQuerySchema>;
export type AccountingSeriesQueryInput = z.infer<typeof accountingSeriesQuerySchema>;
