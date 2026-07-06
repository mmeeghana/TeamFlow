import { promises as fs } from 'node:fs';
import path from 'node:path';
import { prisma } from '../../config/prisma.js';
import { HttpError } from '../../utils/http-error.js';
import { assertProjectMember, recordActivity } from '../activity/activity.service.js';
import type { UploadFileInput } from './attachment.schemas.js';

const attachmentInclude = {
  uploadedBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
};

export const uploadsDirectory = path.resolve(process.cwd(), 'uploads');

async function assertTaskInProject(userId: string, projectId: string, taskId: string) {
  const project = await assertProjectMember(userId, projectId);
  const task = await prisma.task.findFirst({
    where: { id: taskId, projectId, archivedAt: null },
    select: { id: true, title: true },
  });

  if (!task) {
    throw new HttpError(404, 'Task not found.');
  }

  return { project, task };
}

function getStoredFilePath(filename: string) {
  return path.join(uploadsDirectory, filename);
}

export async function listAttachments(userId: string, projectId: string, taskId: string) {
  await assertTaskInProject(userId, projectId, taskId);

  return prisma.attachment.findMany({
    where: { taskId },
    include: attachmentInclude,
    orderBy: { uploadedAt: 'desc' },
  });
}

export async function createAttachment(userId: string, projectId: string, taskId: string, file: UploadFileInput) {
  const { task } = await assertTaskInProject(userId, projectId, taskId);
  const attachment = await prisma.attachment.create({
    data: {
      taskId,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadedById: userId,
    },
    include: attachmentInclude,
  });

  await recordActivity({
    projectId,
    taskId,
    actorId: userId,
    action: 'ATTACHMENT_UPLOADED',
    entityType: 'Attachment',
    entityId: attachment.id,
    metadata: { taskTitle: task.title, originalName: attachment.originalName, size: attachment.size },
  });

  return attachment;
}

export async function getAttachmentForDownload(userId: string, projectId: string, taskId: string, attachmentId: string) {
  await assertTaskInProject(userId, projectId, taskId);
  const attachment = await prisma.attachment.findFirst({
    where: { id: attachmentId, taskId },
    select: { id: true, filename: true, originalName: true, mimeType: true },
  });

  if (!attachment) {
    throw new HttpError(404, 'Attachment not found.');
  }

  return {
    ...attachment,
    path: getStoredFilePath(attachment.filename),
  };
}

export async function deleteAttachment(userId: string, projectId: string, taskId: string, attachmentId: string) {
  const { project, task } = await assertTaskInProject(userId, projectId, taskId);
  const attachment = await prisma.attachment.findFirst({
    where: { id: attachmentId, taskId },
    select: { id: true, filename: true, originalName: true, uploadedById: true, size: true },
  });

  if (!attachment) {
    throw new HttpError(404, 'Attachment not found.');
  }

  if (attachment.uploadedById !== userId && project.ownerId !== userId) {
    throw new HttpError(403, 'Only the uploader or project owner can delete this attachment.');
  }

  await prisma.attachment.delete({ where: { id: attachmentId } });
  await fs.unlink(getStoredFilePath(attachment.filename)).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  });

  await recordActivity({
    projectId,
    taskId,
    actorId: userId,
    action: 'ATTACHMENT_DELETED',
    entityType: 'Attachment',
    entityId: attachmentId,
    metadata: { taskTitle: task.title, originalName: attachment.originalName, size: attachment.size },
  });

  return { message: 'Attachment deleted.' };
}


