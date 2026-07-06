import { Prisma, TaskStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { HttpError } from '../../utils/http-error.js';
import type {
  CreateTaskInput,
  ListTasksInput,
  MoveTaskInput,
  ReorderTasksInput,
  UpdateTaskInput,
} from './task.schemas.js';

const taskInclude = {
  createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
  assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
  reporter: { select: { id: true, name: true, email: true, avatarUrl: true } },
} satisfies Prisma.TaskInclude;

async function getProjectAccess(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    select: { id: true, ownerId: true },
  });

  if (!project) {
    throw new HttpError(404, 'Project not found.');
  }

  return project;
}

async function assertUsersAreProjectMembers(projectId: string, userIds: Array<string | null | undefined>) {
  const ids = [...new Set(userIds.filter(Boolean))] as string[];

  if (ids.length === 0) {
    return;
  }

  const count = await prisma.projectMember.count({
    where: {
      projectId,
      userId: { in: ids },
    },
  });

  if (count !== ids.length) {
    throw new HttpError(400, 'Assignee and reporter must be project members.');
  }
}

export async function listProjectTasks(userId: string, projectId: string, input: ListTasksInput) {
  await getProjectAccess(userId, projectId);

  const where: Prisma.TaskWhereInput = {
    projectId,
    archivedAt: null,
    ...(input.search
      ? { title: { contains: input.search, mode: Prisma.QueryMode.insensitive } }
      : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.priority ? { priority: input.priority } : {}),
    ...(input.assigneeId ? { assigneeId: input.assigneeId } : {}),
  };
  const skip = (input.page - 1) * input.pageSize;

  const [items, total, completed, overdue] = await prisma.$transaction([
    prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: [{ status: 'asc' }, { position: 'asc' }, { dueDate: 'asc' }, { updatedAt: 'desc' }],
      skip,
      take: input.pageSize,
    }),
    prisma.task.count({ where }),
    prisma.task.count({ where: { projectId, archivedAt: null, status: TaskStatus.DONE } }),
    prisma.task.count({
      where: {
        projectId,
        archivedAt: null,
        dueDate: { lt: new Date() },
        status: { not: TaskStatus.DONE },
      },
    }),
  ]);

  const projectTotal = await prisma.task.count({ where: { projectId, archivedAt: null } });
  const pending = Math.max(projectTotal - completed, 0);

  return {
    items,
    meta: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      pageCount: Math.ceil(total / input.pageSize),
    },
    stats: {
      total: projectTotal,
      completed,
      pending,
      overdue,
      progress: projectTotal === 0 ? 0 : Math.round((completed / projectTotal) * 100),
    },
  };
}

export async function getTask(userId: string, projectId: string, taskId: string) {
  await getProjectAccess(userId, projectId);

  const task = await prisma.task.findFirst({
    where: { id: taskId, projectId },
    include: taskInclude,
  });

  if (!task) {
    throw new HttpError(404, 'Task not found.');
  }

  return task;
}

export async function createTask(userId: string, projectId: string, input: CreateTaskInput) {
  await getProjectAccess(userId, projectId);
  await assertUsersAreProjectMembers(projectId, [input.assigneeId, input.reporterId ?? userId]);

  return prisma.task.create({
    data: {
      projectId,
      title: input.title,
      description: input.description || null,
      status: input.status,
      priority: input.priority,
      dueDate: input.dueDate ?? null,
      estimatedHours: input.estimatedHours ?? null,
      creatorId: userId,
      assigneeId: input.assigneeId ?? null,
      reporterId: input.reporterId ?? userId,
      position: await prisma.task.count({ where: { projectId, status: input.status, archivedAt: null } }),
    },
    include: taskInclude,
  });
}

export async function updateTask(userId: string, projectId: string, taskId: string, input: UpdateTaskInput) {
  await getProjectAccess(userId, projectId);
  await assertUsersAreProjectMembers(projectId, [input.assigneeId, input.reporterId]);

  const existingTask = await prisma.task.findFirst({
    where: { id: taskId, projectId },
    select: { id: true },
  });

  if (!existingTask) {
    throw new HttpError(404, 'Task not found.');
  }

  return prisma.task.update({
    where: { id: taskId },
    data: {
      ...(input.title ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description || null } : {}),
      ...(input.status ? { status: input.status, completedAt: input.status === 'DONE' ? new Date() : null } : {}),
      ...(input.priority ? { priority: input.priority } : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate ?? null } : {}),
      ...(input.estimatedHours !== undefined ? { estimatedHours: input.estimatedHours ?? null } : {}),
      ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId ?? null } : {}),
      ...(input.reporterId !== undefined ? { reporterId: input.reporterId ?? null } : {}),
    },
    include: taskInclude,
  });
}

export async function deleteTask(userId: string, projectId: string, taskId: string) {
  const project = await getProjectAccess(userId, projectId);
  const task = await prisma.task.findFirst({
    where: { id: taskId, projectId },
    select: { id: true, creatorId: true },
  });

  if (!task) {
    throw new HttpError(404, 'Task not found.');
  }

  if (project.ownerId !== userId && task.creatorId !== userId) {
    throw new HttpError(403, 'Only the task creator or project owner can delete this task.');
  }

  await prisma.task.delete({ where: { id: taskId } });

  return { message: 'Task deleted.' };
}

export async function moveTask(userId: string, projectId: string, taskId: string, input: MoveTaskInput) {
  await getProjectAccess(userId, projectId);

  const task = await prisma.task.findFirst({
    where: { id: taskId, projectId, archivedAt: null },
    select: { id: true },
  });

  if (!task) {
    throw new HttpError(404, 'Task not found.');
  }

  return prisma.task.update({
    where: { id: taskId },
    data: {
      status: input.status,
      position: input.position,
      completedAt: input.status === TaskStatus.DONE ? new Date() : null,
    },
    include: taskInclude,
  });
}

export async function reorderTasks(userId: string, projectId: string, input: ReorderTasksInput) {
  await getProjectAccess(userId, projectId);

  const taskIds = input.tasks.map((task) => task.id);
  const existingTaskCount = await prisma.task.count({
    where: {
      projectId,
      id: { in: taskIds },
      archivedAt: null,
    },
  });

  if (existingTaskCount !== taskIds.length) {
    throw new HttpError(400, 'One or more tasks do not belong to this project.');
  }

  await prisma.$transaction(
    input.tasks.map((task) =>
      prisma.task.update({
        where: { id: task.id },
        data: {
          status: task.status,
          position: task.position,
          completedAt: task.status === TaskStatus.DONE ? new Date() : null,
        },
      }),
    ),
  );

  return { message: 'Task order updated.' };
}

