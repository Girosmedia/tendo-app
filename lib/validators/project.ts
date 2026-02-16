import { z } from 'zod';

export const ProjectStatusEnum = z.enum([
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
]);

export const createProjectSchema = z.object({
  quoteId: z.string().optional().nullable(),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(120),
  description: z.string().max(5000).optional().nullable(),
  budget: z.number().nonnegative('El presupuesto no puede ser negativo').optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(5000).optional().nullable(),
  status: ProjectStatusEnum.optional(),
  budget: z.number().nonnegative().optional().nullable(),
  actualCost: z.number().nonnegative().optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export const convertQuoteToProjectSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(5000).optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export const createProjectExpenseSchema = z.object({
  milestoneId: z.string().optional().nullable(),
  description: z
    .string()
    .min(2, 'La descripción debe tener al menos 2 caracteres')
    .max(180),
  category: z.string().max(80).optional().nullable(),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  expenseDate: z.string().datetime().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export const updateProjectExpenseSchema = z.object({
  milestoneId: z.string().optional().nullable(),
  description: z
    .string()
    .min(2, 'La descripción debe tener al menos 2 caracteres')
    .max(180)
    .optional(),
  category: z.string().max(80).optional().nullable(),
  amount: z.number().positive('El monto debe ser mayor a 0').optional(),
  expenseDate: z.string().datetime().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export const createProjectMilestoneSchema = z.object({
  title: z.string().min(2, 'El título debe tener al menos 2 caracteres').max(140),
  description: z.string().max(5000).optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  estimatedCost: z.number().nonnegative('El costo estimado no puede ser negativo').optional().nullable(),
});

export const updateProjectMilestoneSchema = z.object({
  title: z.string().min(2).max(140).optional(),
  description: z.string().max(5000).optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  estimatedCost: z.number().nonnegative().optional().nullable(),
  isCompleted: z.boolean().optional(),
});

export const createProjectResourceSchema = z.object({
  milestoneId: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
  sku: z.string().max(120).optional().nullable(),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(180),
  unit: z.string().min(1).max(40).optional(),
  quantity: z.number().positive('La cantidad debe ser mayor a 0'),
  consumedQuantity: z.number().nonnegative('La cantidad consumida no puede ser negativa').optional(),
  unitCost: z.number().nonnegative('El costo unitario no puede ser negativo'),
  notes: z.string().max(5000).optional().nullable(),
});

export const updateProjectResourceSchema = z.object({
  milestoneId: z.string().optional().nullable(),
  name: z.string().min(2).max(180).optional(),
  unit: z.string().min(1).max(40).optional(),
  quantity: z.number().positive().optional(),
  consumedQuantity: z.number().nonnegative().optional(),
  unitCost: z.number().nonnegative().optional(),
  notes: z.string().max(5000).optional().nullable(),
});

export type ProjectStatus = z.infer<typeof ProjectStatusEnum>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ConvertQuoteToProjectInput = z.infer<typeof convertQuoteToProjectSchema>;
export type CreateProjectExpenseInput = z.infer<typeof createProjectExpenseSchema>;
export type UpdateProjectExpenseInput = z.infer<typeof updateProjectExpenseSchema>;
export type CreateProjectMilestoneInput = z.infer<typeof createProjectMilestoneSchema>;
export type UpdateProjectMilestoneInput = z.infer<typeof updateProjectMilestoneSchema>;
export type CreateProjectResourceInput = z.infer<typeof createProjectResourceSchema>;
export type UpdateProjectResourceInput = z.infer<typeof updateProjectResourceSchema>;
