import type { RequestHandler } from 'express';
import { getDashboardCharts, getDashboardOverview } from './dashboard.service.js';

export const getDashboardOverviewController: RequestHandler = async (req, res, next) => {
  try {
    const overview = await getDashboardOverview(req.userId!);
    res.status(200).json({ overview });
  } catch (error) {
    next(error);
  }
};

export const getDashboardChartsController: RequestHandler = async (req, res, next) => {
  try {
    const charts = await getDashboardCharts(req.userId!);
    res.status(200).json({ charts });
  } catch (error) {
    next(error);
  }
};
