import { z } from 'zod';

export const activityParamsSchema = z.object({
  projectId: z.string().uuid(),
});

export const listActivitySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
});
