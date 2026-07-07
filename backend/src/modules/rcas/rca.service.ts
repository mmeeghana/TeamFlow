import { NotificationType, RCAStatus, ReviewDecision } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { HttpError } from '../../utils/http-error.js';
import { assertProjectMember, recordActivity } from '../activity/activity.service.js';
import { createNotification } from '../notifications/notification.service.js';
import type { AssignReviewersInput, CreateRcaInput, SubmitReviewInput, UpdateRcaInput } from './rca.schemas.js';

const rcaInclude = {
  task: { select: { id: true, title: true } },
  createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
  sections: { orderBy: { order: 'asc' as const } },
  reviews: { include: { reviewer: { select: { id: true, name: true, email: true, avatarUrl: true } } }, orderBy: { requestedAt: 'asc' as const } },
};

async function getProject(userId: string, projectId: string) {
  return assertProjectMember(userId, projectId);
}

async function assertTaskInProject(projectId: string, taskId: string) {
  const task = await prisma.task.findFirst({ where: { id: taskId, projectId, archivedAt: null }, select: { id: true, title: true } });
  if (!task) throw new HttpError(404, 'Task not found.');
  return task;
}

async function assertReviewers(projectId: string, reviewerIds: string[]) {
  const uniqueIds = [...new Set(reviewerIds)];
  const count = await prisma.projectMember.count({ where: { projectId, userId: { in: uniqueIds } } });
  if (count !== uniqueIds.length) throw new HttpError(400, 'Reviewers must be project members.');
  return uniqueIds;
}

function normalizeSections(sections: CreateRcaInput['sections']) {
  const order = ['Timeline', 'Contributing Factors', 'Corrective Actions', 'Preventive Actions'];
  return order.map((title, index) => ({ title, content: sections.find((section) => section.title === title)?.content ?? '', order: index }));
}

async function getRcaOrThrow(projectId: string, rcaId: string) {
  const rca = await prisma.rCA.findFirst({ where: { id: rcaId, projectId, archivedAt: null }, include: rcaInclude });
  if (!rca) throw new HttpError(404, 'RCA not found.');
  return rca;
}

export async function listRcas(userId: string, projectId: string) {
  await getProject(userId, projectId);
  return prisma.rCA.findMany({ where: { projectId, archivedAt: null }, include: rcaInclude, orderBy: { updatedAt: 'desc' } });
}

export async function createRca(userId: string, projectId: string, input: CreateRcaInput) {
  await getProject(userId, projectId);
  const task = await assertTaskInProject(projectId, input.taskId);
  const rca = await prisma.rCA.create({
    data: {
      projectId,
      taskId: input.taskId,
      createdById: userId,
      title: input.title,
      summary: input.summary ?? null,
      severity: input.severity,
      sections: { create: normalizeSections(input.sections) },
    },
    include: rcaInclude,
  });
  await recordActivity({ projectId, taskId: input.taskId, actorId: userId, action: 'RCA_CREATED', entityType: 'RCA', entityId: rca.id, metadata: { title: rca.title, taskTitle: task.title } });
  return rca;
}

export async function updateRca(userId: string, projectId: string, rcaId: string, input: UpdateRcaInput) {
  await getProject(userId, projectId);
  const existing = await getRcaOrThrow(projectId, rcaId);
  if (existing.status === RCAStatus.APPROVED) throw new HttpError(400, 'Approved RCAs cannot be edited.');
  if (input.taskId) await assertTaskInProject(projectId, input.taskId);

  const rca = await prisma.$transaction(async (tx) => {
    if (input.sections) {
      await tx.rCASection.deleteMany({ where: { rcaId } });
      await tx.rCASection.createMany({ data: normalizeSections(input.sections).map((section) => ({ ...section, rcaId })) });
    }
    return tx.rCA.update({
      where: { id: rcaId },
      data: {
        ...(input.taskId ? { taskId: input.taskId } : {}),
        ...(input.title ? { title: input.title } : {}),
        ...(input.summary !== undefined ? { summary: input.summary ?? null } : {}),
        ...(input.severity ? { severity: input.severity } : {}),
      },
      include: rcaInclude,
    });
  });
  await recordActivity({ projectId, taskId: rca.taskId, actorId: userId, action: 'RCA_UPDATED', entityType: 'RCA', entityId: rca.id, metadata: { title: rca.title } });
  return rca;
}

export async function deleteRca(userId: string, projectId: string, rcaId: string) {
  const project = await getProject(userId, projectId);
  const rca = await getRcaOrThrow(projectId, rcaId);
  if (project.ownerId !== userId && rca.createdById !== userId) throw new HttpError(403, 'Only the RCA creator or project owner can delete this RCA.');
  await prisma.rCA.update({ where: { id: rcaId }, data: { archivedAt: new Date() } });
  await recordActivity({ projectId, taskId: rca.taskId, actorId: userId, action: 'RCA_DELETED', entityType: 'RCA', entityId: rcaId, metadata: { title: rca.title } });
  return { message: 'RCA deleted.' };
}

export async function submitRca(userId: string, projectId: string, rcaId: string) {
  const rca = await getRcaOrThrow(projectId, rcaId);
  await getProject(userId, projectId);
  if (rca.status !== RCAStatus.DRAFT) throw new HttpError(400, 'Only draft RCAs can be submitted.');
  const updated = await prisma.rCA.update({ where: { id: rcaId }, data: { status: RCAStatus.IN_REVIEW }, include: rcaInclude });
  await recordActivity({ projectId, taskId: updated.taskId, actorId: userId, action: 'RCA_SUBMITTED', entityType: 'RCA', entityId: rcaId, metadata: { title: updated.title } });
  const owner = await prisma.project.findUnique({ where: { id: projectId }, select: { ownerId: true } });
  if (owner?.ownerId) await createNotification({ recipientId: owner.ownerId, actorId: userId, projectId, type: NotificationType.RCA_UPDATED, title: 'RCA submitted', message: `${updated.title} was submitted for review.`, metadata: { rcaId } });
  return updated;
}

export async function assignReviewers(userId: string, projectId: string, rcaId: string, input: AssignReviewersInput) {
  const project = await getProject(userId, projectId);
  if (project.ownerId !== userId) throw new HttpError(403, 'Only the project owner can assign reviewers.');
  const rca = await getRcaOrThrow(projectId, rcaId);
  if (rca.status !== RCAStatus.IN_REVIEW) throw new HttpError(400, 'Only submitted RCAs can enter review.');
  const reviewerIds = await assertReviewers(projectId, input.reviewerIds);
  await prisma.$transaction(async (tx) => {
    await tx.review.deleteMany({ where: { rcaId } });
    await tx.review.createMany({ data: reviewerIds.map((reviewerId) => ({ rcaId, reviewerId, decision: ReviewDecision.PENDING })) });
  });
  for (const reviewerId of reviewerIds) {
    await createNotification({ recipientId: reviewerId, actorId: userId, projectId, type: NotificationType.REVIEW_REQUESTED, title: 'RCA review requested', message: `Please review ${rca.title}.`, metadata: { rcaId } });
  }
  await recordActivity({ projectId, taskId: rca.taskId, actorId: userId, action: 'REVIEW_REQUESTED', entityType: 'RCA', entityId: rcaId, metadata: { reviewerIds } });
  return getRcaOrThrow(projectId, rcaId);
}

export async function submitReview(userId: string, projectId: string, rcaId: string, reviewId: string, input: SubmitReviewInput) {
  await getProject(userId, projectId);
  const review = await prisma.review.findFirst({ where: { id: reviewId, rcaId, reviewerId: userId }, include: { rca: true } });
  if (!review || !review.rca || review.rca.projectId !== projectId) throw new HttpError(404, 'Review not found.');
  if (review.rca.status !== RCAStatus.IN_REVIEW) throw new HttpError(400, 'This RCA is not in review.');

  const updatedReview = await prisma.review.update({ where: { id: reviewId }, data: { decision: input.decision, comment: input.comment, decidedAt: new Date() } });
  const reviews = await prisma.review.findMany({ where: { rcaId } });
  const nextStatus = input.decision === 'REJECTED'
    ? RCAStatus.REJECTED
    : reviews.every((item) => item.id === reviewId ? input.decision === 'APPROVED' : item.decision === ReviewDecision.APPROVED)
      ? RCAStatus.APPROVED
      : RCAStatus.IN_REVIEW;

  const rca = await prisma.rCA.update({ where: { id: rcaId }, data: { status: nextStatus, approvedAt: nextStatus === RCAStatus.APPROVED ? new Date() : null }, include: rcaInclude });
  const action = input.decision === 'APPROVED' ? 'REVIEW_APPROVED' : 'REVIEW_REJECTED';
  await recordActivity({ projectId, taskId: rca.taskId, actorId: userId, action, entityType: 'Review', entityId: reviewId, metadata: { rcaId, comment: input.comment } });
  if (rca.createdById) await createNotification({ recipientId: rca.createdById, actorId: userId, projectId, type: NotificationType.RCA_UPDATED, title: input.decision === 'APPROVED' ? 'Review approved' : 'Review rejected', message: `${rca.title} was ${input.decision.toLowerCase()}.`, metadata: { rcaId, reviewId } });
  return { rca, review: updatedReview };
}

