import type { RequestHandler } from 'express';
import {
  createTaskSchema,
  listTasksSchema,
  moveTaskSchema,
  reorderTasksSchema,
  taskParamsSchema,
  updateTaskDateSchema,
  updateTaskSchema,
} from './task.schemas.js';
import { createTask, deleteTask, getTask, listProjectTasks, moveTask, reorderTasks, updateTask, updateTaskDate } from './task.service.js';

export const listTasksController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId } = taskParamsSchema.pick({ projectId: true }).parse(req.params);
    const input = listTasksSchema.parse(req.query);
    const payload = await listProjectTasks(req.userId!, projectId, input);
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

export const createTaskController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId } = taskParamsSchema.pick({ projectId: true }).parse(req.params);
    const input = createTaskSchema.parse(req.body);
    const task = await createTask(req.userId!, projectId, input);
    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
};

export const getTaskController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId, taskId } = taskParamsSchema.parse(req.params);
    const task = await getTask(req.userId!, projectId, taskId);
    res.status(200).json({ task });
  } catch (error) {
    next(error);
  }
};

export const updateTaskController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId, taskId } = taskParamsSchema.parse(req.params);
    const input = updateTaskSchema.parse(req.body);

    const { task, warning } = await updateTask(
      req.userId!,
      projectId,
      taskId,
      input,
    );

    res.status(200).json({
      task,
      warning,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTaskController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId, taskId } = taskParamsSchema.parse(req.params);
    const payload = await deleteTask(req.userId!, projectId, taskId);
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};export const moveTaskController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId, taskId } = taskParamsSchema.parse(req.params);
    const input = moveTaskSchema.parse(req.body);
    const payload = await moveTask(req.userId!, projectId, taskId, input);
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

export const reorderTasksController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId } = taskParamsSchema.pick({ projectId: true }).parse(req.params);
    const input = reorderTasksSchema.parse(req.body);
    const payload = await reorderTasks(req.userId!, projectId, input);
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};
export const updateTaskDateController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId, taskId } = taskParamsSchema.parse(req.params);
    const input = updateTaskDateSchema.parse(req.body);
    const task = await updateTaskDate(req.userId!, projectId, taskId, input);
    res.status(200).json({ task });
  } catch (error) {
    next(error);
  }
};


