import { z } from 'zod';

const uuidSchema = z.string().uuid();

export const commentParamsSchema = z.object({
  projectId: uuidSchema,
  taskId: uuidSchema,
});

export const commentIdParamsSchema = z.object({
  projectId: uuidSchema,
  taskId: uuidSchema,
  commentId: uuidSchema,
});

export const createCommentSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

export const updateCommentSchema = createCommentSchema;

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
