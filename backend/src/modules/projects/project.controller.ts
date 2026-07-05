import type { RequestHandler } from 'express';
import {
  createProjectSchema,
  inviteMemberSchema,
  listProjectsSchema,
  memberParamsSchema,
  projectIdParamsSchema,
  updateProjectSchema,
} from './project.schemas.js';
import {
  createProject,
  deleteProject,
  getProjectById,
  inviteProjectMember,
  listProjects,
  removeProjectMember,
  updateProject,
} from './project.service.js';

export const listProjectsController: RequestHandler = async (req, res, next) => {
  try {
    const input = listProjectsSchema.parse(req.query);
    const payload = await listProjects(req.userId!, input);
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

export const createProjectController: RequestHandler = async (req, res, next) => {
  try {
    const input = createProjectSchema.parse(req.body);
    const project = await createProject(req.userId!, input);
    res.status(201).json({ project });
  } catch (error) {
    next(error);
  }
};

export const getProjectController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId } = projectIdParamsSchema.parse(req.params);
    const project = await getProjectById(req.userId!, projectId);
    res.status(200).json({ project });
  } catch (error) {
    next(error);
  }
};

export const updateProjectController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId } = projectIdParamsSchema.parse(req.params);
    const input = updateProjectSchema.parse(req.body);
    const project = await updateProject(req.userId!, projectId, input);
    res.status(200).json({ project });
  } catch (error) {
    next(error);
  }
};

export const deleteProjectController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId } = projectIdParamsSchema.parse(req.params);
    const payload = await deleteProject(req.userId!, projectId);
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

export const inviteMemberController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId } = projectIdParamsSchema.parse(req.params);
    const input = inviteMemberSchema.parse(req.body);
    const member = await inviteProjectMember(req.userId!, projectId, input);
    res.status(201).json({ member });
  } catch (error) {
    next(error);
  }
};

export const removeMemberController: RequestHandler = async (req, res, next) => {
  try {
    const { projectId, userId } = memberParamsSchema.parse(req.params);
    const payload = await removeProjectMember(req.userId!, projectId, userId);
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};
