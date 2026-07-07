import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth.js';
import { activityRouter } from '../activity/activity.routes.js';
import { rcaRouter } from '../rcas/rca.routes.js';
import { taskRouter } from '../tasks/task.routes.js';
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
projectRouter.use('/:projectId/activity', activityRouter);
projectRouter.use('/:projectId/rcas', rcaRouter);
projectRouter.use('/:projectId/tasks', taskRouter);


