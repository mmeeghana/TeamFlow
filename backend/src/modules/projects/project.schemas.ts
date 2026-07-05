import { z } from 'zod';

const uuidSchema = z.string().uuid();
const themeColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Theme color must be a hex color.');

export const projectIdParamsSchema = z.object({
  projectId: uuidSchema,
});

export const listProjectsSchema = z.object({
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(12),
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional().nullable(),
  themeColor: themeColorSchema.default('#22d3ee'),
});

export const updateProjectSchema = createProjectSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one field is required.',
);

export const inviteMemberSchema = z.object({
  email: z.string().trim().email().max(255).toLowerCase(),
});

export const memberParamsSchema = z.object({
  projectId: uuidSchema,
  userId: uuidSchema,
});

export type ListProjectsInput = z.infer<typeof listProjectsSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
