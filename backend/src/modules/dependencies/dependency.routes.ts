import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth.js';
import { createDependencyController, deleteDependencyController, listDependenciesController } from './dependency.controller.js';

export const dependencyRouter = Router({ mergeParams: true });

dependencyRouter.use(requireAuth);
dependencyRouter.get('/', listDependenciesController);
dependencyRouter.post('/', createDependencyController);
dependencyRouter.delete('/:relationId', deleteDependencyController);
