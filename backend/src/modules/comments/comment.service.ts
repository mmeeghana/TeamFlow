import { prisma } from '../../config/prisma.js';
import { HttpError } from '../../utils/http-error.js';
import { assertProjectMember, recordActivity } from '../activity/activity.service.js';
import { createNotification } from '../notifications/notification.service.js';
import type { CreateCommentInput, UpdateCommentInput } from './comment.schemas.js';

const commentInclude = {
  author: { select: { id: true, name: true, email: true, avatarUrl: true } },
};

async function assertTaskInProject(userId: string, projectId: string, taskId: string) {
  await assertProjectMember(userId, projectId);
  const task = await prisma.task.findFirst({
    where: { id: taskId, projectId, archivedAt: null },
    select: { id: true, title: true },
  });

  if (!task) {
    throw new HttpError(404, 'Task not found.');
  }

  return task;
}

async function extractMentionedUserIds(projectId: string, content: string) {
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: { user: { select: { id: true, name: true } } },
  });
  const normalized = content.toLowerCase();

  return members
    .filter((member) => normalized.includes(`@${member.user.name.toLowerCase()}`))
    .map((member) => member.user.id);
}

export async function listComments(userId: string, projectId: string, taskId: string) {
  await assertTaskInProject(userId, projectId, taskId);

  return prisma.comment.findMany({
    where: { taskId },
    include: commentInclude,
    orderBy: { createdAt: 'asc' },
  });
}

export async function createComment(userId: string, projectId: string, taskId: string, input: CreateCommentInput) {
  const task = await assertTaskInProject(userId, projectId, taskId);
  const mentionedUserIds = await extractMentionedUserIds(projectId, input.content);
  const comment = await prisma.comment.create({
    data: {
      taskId,
      authorId: userId,
      content: input.content,
      mentionedUserIds,
    },
    include: commentInclude,
  });

  for (const mentionedUserId of mentionedUserIds) {
    await createNotification({
      recipientId: mentionedUserId,
      actorId: userId,
      projectId,
      type: 'COMMENT_MENTION',
      title: 'You were mentioned',
      message: 'You were mentioned in a comment on ' + task.title + '.',
      metadata: { taskId, commentId: comment.id },
    });
  }

  await recordActivity({
    projectId,
    taskId,
    actorId: userId,
    action: 'COMMENT_ADDED',
    entityType: 'Comment',
    entityId: comment.id,
    metadata: { taskTitle: task.title, mentionedUserIds },
  });

  return comment;
}

export async function updateComment(
  userId: string,
  projectId: string,
  taskId: string,
  commentId: string,
  input: UpdateCommentInput,
) {
  await assertTaskInProject(userId, projectId, taskId);
  const existing = await prisma.comment.findFirst({
    where: { id: commentId, taskId },
    select: { id: true, authorId: true, content: true },
  });

  if (!existing) {
    throw new HttpError(404, 'Comment not found.');
  }

  if (existing.authorId !== userId) {
    throw new HttpError(403, 'Only the comment author can edit this comment.');
  }

  const mentionedUserIds = await extractMentionedUserIds(projectId, input.content);
  const comment = await prisma.comment.update({
    where: { id: commentId },
    data: { content: input.content, mentionedUserIds },
    include: commentInclude,
  });

  await recordActivity({
    projectId,
    taskId,
    actorId: userId,
    action: 'COMMENT_EDITED',
    entityType: 'Comment',
    entityId: comment.id,
    metadata: { previousContent: existing.content, mentionedUserIds },
  });

  return comment;
}

export async function deleteComment(userId: string, projectId: string, taskId: string, commentId: string) {
  await assertTaskInProject(userId, projectId, taskId);
  const existing = await prisma.comment.findFirst({
    where: { id: commentId, taskId },
    select: { id: true, authorId: true, content: true },
  });

  if (!existing) {
    throw new HttpError(404, 'Comment not found.');
  }

  if (existing.authorId !== userId) {
    throw new HttpError(403, 'Only the comment author can delete this comment.');
  }

  await prisma.comment.delete({ where: { id: commentId } });
  await recordActivity({
    projectId,
    taskId,
    actorId: userId,
    action: 'COMMENT_DELETED',
    entityType: 'Comment',
    entityId: commentId,
    metadata: { content: existing.content },
  });

  return { message: 'Comment deleted.' };
}




