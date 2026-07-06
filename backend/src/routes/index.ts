import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes.js';
import { notificationRouter } from '../modules/notifications/notification.routes.js';
import { projectRouter } from '../modules/projects/project.routes.js';
import { healthRouter } from './health.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/notifications', notificationRouter);
apiRouter.use('/projects', projectRouter);
apiRouter.use('/health', healthRouter);

