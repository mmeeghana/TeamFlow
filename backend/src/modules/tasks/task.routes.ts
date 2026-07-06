import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth.js';
import {
  createTaskController,
  deleteTaskController,
  getTaskController,
  listTasksController,
  moveTaskController,
  reorderTasksController,
  updateTaskController,
  updateTaskDateController,
} from './task.controller.js';

export const taskRouter = Router({ mergeParams: true });

taskRouter.use(requireAuth);
taskRouter.get('/', listTasksController);
taskRouter.post('/', createTaskController);
taskRouter.patch('/reorder', reorderTasksController);
taskRouter.get('/:taskId', getTaskController);
taskRouter.patch('/:taskId', updateTaskController);
taskRouter.patch('/:taskId/move', moveTaskController);
taskRouter.patch('/:taskId/date', updateTaskDateController);
taskRouter.delete('/:taskId', deleteTaskController);



