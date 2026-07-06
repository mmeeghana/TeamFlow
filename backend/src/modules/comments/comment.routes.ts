import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth.js';
import {
  createCommentController,
  deleteCommentController,
  listCommentsController,
  updateCommentController,
} from './comment.controller.js';

export const commentRouter = Router({ mergeParams: true });

commentRouter.use(requireAuth);
commentRouter.get('/', listCommentsController);
commentRouter.post('/', createCommentController);
commentRouter.patch('/:commentId', updateCommentController);
commentRouter.delete('/:commentId', deleteCommentController);
