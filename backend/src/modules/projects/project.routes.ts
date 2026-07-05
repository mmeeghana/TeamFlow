import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth.js';
import {
  createProjectController,
  deleteProjectController,
  getProjectController,
  inviteMemberController,
  listProjectsController,
  removeMemberController,
  updateProjectController,
} from './project.controller.js';

export const projectRouter = Router();

projectRouter.use(requireAuth);
projectRouter.get('/', listProjectsController);
projectRouter.post('/', createProjectController);
projectRouter.get('/:projectId', getProjectController);
projectRouter.patch('/:projectId', updateProjectController);
projectRouter.delete('/:projectId', deleteProjectController);
projectRouter.post('/:projectId/members', inviteMemberController);
projectRouter.delete('/:projectId/members/:userId', removeMemberController);
