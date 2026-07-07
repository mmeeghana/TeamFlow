import { Prisma, TaskStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { HttpError } from '../../utils/http-error.js';
import { recordActivity } from '../activity/activity.service.js';
import { createNotification } from '../notifications/notification.service.js';
import { findUnfinishedBlockers } from '../dependencies/dependency.service.js';
import type {
  CreateTaskInput,
  ListTasksInput,
  MoveTaskInput,
  ReorderTasksInput,
  UpdateTaskDateInput,
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

  if (ids.length === 0) return;

  const count = await prisma.projectMember.count({
    where: { projectId, userId: { in: ids } },
  });

  if (count !== ids.length) {
    throw new HttpError(400, 'Assignee and reporter must be project members.');
  }
}


async function recordUnfinishedDependencyWarning(
  userId: string,
  projectId: string,
  taskId: string,
) {
  console.log("==============");
  console.log("TASK:", taskId);

  const blockers = await findUnfinishedBlockers(taskId);

  console.log("BLOCKERS:", JSON.stringify(blockers, null, 2));

  if (blockers.length === 0) {
    console.log("NO BLOCKERS");
    return null;
  }

  console.log("WARNING SHOULD BE SHOWN");

  const warning = "This task still has unfinished dependencies.";

  await recordActivity({
    projectId,
    taskId,
    actorId: userId,
    action: "TASK_DEPENDENCY_WARNING",
    entityType: "Task",
    entityId: taskId,
    metadata: {
      warning,
      blockers: blockers.map((b) => b.sourceTask),
    },
  });

  return {
    message: warning,
    blockers: blockers.map((b) => b.sourceTask),
  };
}
function dateMeta(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export async function listProjectTasks(userId: string, projectId: string, input: ListTasksInput) {
  await getProjectAccess(userId, projectId);

  const where: Prisma.TaskWhereInput = {
    projectId,
    archivedAt: null,
    ...(input.search ? { title: { contains: input.search, mode: Prisma.QueryMode.insensitive } } : {}),
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
      where: { projectId, archivedAt: null, dueDate: { lt: new Date() }, status: { not: TaskStatus.DONE } },
    }),
  ]);
  const projectTotal = await prisma.task.count({ where: { projectId, archivedAt: null } });

  return {
    items,
    meta: { page: input.page, pageSize: input.pageSize, total, pageCount: Math.ceil(total / input.pageSize) },
    stats: {
      total: projectTotal,
      completed,
      pending: Math.max(projectTotal - completed, 0),
      overdue,
      progress: projectTotal === 0 ? 0 : Math.round((completed / projectTotal) * 100),
    },
  };
}

export async function getTask(userId: string, projectId: string, taskId: string) {
  await getProjectAccess(userId, projectId);
  const task = await prisma.task.findFirst({ where: { id: taskId, projectId }, include: taskInclude });
  if (!task) throw new HttpError(404, 'Task not found.');
  return task;
}

export async function createTask(userId: string, projectId: string, input: CreateTaskInput) {
  await getProjectAccess(userId, projectId);
  await assertUsersAreProjectMembers(projectId, [input.assigneeId, input.reporterId ?? userId]);
  const position = await prisma.task.count({ where: { projectId, status: input.status, archivedAt: null } });
  const task = await prisma.task.create({
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
      position,
    },
    include: taskInclude,
  });
  if (task.assigneeId) {
    await createNotification({
      recipientId: task.assigneeId,
      actorId: userId,
      projectId,
      type: 'TASK_ASSIGNED',
      title: 'Task assigned',
      message: 'You were assigned to ' + task.title + '.',
      metadata: { taskId: task.id },
    });
  }

  await recordActivity({
    projectId,
    taskId: task.id,
    actorId: userId,
    action: 'TASK_CREATED',
    entityType: 'Task',
    entityId: task.id,
    metadata: { title: task.title },
  });
  return task;
}

export async function updateTask(userId: string, projectId: string, taskId: string, input: UpdateTaskInput) {
  await getProjectAccess(userId, projectId);
  await assertUsersAreProjectMembers(projectId, [input.assigneeId, input.reporterId]);
  const existingTask = await prisma.task.findFirst({
    where: { id: taskId, projectId },
    select: { id: true, status: true, priority: true, dueDate: true, assigneeId: true, title: true },
  });
  if (!existingTask) throw new HttpError(404, 'Task not found.');
  console.log("✅ updateTask() is running");
console.log("input.status =", input.status);
console.log("existing.status =", existingTask.status);

  const task = await prisma.task.update({
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

  await recordActivity({ projectId, taskId, actorId: userId, action: 'TASK_UPDATED', entityType: 'Task', entityId: taskId, metadata: { title: task.title } });
  if (input.status && input.status !== existingTask.status) {
    await recordActivity({ projectId, taskId, actorId: userId, action: 'STATUS_CHANGED', entityType: 'Task', entityId: taskId, metadata: { from: existingTask.status, to: input.status } });
  }
  if (input.priority && input.priority !== existingTask.priority) {
    await recordActivity({ projectId, taskId, actorId: userId, action: 'PRIORITY_CHANGED', entityType: 'Task', entityId: taskId, metadata: { from: existingTask.priority, to: input.priority } });
  }
  if (input.dueDate !== undefined && dateMeta(input.dueDate) !== dateMeta(existingTask.dueDate)) {
    await recordActivity({ projectId, taskId, actorId: userId, action: 'DUE_DATE_CHANGED', entityType: 'Task', entityId: taskId, metadata: { from: dateMeta(existingTask.dueDate), to: dateMeta(input.dueDate) } });
  }
  if (input.assigneeId !== undefined && input.assigneeId !== existingTask.assigneeId) {
    if (input.assigneeId) {
      await createNotification({
        recipientId: input.assigneeId,
        actorId: userId,
        projectId,
        type: 'TASK_ASSIGNED',
        title: 'Task assigned',
        message: 'You were assigned to ' + task.title + '.',
        metadata: { taskId },
      });
    }
    await recordActivity({ projectId, taskId, actorId: userId, action: 'ASSIGNEE_CHANGED', entityType: 'Task', entityId: taskId, metadata: { from: existingTask.assigneeId, to: input.assigneeId } });
  }
  const warning = input.status === TaskStatus.DONE && existingTask.status !== TaskStatus.DONE ? await recordUnfinishedDependencyWarning(userId, projectId, taskId) : null;
  return { task, warning };
}

export async function deleteTask(userId: string, projectId: string, taskId: string) {
  const project = await getProjectAccess(userId, projectId);
  const task = await prisma.task.findFirst({ where: { id: taskId, projectId }, select: { id: true, creatorId: true } });
  if (!task) throw new HttpError(404, 'Task not found.');
  if (project.ownerId !== userId && task.creatorId !== userId) {
    throw new HttpError(403, 'Only the task creator or project owner can delete this task.');
  }
  await prisma.task.delete({ where: { id: taskId } });
  return { message: 'Task deleted.' };
}

export async function updateTaskDate(userId: string, projectId: string, taskId: string, input: UpdateTaskDateInput) {
  await getProjectAccess(userId, projectId);
  const existingTask = await prisma.task.findFirst({ where: { id: taskId, projectId, archivedAt: null }, select: { id: true, dueDate: true } });
  if (!existingTask) throw new HttpError(404, 'Task not found.');
  const task = await prisma.task.update({ where: { id: taskId }, data: { dueDate: input.dueDate }, include: taskInclude });
  if (dateMeta(input.dueDate) !== dateMeta(existingTask.dueDate)) {
    await recordActivity({ projectId, taskId, actorId: userId, action: 'DUE_DATE_CHANGED', entityType: 'Task', entityId: taskId, metadata: { from: dateMeta(existingTask.dueDate), to: dateMeta(input.dueDate) } });
  }
  return task;
}

export async function moveTask(userId: string, projectId: string, taskId: string, input: MoveTaskInput) {
  await getProjectAccess(userId, projectId);
  const existingTask = await prisma.task.findFirst({ where: { id: taskId, projectId, archivedAt: null }, select: { id: true, status: true } });
  if (!existingTask) throw new HttpError(404, 'Task not found.');
  const task = await prisma.task.update({
    where: { id: taskId },
    data: { status: input.status, position: input.position, completedAt: input.status === TaskStatus.DONE ? new Date() : null },
    include: taskInclude,
  });
  if (input.status !== existingTask.status) {
    await recordActivity({ projectId, taskId, actorId: userId, action: 'STATUS_CHANGED', entityType: 'Task', entityId: taskId, metadata: { from: existingTask.status, to: input.status } });
  }
  const warning = input.status === TaskStatus.DONE && existingTask.status !== TaskStatus.DONE ? await recordUnfinishedDependencyWarning(userId, projectId, taskId) : null;
  return { task, warning };
}

export async function reorderTasks(
  userId: string,
  projectId: string,
  input: ReorderTasksInput,
) {
  await getProjectAccess(userId, projectId);

  const taskIds = input.tasks.map((task) => task.id);

  const existingTasks = await prisma.task.findMany({
    where: {
      projectId,
      id: { in: taskIds },
      archivedAt: null,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (existingTasks.length !== taskIds.length) {
    throw new HttpError(400, 'One or more tasks do not belong to this project.');
  }

  const existingMap = new Map(
    existingTasks.map((task) => [task.id, task]),
  );

  const warnings: Array<{
    taskId: string;
    warning: Awaited<ReturnType<typeof recordUnfinishedDependencyWarning>>;
  }> = [];

  await prisma.$transaction(
    input.tasks.map((task) =>
      prisma.task.update({
        where: { id: task.id },
        data: {
          status: task.status,
          position: task.position,
          completedAt:
            task.status === TaskStatus.DONE ? new Date() : null,
        },
      }),
    ),
  );

  for (const task of input.tasks) {
    const previous = existingMap.get(task.id);

    if (!previous) continue;

    if (
      previous.status !== TaskStatus.DONE &&
      task.status === TaskStatus.DONE
    ) {
      const warning = await recordUnfinishedDependencyWarning(
        userId,
        projectId,
        task.id,
      );

      if (warning) {
        warnings.push({
          taskId: task.id,
          warning,
        });
      }
    }

    if (previous.status !== task.status) {
      await recordActivity({
        projectId,
        taskId: task.id,
        actorId: userId,
        action: 'STATUS_CHANGED',
        entityType: 'Task',
        entityId: task.id,
        metadata: {
          from: previous.status,
          to: task.status,
        },
      });
    }
  }

  return {
    message: 'Task order updated.',
    warnings,
  };
}








