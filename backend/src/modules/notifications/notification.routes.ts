import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth.js';
import {
  listNotificationsController,
  markAllNotificationsReadController,
  markNotificationReadController,
} from './notification.controller.js';

export const notificationRouter = Router();

notificationRouter.use(requireAuth);
notificationRouter.get('/', listNotificationsController);
notificationRouter.patch('/read-all', markAllNotificationsReadController);
notificationRouter.patch('/:id/read', markNotificationReadController);
