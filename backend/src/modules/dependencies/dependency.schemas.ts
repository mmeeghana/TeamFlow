import { z } from 'zod';

const uuidSchema = z.string().uuid();

export const dependencyParamsSchema = z.object({
  projectId: uuidSchema,
  taskId: uuidSchema,
});

export const dependencyIdParamsSchema = dependencyParamsSchema.extend({
  relationId: uuidSchema,
});

export const createDependencySchema = z.object({
  taskId: uuidSchema,
  type: z.enum(['BLOCKS', 'BLOCKED_BY']),
});

export type CreateDependencyInput = z.infer<typeof createDependencySchema>;
