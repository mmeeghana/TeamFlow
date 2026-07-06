import type { RequestHandler } from 'express';
import { HttpError } from '../../utils/http-error.js';
import { attachmentIdParamsSchema, attachmentParamsSchema, uploadFileSchema } from './attachment.schemas.js';
import { createAttachment, deleteAttachment, getAttachmentForDownload, listAttachments } from './attachment.service.js';

export const listAttachmentsController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId, taskId } = attachmentParamsSchema.parse(req.params);
    const attachments = await listAttachments(req.userId!, projectId, taskId);
    res.status(200).json({ attachments });
  } catch (error) {
    next(error);
  }
};

export const createAttachmentController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId, taskId } = attachmentParamsSchema.parse(req.params);
    if (!req.file) {
      throw new HttpError(400, 'File is required.');
    }

    const file = uploadFileSchema.parse(req.file);
    const attachment = await createAttachment(req.userId!, projectId, taskId, file);
    res.status(201).json({ attachment });
  } catch (error) {
    next(error);
  }
};

export const deleteAttachmentController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId, taskId, attachmentId } = attachmentIdParamsSchema.parse(req.params);
    const payload = await deleteAttachment(req.userId!, projectId, taskId, attachmentId);
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

export const downloadAttachmentController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId, taskId, attachmentId } = attachmentIdParamsSchema.parse(req.params);
    const attachment = await getAttachmentForDownload(req.userId!, projectId, taskId, attachmentId);
    res.download(attachment.path, attachment.originalName);
  } catch (error) {
    next(error);
  }
};
