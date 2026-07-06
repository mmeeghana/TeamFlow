import { api } from '../../lib/api';
import type { ProjectUser } from '../projects/types';

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
  actor: ProjectUser | null;
  project: { id: string; name: string } | null;
};

export type NotificationsResponse = {
  items: NotificationItem[];
  unreadCount: number;
  meta: { page: number; pageSize: number; total: number; pageCount: number };
};

export async function getNotifications(page = 1, pageSize = 10) {
  const response = await api.get<NotificationsResponse>('/notifications', { params: { page, pageSize } });
  return response.data;
}

export async function markNotificationRead(id: string) {
  const response = await api.patch<{ notification: NotificationItem }>(`/notifications/${id}/read`);
  return response.data.notification;
}

export async function markAllNotificationsRead() {
  const response = await api.patch<{ message: string }>('/notifications/read-all');
  return response.data;
}
