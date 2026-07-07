import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth.js';
import {
  assignReviewersController,
  createRcaController,
  deleteRcaController,
  listRcasController,
  submitRcaController,
  submitReviewController,
  updateRcaController,
} from './rca.controller.js';

export const rcaRouter = Router({ mergeParams: true });

rcaRouter.use(requireAuth);
rcaRouter.get('/', listRcasController);
rcaRouter.post('/', createRcaController);
rcaRouter.patch('/:rcaId', updateRcaController);
rcaRouter.delete('/:rcaId', deleteRcaController);
rcaRouter.post('/:rcaId/submit', submitRcaController);
rcaRouter.post('/:rcaId/reviewers', assignReviewersController);
rcaRouter.post('/:rcaId/reviews/:reviewId', submitReviewController);
