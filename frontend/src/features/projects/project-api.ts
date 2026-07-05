import { api } from '../../lib/api';
import type { Project, ProjectsResponse } from './types';

export type ProjectPayload = {
  name: string;
  description?: string | null;
  themeColor: string;
};

export async function getProjects(params: { search?: string; page?: number; pageSize?: number }) {
  const response = await api.get<ProjectsResponse>('/projects', { params });
  return response.data;
}

export async function getProject(projectId: string) {
  const response = await api.get<{ project: Project }>(`/projects/${projectId}`);
  return response.data.project;
}

export async function createProject(payload: ProjectPayload) {
  const response = await api.post<{ project: Project }>('/projects', payload);
  return response.data.project;
}

export async function updateProject(projectId: string, payload: ProjectPayload) {
  const response = await api.patch<{ project: Project }>(`/projects/${projectId}`, payload);
  return response.data.project;
}

export async function deleteProject(projectId: string) {
  const response = await api.delete<{ message: string }>(`/projects/${projectId}`);
  return response.data;
}

export async function inviteProjectMember(projectId: string, email: string) {
  const response = await api.post(`/projects/${projectId}/members`, { email });
  return response.data;
}

export async function removeProjectMember(projectId: string, userId: string) {
  const response = await api.delete<{ message: string }>(`/projects/${projectId}/members/${userId}`);
  return response.data;
}
