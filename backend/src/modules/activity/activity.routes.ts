import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth.js';
import { exportProjectActivityController, listProjectActivityController } from './activity.controller.js';

export const activityRouter = Router({ mergeParams: true });

activityRouter.use(requireAuth);
activityRouter.get('/export', exportProjectActivityController);
activityRouter.get('/', listProjectActivityController);



