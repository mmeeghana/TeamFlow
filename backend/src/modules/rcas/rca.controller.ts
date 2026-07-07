import type { RequestHandler } from 'express';
import {
  assignReviewersSchema,
  createRcaSchema,
  rcaIdParamsSchema,
  rcaParamsSchema,
  reviewIdParamsSchema,
  submitReviewSchema,
  updateRcaSchema,
} from './rca.schemas.js';
import { assignReviewers, createRca, deleteRca, listRcas, submitRca, submitReview, updateRca } from './rca.service.js';

export const listRcasController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId } = rcaParamsSchema.parse(req.params);
    const rcas = await listRcas(req.userId!, projectId);
    res.status(200).json({ rcas });
  } catch (error) {
    next(error);
  }
};

export const createRcaController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId } = rcaParamsSchema.parse(req.params);
    const input = createRcaSchema.parse(req.body);
    const rca = await createRca(req.userId!, projectId, input);
    res.status(201).json({ rca });
  } catch (error) {
    next(error);
  }
};

export const updateRcaController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId, rcaId } = rcaIdParamsSchema.parse(req.params);
    const input = updateRcaSchema.parse(req.body);
    const rca = await updateRca(req.userId!, projectId, rcaId, input);
    res.status(200).json({ rca });
  } catch (error) {
    next(error);
  }
};

export const deleteRcaController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId, rcaId } = rcaIdParamsSchema.parse(req.params);
    const payload = await deleteRca(req.userId!, projectId, rcaId);
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

export const submitRcaController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId, rcaId } = rcaIdParamsSchema.parse(req.params);
    const rca = await submitRca(req.userId!, projectId, rcaId);
    res.status(200).json({ rca });
  } catch (error) {
    next(error);
  }
};

export const assignReviewersController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId, rcaId } = rcaIdParamsSchema.parse(req.params);
    const input = assignReviewersSchema.parse(req.body);
    const rca = await assignReviewers(req.userId!, projectId, rcaId, input);
    res.status(200).json({ rca });
  } catch (error) {
    next(error);
  }
};

export const submitReviewController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId, rcaId, reviewId } = reviewIdParamsSchema.parse(req.params);
    const input = submitReviewSchema.parse(req.body);
    const payload = await submitReview(req.userId!, projectId, rcaId, reviewId, input);
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};
