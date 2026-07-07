import { api } from '../../lib/api';
import type { NotificationItem } from '../notifications/notification-api';
import type { ProjectUser } from '../projects/types';

export type DashboardTask = {
  id: string;
  title: string;
  dueDate: string | null;
  status: string;
  priority: string;
  updatedAt?: string;
  project: { id: string; name: string };
};

export type DashboardActivity = {
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
  project: { id: string; name: string };
};

export type DashboardOverview = {
  totalProjects: number;
  totalActiveProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  assignedToMe: number;
  tasksCreatedThisWeek: number;
  unreadNotifications: number;
  recentActivity: DashboardActivity[];
  upcomingDueTasks: DashboardTask[];
  recentlyAssignedTasks: DashboardTask[];
  recentNotifications: NotificationItem[];
};

export type DashboardCharts = {
  tasksByStatus: Array<{ status: string; count: number }>;
  tasksByPriority: Array<{ priority: string; count: number }>;
  completedPerWeek: Array<{ label: string; count: number }>;
  projectsCreatedPerMonth: Array<{ label: string; count: number }>;
  memberWorkload: Array<{ assigneeId: string | null; assignee: ProjectUser | null; count: number }>;
};

export async function getDashboardOverview() {
  const response = await api.get<{ overview: DashboardOverview }>('/dashboard/overview');
  return response.data.overview;
}

export async function getDashboardCharts() {
  const response = await api.get<{ charts: DashboardCharts }>('/dashboard/charts');
  return response.data.charts;
}
