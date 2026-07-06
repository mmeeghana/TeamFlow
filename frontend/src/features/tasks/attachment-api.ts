import { api } from '../../lib/api';
import type { ProjectUser } from '../projects/types';

export type TaskAttachment = {
  id: string;
  taskId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedById: string | null;
  uploadedAt: string;
  updatedAt: string;
  uploadedBy: ProjectUser | null;
};

export async function getAttachments(projectId: string, taskId: string) {
  const response = await api.get<{ attachments: TaskAttachment[] }>(`/projects/${projectId}/tasks/${taskId}/attachments`);
  return response.data.attachments;
}

export async function uploadAttachment(
  projectId: string,
  taskId: string,
  file: File,
  onProgress?: (progress: number) => void,
) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<{ attachment: TaskAttachment }>(
    `/projects/${projectId}/tasks/${taskId}/attachments`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (!event.total) return;
        onProgress?.(Math.round((event.loaded * 100) / event.total));
      },
    },
  );

  return response.data.attachment;
}

export async function deleteAttachment(projectId: string, taskId: string, attachmentId: string) {
  const response = await api.delete<{ message: string }>(`/projects/${projectId}/tasks/${taskId}/attachments/${attachmentId}`);
  return response.data;
}

export async function downloadAttachment(projectId: string, taskId: string, attachmentId: string) {
  const response = await api.get<Blob>(`/projects/${projectId}/tasks/${taskId}/attachments/${attachmentId}/download`, {
    responseType: 'blob',
  });
  return response.data;
}

