import { NotificationType, TaskStatus, type Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { HttpError } from '../../utils/http-error.js';

export async function createNotification(input: {
  recipientId: string;
  actorId?: string | null;
  projectId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Prisma.InputJsonValue;
}) {
  if (input.recipientId === input.actorId && input.type !== NotificationType.DUE_DATE_REMINDER) {
    return null;
  }

  return prisma.notification.create({
    data: {
      recipientId: input.recipientId,
      actorId: input.actorId ?? null,
      projectId: input.projectId ?? null,
      type: input.type,
      title: input.title,
      message: input.message,
      metadata: input.metadata ?? undefined,
    },
  });
}

async function ensureDueDateReminderNotifications(userId: string) {
  const now = new Date();
  const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
      archivedAt: null,
      status: { not: TaskStatus.DONE },
      dueDate: { lte: soon },
    },
    select: { id: true, title: true, projectId: true, dueDate: true },
    take: 25,
  });

  for (const task of tasks) {
    const existing = await prisma.notification.findFirst({
      where: {
        recipientId: userId,
        type: NotificationType.DUE_DATE_REMINDER,
        metadata: { path: ['taskId'], equals: task.id },
        createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
      select: { id: true },
    });

    if (existing) continue;

    const isOverdue = task.dueDate ? task.dueDate.getTime() < now.getTime() : false;
    await createNotification({
      recipientId: userId,
      projectId: task.projectId,
      type: NotificationType.DUE_DATE_REMINDER,
      title: isOverdue ? 'Task overdue' : 'Task due soon',
      message: `${task.title} is ${isOverdue ? 'overdue' : 'due soon'}.`,
      metadata: { taskId: task.id, dueDate: task.dueDate?.toISOString() ?? null, reminderKind: isOverdue ? 'overdue' : 'upcoming' },
    });
  }
}

export async function listNotifications(userId: string, input: { page: number; pageSize: number }) {
  await ensureDueDateReminderNotifications(userId);
  const skip = (input.page - 1) * input.pageSize;
  const where = { recipientId: userId };
  const [items, total, unreadCount] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      include: {
        actor: { select: { id: true, name: true, email: true, avatarUrl: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: input.pageSize,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { recipientId: userId, readAt: null } }),
  ]);

  return {
    items,
    unreadCount,
    meta: { page: input.page, pageSize: input.pageSize, total, pageCount: Math.ceil(total / input.pageSize) },
  };
}

export async function markNotificationRead(userId: string, id: string) {
  const notification = await prisma.notification.findFirst({ where: { id, recipientId: userId }, select: { id: true } });
  if (!notification) throw new HttpError(404, 'Notification not found.');

  return prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({ where: { recipientId: userId, readAt: null }, data: { readAt: new Date() } });
  return { message: 'All notifications marked as read.' };
}
