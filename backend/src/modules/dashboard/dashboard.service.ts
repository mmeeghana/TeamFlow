import { Prisma, TaskPriority, TaskStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

function startOfWeek(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function formatWeekLabel(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function getProjectWhere(userId: string): Prisma.ProjectWhereInput {
  return {
    OR: [{ ownerId: userId }, { members: { some: { userId } } }],
  };
}


type GroupCount = true | { id?: number; _all?: number } | undefined;

function getGroupCount(count: GroupCount) {
  if (!count || count === true) return 0;
  return count.id ?? count._all ?? 0;
}
function getTaskWhere(userId: string): Prisma.TaskWhereInput {
  return {
    project: getProjectWhere(userId),
    archivedAt: null,
  };
}

export async function getDashboardOverview(userId: string) {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const nextWeek = addDays(weekStart, 7);
  const projectWhere = getProjectWhere(userId);
  const taskWhere = getTaskWhere(userId);

  const [
    totalProjects,
    totalActiveProjects,
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
    assignedToMe,
    tasksCreatedThisWeek,
    unreadNotifications,
    recentActivity,
    upcomingDueTasks,
    recentlyAssignedTasks,
    recentNotifications,
  ] = await prisma.$transaction([
    prisma.project.count({ where: projectWhere }),
    prisma.project.count({ where: { ...projectWhere, archivedAt: null } }),
    prisma.task.count({ where: taskWhere }),
    prisma.task.count({ where: { ...taskWhere, status: TaskStatus.DONE } }),
    prisma.task.count({ where: { ...taskWhere, status: { notIn: [TaskStatus.DONE, TaskStatus.ARCHIVED] } } }),
    prisma.task.count({ where: { ...taskWhere, dueDate: { lt: now }, status: { notIn: [TaskStatus.DONE, TaskStatus.ARCHIVED] } } }),
    prisma.task.count({ where: { ...taskWhere, assigneeId: userId } }),
    prisma.task.count({ where: { ...taskWhere, createdAt: { gte: weekStart, lt: nextWeek } } }),
    prisma.notification.count({ where: { recipientId: userId, readAt: null } }),
    prisma.activityLog.findMany({
      where: { project: projectWhere },
      include: {
        actor: { select: { id: true, name: true, email: true, avatarUrl: true } },
        task: { select: { id: true, title: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.task.findMany({
      where: { ...taskWhere, dueDate: { gte: now }, status: { notIn: [TaskStatus.DONE, TaskStatus.ARCHIVED] } },
      select: { id: true, title: true, dueDate: true, status: true, priority: true, project: { select: { id: true, name: true } } },
      orderBy: { dueDate: 'asc' },
      take: 6,
    }),
    prisma.task.findMany({
      where: { ...taskWhere, assigneeId: userId },
      select: { id: true, title: true, dueDate: true, status: true, priority: true, updatedAt: true, project: { select: { id: true, name: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 6,
    }),
    prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
  ]);

  return {
    totalProjects,
    totalActiveProjects,
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
    assignedToMe,
    tasksCreatedThisWeek,
    unreadNotifications,
    recentActivity,
    upcomingDueTasks,
    recentlyAssignedTasks,
    recentNotifications,
  };
}

export async function getDashboardCharts(userId: string) {
  const now = new Date();
  const firstWeek = addDays(startOfWeek(now), -7 * 7);
  const firstMonth = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const taskWhere = getTaskWhere(userId);
  const projectWhere = getProjectWhere(userId);

  const [tasksByStatus, tasksByPriority, completedTasks, projectsCreated, workloadGroups] = await prisma.$transaction([
    prisma.task.groupBy({ by: ['status'], where: taskWhere, _count: { id: true }, orderBy: { status: 'asc' } }),
    prisma.task.groupBy({ by: ['priority'], where: taskWhere, _count: { id: true }, orderBy: { priority: 'asc' } }),
    prisma.task.findMany({
      where: { ...taskWhere, status: TaskStatus.DONE, completedAt: { gte: firstWeek } },
      select: { completedAt: true },
    }),
    prisma.project.findMany({
      where: { ...projectWhere, createdAt: { gte: firstMonth } },
      select: { createdAt: true },
    }),
    prisma.task.groupBy({
      by: ['assigneeId'],
      where: { ...taskWhere, assigneeId: { not: null }, status: { notIn: [TaskStatus.DONE, TaskStatus.ARCHIVED] } },
      _count: { id: true },
      orderBy: { _count: { assigneeId: 'desc' } },
      take: 8,
    }),
  ]);

  const weeklyBuckets = Array.from({ length: 8 }, (_, index) => {
    const start = addDays(firstWeek, index * 7);
    const end = addDays(start, 7);
    return { label: formatWeekLabel(start), start, end, count: 0 };
  });

  completedTasks.forEach((task) => {
    if (!task.completedAt) return;
    const bucket = weeklyBuckets.find((item) => task.completedAt! >= item.start && task.completedAt! < item.end);
    if (bucket) bucket.count += 1;
  });

  const monthlyBuckets = Array.from({ length: 12 }, (_, index) => {
    const start = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + index, 1);
    const end = addMonths(start, 1);
    return { label: formatMonthLabel(start), start, end, count: 0 };
  });

  projectsCreated.forEach((project) => {
    const bucket = monthlyBuckets.find((item) => project.createdAt >= item.start && project.createdAt < item.end);
    if (bucket) bucket.count += 1;
  });

  const assigneeIds = workloadGroups.flatMap((group) => (group.assigneeId ? [group.assigneeId] : []));
  const assignees = await prisma.user.findMany({
    where: { id: { in: assigneeIds } },
    select: { id: true, name: true, email: true, avatarUrl: true },
  });
  const assigneeById = new Map(assignees.map((assignee) => [assignee.id, assignee]));

  return {
    tasksByStatus: Object.values(TaskStatus).map((status) => ({
      status,
      count: getGroupCount(tasksByStatus.find((item) => item.status === status)?._count),
    })),
    tasksByPriority: Object.values(TaskPriority).map((priority) => ({
      priority,
      count: getGroupCount(tasksByPriority.find((item) => item.priority === priority)?._count),
    })),
    completedPerWeek: weeklyBuckets.map(({ label, count }) => ({ label, count })),
    projectsCreatedPerMonth: monthlyBuckets.map(({ label, count }) => ({ label, count })),
    memberWorkload: workloadGroups.map((group) => ({
      assigneeId: group.assigneeId,
      assignee: group.assigneeId ? assigneeById.get(group.assigneeId) ?? null : null,
      count: getGroupCount(group._count),
    })),
  };
}


