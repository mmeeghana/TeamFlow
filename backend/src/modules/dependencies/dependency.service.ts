import { Prisma, TaskStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { HttpError } from '../../utils/http-error.js';
import { assertProjectMember, recordActivity } from '../activity/activity.service.js';
import type { CreateDependencyInput } from './dependency.schemas.js';

const taskSelect = { id: true, title: true, status: true, priority: true, dueDate: true };

async function assertTask(userId: string, projectId: string, taskId: string) {
  await assertProjectMember(userId, projectId);
  const task = await prisma.task.findFirst({ where: { id: taskId, projectId, archivedAt: null }, select: { id: true, title: true } });
  if (!task) throw new HttpError(404, 'Task not found.');
  return task;
}

async function assertRelatedTask(projectId: string, taskId: string) {
  const task = await prisma.task.findFirst({ where: { id: taskId, projectId, archivedAt: null }, select: { id: true, title: true } });
  if (!task) throw new HttpError(404, 'Related task not found.');
  return task;
}

async function wouldCreateCycle(sourceTaskId: string, targetTaskId: string) {
  const visited = new Set<string>();
  const stack = [targetTaskId];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === sourceTaskId) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    const nextRelations = await prisma.taskRelation.findMany({
      where: { sourceTaskId: current, type: 'BLOCKS' },
      select: { targetTaskId: true },
    });
    stack.push(...nextRelations.map((relation) => relation.targetTaskId));
  }

  return false;
}

export async function listDependencies(userId: string, projectId: string, taskId: string) {
  await assertTask(userId, projectId, taskId);
  const [blockedBy, blocks] = await prisma.$transaction([
    prisma.taskRelation.findMany({
      where: { targetTaskId: taskId, type: 'BLOCKS' },
      include: { sourceTask: { select: taskSelect } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.taskRelation.findMany({
      where: { sourceTaskId: taskId, type: 'BLOCKS' },
      include: { targetTask: { select: taskSelect } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    blockedBy: blockedBy.map((relation) => ({ id: relation.id, task: relation.sourceTask, createdAt: relation.createdAt })),
    blocks: blocks.map((relation) => ({ id: relation.id, task: relation.targetTask, createdAt: relation.createdAt })),
  };
}

export async function createDependency(userId: string, projectId: string, taskId: string, input: CreateDependencyInput) {
  const task = await assertTask(userId, projectId, taskId);
  const relatedTask = await assertRelatedTask(projectId, input.taskId);
  if (taskId === input.taskId) throw new HttpError(400, 'A task cannot depend on itself.');

  const sourceTaskId = input.type === 'BLOCKS' ? taskId : input.taskId;
  const targetTaskId = input.type === 'BLOCKS' ? input.taskId : taskId;

  if (await wouldCreateCycle(sourceTaskId, targetTaskId)) {
    throw new HttpError(400, 'This dependency would create a circular dependency.');
  }

  const relation = await prisma.taskRelation.create({
    data: { sourceTaskId, targetTaskId, type: 'BLOCKS' },
    include: { sourceTask: { select: taskSelect }, targetTask: { select: taskSelect } },
  }).catch((error: unknown) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new HttpError(409, 'Dependency already exists.');
    }
    throw error;
  });

  await recordActivity({
    projectId,
    taskId,
    actorId: userId,
    action: 'TASK_DEPENDENCY_ADDED',
    entityType: 'TaskRelation',
    entityId: relation.id,
    metadata: { taskTitle: task.title, relatedTaskTitle: relatedTask.title, type: input.type },
  });

  return relation;
}

export async function deleteDependency(userId: string, projectId: string, taskId: string, relationId: string) {
  await assertTask(userId, projectId, taskId);
  const relation = await prisma.taskRelation.findFirst({
    where: { id: relationId, OR: [{ sourceTaskId: taskId }, { targetTaskId: taskId }] },
    select: { id: true, sourceTaskId: true, targetTaskId: true },
  });
  if (!relation) throw new HttpError(404, 'Dependency not found.');

  await prisma.taskRelation.delete({ where: { id: relationId } });
  await recordActivity({
    projectId,
    taskId,
    actorId: userId,
    action: 'TASK_DEPENDENCY_REMOVED',
    entityType: 'TaskRelation',
    entityId: relationId,
    metadata: { sourceTaskId: relation.sourceTaskId, targetTaskId: relation.targetTaskId },
  });

  return { message: 'Dependency removed.' };
}

export async function findUnfinishedBlockers(taskId: string) {
  return prisma.taskRelation.findMany({
    where: { targetTaskId: taskId, type: 'BLOCKS', sourceTask: { status: { notIn: [TaskStatus.DONE, TaskStatus.ARCHIVED] }, archivedAt: null } },
    include: { sourceTask: { select: { id: true, title: true, status: true } } },
  });
}
