import { api } from '../../lib/api';
import type { ProjectUser } from '../projects/types';

export type ActivityLog = {
  id: string;
  action: string;
  actorId: string | null;
  taskId: string | null;
  projectId: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: ProjectUser | null;
  task: { id: string; title: string } | null;
};

export type ActivityResponse = {
  items: ActivityLog[];
  meta: { page: number; pageSize: number; total: number; pageCount: number };
};

export async function getProjectActivity(projectId: string, page = 1, pageSize = 20) {
  const response = await api.get<ActivityResponse>(`/projects/${projectId}/activity`, { params: { page, pageSize } });
  return response.data;
}

export async function exportProjectActivity(projectId: string) {
  const response = await api.get<{ items: ActivityLog[] }>(`/projects/${projectId}/activity/export`);
  return response.data.items;
}
