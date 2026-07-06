import type { ProjectUser } from '../projects/types';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  estimatedHours: number | null;
  projectId: string;
  creatorId: string | null;
  assigneeId: string | null;
  reporterId: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: ProjectUser | null;
  assignee: ProjectUser | null;
  reporter: ProjectUser | null;
};

export type TaskStats = {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  progress: number;
};

export type TasksResponse = {
  items: Task[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    pageCount: number;
  };
  stats: TaskStats;
};
