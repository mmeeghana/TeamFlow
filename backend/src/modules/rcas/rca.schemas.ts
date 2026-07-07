import { z } from 'zod';

const uuidSchema = z.string().uuid();

export const rcaParamsSchema = z.object({ projectId: uuidSchema });
export const rcaIdParamsSchema = z.object({ projectId: uuidSchema, rcaId: uuidSchema });
export const reviewIdParamsSchema = z.object({ projectId: uuidSchema, rcaId: uuidSchema, reviewId: uuidSchema });

const sectionSchema = z.object({
  title: z.enum(['Timeline', 'Contributing Factors', 'Corrective Actions', 'Preventive Actions']),
  content: z.string().trim().max(5000).default(''),
});

export const createRcaSchema = z.object({
  taskId: uuidSchema,
  title: z.string().trim().min(2).max(160),
  summary: z.string().trim().max(2000).optional().nullable(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  sections: z.array(sectionSchema).length(4),
});

export const updateRcaSchema = createRcaSchema.partial().refine((value) => Object.keys(value).length > 0, 'At least one field is required.');
export const assignReviewersSchema = z.object({ reviewerIds: z.array(uuidSchema).min(1).max(20) });
export const submitReviewSchema = z.object({ decision: z.enum(['APPROVED', 'REJECTED']), comment: z.string().trim().min(1).max(2000) });

export type CreateRcaInput = z.infer<typeof createRcaSchema>;
export type UpdateRcaInput = z.infer<typeof updateRcaSchema>;
export type AssignReviewersInput = z.infer<typeof assignReviewersSchema>;
export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
