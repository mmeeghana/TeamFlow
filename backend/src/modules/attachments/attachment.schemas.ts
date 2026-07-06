import { z } from 'zod';

const uuidSchema = z.string().uuid();

export const attachmentParamsSchema = z.object({
  projectId: uuidSchema,
  taskId: uuidSchema,
});

export const attachmentIdParamsSchema = z.object({
  projectId: uuidSchema,
  taskId: uuidSchema,
  attachmentId: uuidSchema,
});

export const uploadFileSchema = z.object({
  filename: z.string().min(1),
  originalname: z.string().min(1),
  mimetype: z.string().min(1),
  size: z.number().int().positive().max(10 * 1024 * 1024),
});

export type UploadFileInput = z.infer<typeof uploadFileSchema>;
