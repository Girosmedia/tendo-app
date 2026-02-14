import { z } from "zod";

// ============================================
// CREDIT SCHEMAS
// ============================================

/**
 * Esquema para crear un nuevo crédito
 */
export const createCreditSchema = z.object({
  customerId: z.string().cuid("ID de cliente inválido"),
  documentId: z.string().cuid("ID de documento inválido").optional().nullable(),
  amount: z
    .number()
    .positive("El monto debe ser mayor a 0")
    .max(100000000, "El monto es demasiado alto"),
  dueDate: z.coerce.date({
    message: "Fecha de vencimiento inválida",
  }),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreateCreditInput = z.infer<typeof createCreditSchema>;

/**
 * Esquema para actualizar un crédito existente
 */
export const updateCreditSchema = z.object({
  dueDate: z.coerce.date().optional(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "PAID", "CANCELED", "OVERDUE"]).optional(),
});

export type UpdateCreditInput = z.infer<typeof updateCreditSchema>;

/**
 * Esquema para query params de búsqueda de créditos
 */
export const creditQuerySchema = z.object({
  customerId: z.string().cuid().optional(),
  status: z.enum(["ACTIVE", "PAID", "CANCELED", "OVERDUE"]).optional(),
  overdue: z
    .string()
    .optional()
    .transform((val) => val === "true"),
});

export type CreditQueryParams = z.infer<typeof creditQuerySchema>;

// ============================================
// PAYMENT SCHEMAS
// ============================================

/**
 * Esquema para registrar un pago a un crédito
 */
export const createPaymentSchema = z.object({
  creditId: z.string().cuid("ID de crédito inválido"),
  amount: z
    .number()
    .positive("El monto debe ser mayor a 0")
    .max(100000000, "El monto es demasiado alto"),
  paymentMethod: z.enum(["CASH", "CARD", "TRANSFER", "CHECK", "OTHER"], {
    message: "El método de pago es requerido",
  }),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  paidAt: z.coerce
    .date({
      message: "Fecha inválida",
    })
    .optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

/**
 * Esquema para query params de búsqueda de pagos
 */
export const paymentQuerySchema = z.object({
  customerId: z.string().cuid().optional(),
  creditId: z.string().cuid().optional(),
  paymentMethod: z.enum(["CASH", "CARD", "TRANSFER", "CHECK", "OTHER"]).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type PaymentQueryParams = z.infer<typeof paymentQuerySchema>;

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Valida que el monto del pago no exceda el saldo del crédito
 */
export function validatePaymentAmount(paymentAmount: number, creditBalance: number): boolean {
  return paymentAmount > 0 && paymentAmount <= creditBalance;
}

/**
 * Valida que el cliente no exceda su límite de crédito
 */
export function validateCreditLimit(
  currentDebt: number,
  newCreditAmount: number,
  creditLimit: number | null
): { valid: boolean; message?: string } {
  if (!creditLimit) {
    return {
      valid: false,
      message: "El cliente no tiene límite de crédito configurado",
    };
  }

  const totalDebt = currentDebt + newCreditAmount;

  if (totalDebt > creditLimit) {
    return {
      valid: false,
      message: `El crédito excede el límite. Límite: $${creditLimit.toLocaleString("es-CL")}, Deuda actual: $${currentDebt.toLocaleString("es-CL")}, Nueva deuda: $${totalDebt.toLocaleString("es-CL")}`,
    };
  }

  return { valid: true };
}
