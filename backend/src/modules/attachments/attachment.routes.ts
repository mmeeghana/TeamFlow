import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../middleware/require-auth.js';
import { HttpError } from '../../utils/http-error.js';
import {
  createAttachmentController,
  deleteAttachmentController,
  downloadAttachmentController,
  listAttachmentsController,
} from './attachment.controller.js';
import { uploadsDirectory } from './attachment.service.js';

const allowedExtensions = new Set(['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.gif', '.txt', '.zip']);
const allowedMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/gif',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
]);

fs.mkdirSync(uploadsDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadsDirectory),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${crypto.randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.has(extension) || !allowedMimeTypes.has(file.mimetype)) {
      callback(new HttpError(400, 'Unsupported file type.'));
      return;
    }
    callback(null, true);
  },
});

export const attachmentRouter = Router({ mergeParams: true });

attachmentRouter.use(requireAuth);
attachmentRouter.get('/', listAttachmentsController);
attachmentRouter.post('/', upload.single('file'), createAttachmentController);
attachmentRouter.get(
  '/:attachmentId/download',
  downloadAttachmentController,
);
attachmentRouter.delete('/:attachmentId', deleteAttachmentController);


