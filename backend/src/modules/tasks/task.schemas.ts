import { z } from 'zod';

const uuidSchema = z.string().uuid();

export const taskStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']);
export const taskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const projectTaskParamsSchema = z.object({
  projectId: uuidSchema,
});

export const taskParamsSchema = z.object({
  projectId: uuidSchema,
  taskId: uuidSchema,
});

export const listTasksSchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assigneeId: uuidSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(12),
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).optional().nullable(),
  status: taskStatusSchema.default('TODO'),
  priority: taskPrioritySchema.default('MEDIUM'),
  dueDate: z.coerce.date().optional().nullable(),
  estimatedHours: z.coerce.number().min(0).max(10000).optional().nullable(),
  assigneeId: uuidSchema.optional().nullable(),
  reporterId: uuidSchema.optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one field is required.',
);

export type ListTasksInput = z.infer<typeof listTasksSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
