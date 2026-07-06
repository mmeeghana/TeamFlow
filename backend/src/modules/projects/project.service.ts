import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { HttpError } from '../../utils/http-error.js';
import { recordActivity } from '../activity/activity.service.js';
import { createNotification } from '../notifications/notification.service.js';
import type { CreateProjectInput, InviteMemberInput, ListProjectsInput, UpdateProjectInput } from './project.schemas.js';

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

async function generateProjectKey(name: string) {
  const base = slugify(name) || 'project';
  let key = base;
  let suffix = 1;

  while (await prisma.project.findUnique({ where: { key }, select: { id: true } })) {
    suffix += 1;
    key = `${base}-${suffix}`;
  }

  return key;
}

const projectInclude = {
  owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
  members: {
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
    orderBy: { joinedAt: 'asc' },
  },
  _count: { select: { members: true, tasks: true, activityLogs: true } },
} satisfies Prisma.ProjectInclude;

function assertProjectOwner(project: { ownerId: string } | null, userId: string) {
  if (!project) {
    throw new HttpError(404, 'Project not found.');
  }

  if (project.ownerId !== userId) {
    throw new HttpError(403, 'Only the project owner can perform this action.');
  }
}

export async function listProjects(userId: string, input: ListProjectsInput) {
  const where: Prisma.ProjectWhereInput = {
    OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    ...(input.search
      ? { name: { contains: input.search, mode: Prisma.QueryMode.insensitive } }
      : {}),
  };
  const skip = (input.page - 1) * input.pageSize;
  const [items, total] = await prisma.$transaction([
    prisma.project.findMany({
      where,
      include: projectInclude,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: input.pageSize,
    }),
    prisma.project.count({ where }),
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

export async function getProjectById(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    include: projectInclude,
  });

  if (!project) {
    throw new HttpError(404, 'Project not found.');
  }

  return project;
}

export async function createProject(userId: string, input: CreateProjectInput) {
  const key = await generateProjectKey(input.name);

  const project = await prisma.project.create({
    data: {
      name: input.name,
      key,
      description: input.description || null,
      themeColor: input.themeColor,
      ownerId: userId,
      members: {
        create: {
          userId,
          role: 'ADMIN',
        },
      },
    },
    include: projectInclude,
  });

  await recordActivity({
    projectId: project.id,
    actorId: userId,
    action: 'PROJECT_CREATED',
    entityType: 'Project',
    entityId: project.id,
    metadata: { name: project.name },
  });

  return project;
}

export async function updateProject(userId: string, projectId: string, input: UpdateProjectInput) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { ownerId: true } });
  assertProjectOwner(project, userId);

  return prisma.project.update({
    where: { id: projectId },
    data: {
      ...(input.name ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description || null } : {}),
      ...(input.themeColor ? { themeColor: input.themeColor } : {}),
    },
    include: projectInclude,
  });
}

export async function deleteProject(userId: string, projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { ownerId: true } });
  assertProjectOwner(project, userId);

  await prisma.project.delete({ where: { id: projectId } });

  return { message: 'Project deleted.' };
}

export async function inviteProjectMember(userId: string, projectId: string, input: InviteMemberInput) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { ownerId: true } });
  assertProjectOwner(project, userId);

  const invitedUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, isActive: true },
  });

  if (!invitedUser || !invitedUser.isActive) {
    throw new HttpError(404, 'User not found.');
  }

  const existingMembership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: invitedUser.id } },
    select: { id: true },
  });

  if (existingMembership) {
    throw new HttpError(409, 'User is already a project member.');
  }

  const member = await prisma.projectMember.create({
    data: {
      projectId,
      userId: invitedUser.id,
      role: 'MEMBER',
    },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  });

  await createNotification({
    recipientId: invitedUser.id,
    actorId: userId,
    projectId,
    type: 'PROJECT_INVITE',
    title: 'Project invitation',
    message: 'You were invited to a project.',
    metadata: { projectId },
  });

  await recordActivity({
    projectId,
    actorId: userId,
    action: 'MEMBER_INVITED',
    entityType: 'ProjectMember',
    entityId: member.id,
    metadata: { invitedUserId: invitedUser.id, invitedEmail: input.email },
  });

  return member;
}

export async function removeProjectMember(userId: string, projectId: string, memberUserId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { ownerId: true } });
  assertProjectOwner(project, userId);

  if (memberUserId === userId) {
    throw new HttpError(400, 'Project owner cannot be removed from the project.');
  }

  let removedMembershipId = memberUserId;

  try {
    const removed = await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId: memberUserId } },
      select: { id: true },
    });
    removedMembershipId = removed.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new HttpError(404, 'Project member not found.');
    }

    throw error;
  }

  await recordActivity({
    projectId,
    actorId: userId,
    action: 'MEMBER_REMOVED',
    entityType: 'ProjectMember',
    entityId: removedMembershipId,
    metadata: { removedUserId: memberUserId },
  });

  return { message: 'Project member removed.' };
}



