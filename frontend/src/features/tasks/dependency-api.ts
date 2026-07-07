import { api } from '../../lib/api';

export type DependencyTask = { id: string; title: string; status: string; priority: string; dueDate: string | null };
export type TaskDependency = { id: string; task: DependencyTask; createdAt: string };
export type TaskDependencies = { blockedBy: TaskDependency[]; blocks: TaskDependency[] };

export async function getTaskDependencies(projectId: string, taskId: string) {
  const response = await api.get<{ dependencies: TaskDependencies }>(`/projects/${projectId}/tasks/${taskId}/dependencies`);
  return response.data.dependencies;
}

export async function createTaskDependency(projectId: string, taskId: string, payload: { taskId: string; type: 'BLOCKS' | 'BLOCKED_BY' }) {
  const response = await api.post(`/projects/${projectId}/tasks/${taskId}/dependencies`, payload);
  return response.data;
}

export async function deleteTaskDependency(projectId: string, taskId: string, relationId: string) {
  const response = await api.delete<{ message: string }>(`/projects/${projectId}/tasks/${taskId}/dependencies/${relationId}`);
  return response.data;
}
