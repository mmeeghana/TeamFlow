import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth.js';
import { getDashboardChartsController, getDashboardOverviewController } from './dashboard.controller.js';

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);
dashboardRouter.get('/overview', getDashboardOverviewController);
dashboardRouter.get('/charts', getDashboardChartsController);
