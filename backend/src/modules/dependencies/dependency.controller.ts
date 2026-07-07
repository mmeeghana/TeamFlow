import type { RequestHandler } from 'express';
import { createDependencySchema, dependencyIdParamsSchema, dependencyParamsSchema } from './dependency.schemas.js';
import { createDependency, deleteDependency, listDependencies } from './dependency.service.js';

export const listDependenciesController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId, taskId } = dependencyParamsSchema.parse(req.params);
    const dependencies = await listDependencies(req.userId!, projectId, taskId);
    res.status(200).json({ dependencies });
  } catch (error) {
    next(error);
  }
};

export const createDependencyController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId, taskId } = dependencyParamsSchema.parse(req.params);
    const input = createDependencySchema.parse(req.body);
    const dependency = await createDependency(req.userId!, projectId, taskId, input);
    res.status(201).json({ dependency });
  } catch (error) {
    next(error);
  }
};

export const deleteDependencyController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId, taskId, relationId } = dependencyIdParamsSchema.parse(req.params);
    const payload = await deleteDependency(req.userId!, projectId, taskId, relationId);
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};
