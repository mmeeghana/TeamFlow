import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { HttpError } from '../../utils/http-error.js';

export type ActivityAction =
  | 'PROJECT_CREATED'
  | 'MEMBER_INVITED'
  | 'MEMBER_REMOVED'
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'STATUS_CHANGED'
  | 'PRIORITY_CHANGED'
  | 'DUE_DATE_CHANGED'
  | 'ASSIGNEE_CHANGED'
  | 'COMMENT_ADDED'
  | 'COMMENT_EDITED'
  | 'COMMENT_DELETED'
  | 'ATTACHMENT_UPLOADED'
  | 'ATTACHMENT_DELETED'
  | 'TASK_DEPENDENCY_ADDED'
  | 'TASK_DEPENDENCY_REMOVED'
  | 'TASK_DEPENDENCY_WARNING'
  | 'RCA_CREATED'
  | 'RCA_UPDATED'
  | 'RCA_DELETED'
  | 'RCA_SUBMITTED'
  | 'REVIEW_REQUESTED'
  | 'REVIEW_APPROVED'
  | 'REVIEW_REJECTED';

export async function assertProjectMember(userId: string, projectId: string) {
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

export async function recordActivity(input: {
  projectId: string;
  actorId?: string | null;
  taskId?: string | null;
  action: ActivityAction;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.activityLog.create({
    data: {
      projectId: input.projectId,
      actorId: input.actorId ?? null,
      taskId: input.taskId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata ?? Prisma.JsonNull,
    },
  });
}

export async function listProjectActivity(userId: string, projectId: string, input: { page: number; pageSize: number }) {
  await assertProjectMember(userId, projectId);
  const skip = (input.page - 1) * input.pageSize;
  const where = { projectId };
  const [items, total] = await prisma.$transaction([
    prisma.activityLog.findMany({
      where,
      include: {
        actor: { select: { id: true, name: true, email: true, avatarUrl: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: input.pageSize,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return {
    items,
    meta: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      pageCount: Math.ceil(total / input.pageSize),
    },
  };
}





export async function exportProjectActivity(userId: string, projectId: string) {
  await assertProjectMember(userId, projectId);

  return prisma.activityLog.findMany({
    where: { projectId },
    include: {
      actor: { select: { id: true, name: true, email: true, avatarUrl: true } },
      task: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}
