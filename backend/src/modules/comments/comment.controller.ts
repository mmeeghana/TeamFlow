import type { RequestHandler } from 'express';
import { commentIdParamsSchema, commentParamsSchema, createCommentSchema, updateCommentSchema } from './comment.schemas.js';
import { createComment, deleteComment, listComments, updateComment } from './comment.service.js';

export const listCommentsController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId, taskId } = commentParamsSchema.parse(req.params);
    const comments = await listComments(req.userId!, projectId, taskId);
    res.status(200).json({ comments });
  } catch (error) {
    next(error);
  }
};

export const createCommentController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId, taskId } = commentParamsSchema.parse(req.params);
    const input = createCommentSchema.parse(req.body);
    const comment = await createComment(req.userId!, projectId, taskId, input);
    res.status(201).json({ comment });
  } catch (error) {
    next(error);
  }
};

export const updateCommentController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId, taskId, commentId } = commentIdParamsSchema.parse(req.params);
    const input = updateCommentSchema.parse(req.body);
    const comment = await updateComment(req.userId!, projectId, taskId, commentId, input);
    res.status(200).json({ comment });
  } catch (error) {
    next(error);
  }
};

export const deleteCommentController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId, taskId, commentId } = commentIdParamsSchema.parse(req.params);
    const payload = await deleteComment(req.userId!, projectId, taskId, commentId);
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};
