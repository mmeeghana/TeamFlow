import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth.js';
import {
  createTaskController,
  deleteTaskController,
  getTaskController,
  listTasksController,
  updateTaskController,
} from './task.controller.js';

export const taskRouter = Router({ mergeParams: true });

taskRouter.use(requireAuth);
taskRouter.get('/', listTasksController);
taskRouter.post('/', createTaskController);
taskRouter.get('/:taskId', getTaskController);
taskRouter.patch('/:taskId', updateTaskController);
taskRouter.delete('/:taskId', deleteTaskController);
