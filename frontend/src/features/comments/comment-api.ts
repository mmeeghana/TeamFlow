import { api } from '../../lib/api';
import type { ProjectUser } from '../projects/types';

export type Comment = {
  id: string;
  content: string;
  taskId: string;
  authorId: string | null;
  mentionedUserIds: string[];
  createdAt: string;
  updatedAt: string;
  author: ProjectUser | null;
};

export async function getComments(projectId: string, taskId: string) {
  const response = await api.get<{ comments: Comment[] }>(`/projects/${projectId}/tasks/${taskId}/comments`);
  return response.data.comments;
}

export async function createComment(projectId: string, taskId: string, content: string) {
  const response = await api.post<{ comment: Comment }>(`/projects/${projectId}/tasks/${taskId}/comments`, { content });
  return response.data.comment;
}

export async function updateComment(projectId: string, taskId: string, commentId: string, content: string) {
  const response = await api.patch<{ comment: Comment }>(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`, { content });
  return response.data.comment;
}

export async function deleteComment(projectId: string, taskId: string, commentId: string) {
  const response = await api.delete<{ message: string }>(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`);
  return response.data;
}
