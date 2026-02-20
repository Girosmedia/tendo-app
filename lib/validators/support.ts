import { z } from 'zod';

export const supportTicketPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export const supportTicketStatusEnum = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);

export const createSupportTicketSchema = z.object({
  subject: z.string().min(4, 'El asunto debe tener al menos 4 caracteres').max(120),
  message: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres').max(5000),
  priority: supportTicketPriorityEnum.default('MEDIUM'),
  category: z.string().max(60).optional().nullable(),
});

export const updateSupportTicketSchema = z.object({
  status: supportTicketStatusEnum.optional(),
  adminReply: z.string().max(5000).optional().nullable(),
  priority: supportTicketPriorityEnum.optional(),
});

export type CreateSupportTicketInput = z.infer<typeof createSupportTicketSchema>;
export type UpdateSupportTicketInput = z.infer<typeof updateSupportTicketSchema>;
