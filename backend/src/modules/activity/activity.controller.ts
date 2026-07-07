import type { RequestHandler } from 'express';
import { activityParamsSchema, listActivitySchema } from './activity.schemas.js';
import { exportProjectActivity, listProjectActivity } from './activity.service.js';

export const listProjectActivityController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId } = activityParamsSchema.parse(req.params);
    const input = listActivitySchema.parse(req.query);
    const payload = await listProjectActivity(req.userId!, projectId, input);
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

export const exportProjectActivityController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId } = activityParamsSchema.parse(req.params);
    const items = await exportProjectActivity(req.userId!, projectId);
    res.status(200).json({ items });
  } catch (error) {
    next(error);
  }
};
