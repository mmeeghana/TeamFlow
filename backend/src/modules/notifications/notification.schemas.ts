import { z } from 'zod';

export const listNotificationsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
});

export const notificationParamsSchema = z.object({
  id: z.string().uuid(),
});
