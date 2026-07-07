import { api } from '../../lib/api';
import type { Task, TaskPriority, TasksResponse, TaskStatus } from './types';

export type TaskPayload = {
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  estimatedHours?: number | null;
  assigneeId?: string | null;
};

export async function getTasks(
  projectId: string,
  params: {
    search?: string;
    status?: TaskStatus | '';
    priority?: TaskPriority | '';
    assigneeId?: string;
    page?: number;
    pageSize?: number;
  },
) {
  const response = await api.get<TasksResponse>(`/projects/${projectId}/tasks`, { params });
  return response.data;
}

export async function createTask(projectId: string, payload: TaskPayload) {
  const response = await api.post<{ task: Task }>(`/projects/${projectId}/tasks`, payload);
  return response.data.task;
}

export async function updateTask(projectId: string, taskId: string, payload: TaskPayload) {
  const response = await api.patch<{
    task: Task;
    warning?: {
      message: string;
      blockers: unknown[];
    };
  }>(
    `/projects/${projectId}/tasks/${taskId}`,
    payload,
  );

  return response.data;
}

export async function deleteTask(projectId: string, taskId: string) {
  const response = await api.delete<{ message: string }>(`/projects/${projectId}/tasks/${taskId}`);
  return response.data;
}
export type TaskReorderItem = {
  id: string;
  status: TaskStatus;
  position: number;
};

export async function moveTask(projectId: string, taskId: string, payload: { status: TaskStatus; position: number }) {
  const response = await api.patch<{ task: Task }>(`/projects/${projectId}/tasks/${taskId}/move`, payload);
  return response.data.task;
}

export async function reorderTasks(projectId: string, tasks: TaskReorderItem[]) {
  const response = await api.patch<{
    message: string;
    warnings?: Array<{
      taskId: string;
      warning: {
        message: string;
        blockers: {
          id: string;
          title: string;
          status: string;
        }[];
      };
    }>;
  }>(`/projects/${projectId}/tasks/reorder`, { tasks });

  return response.data;
}
export async function updateTaskDueDate(projectId: string, taskId: string, dueDate: string | null) {
  const response = await api.patch<{ task: Task }>(`/projects/${projectId}/tasks/${taskId}/date`, { dueDate });
  return response.data.task;
}


