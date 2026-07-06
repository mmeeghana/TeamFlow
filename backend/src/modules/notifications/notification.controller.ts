import type { RequestHandler } from 'express';
import { listNotificationsSchema, notificationParamsSchema } from './notification.schemas.js';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from './notification.service.js';

export const listNotificationsController: RequestHandler = async (req, res, next) => {
  try {
    const input = listNotificationsSchema.parse(req.query);
    const payload = await listNotifications(req.userId!, input);
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

export const markNotificationReadController: RequestHandler = async (req, res, next) => {
  try {
    const { id } = notificationParamsSchema.parse(req.params);
    const notification = await markNotificationRead(req.userId!, id);
    res.status(200).json({ notification });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsReadController: RequestHandler = async (req, res, next) => {
  try {
    const payload = await markAllNotificationsRead(req.userId!);
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};
