import type { RequestHandler } from 'express';
import { loginSchema, registerSchema } from './auth.schemas.js';
import { getCurrentUser, loginUser, registerUser } from './auth.service.js';

export const register: RequestHandler = async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const payload = await registerUser(input);

    res.status(201).json(payload);
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const payload = await loginUser(input);

    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

export const me: RequestHandler = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req.userId!);

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};
