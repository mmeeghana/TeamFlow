import type { RequestHandler } from 'express';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './auth.schemas.js';
import {
  forgotPassword,
  getCurrentUser,
  loginUser,
  registerUser,
  resendVerification,
  resetPassword,
  verifyEmail,
} from './auth.service.js';

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

export const verifyEmailController: RequestHandler = async (req, res, next) => {
  try {
    const input = verifyEmailSchema.parse(req.body);
    const payload = await verifyEmail(input);

    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

export const resendVerificationController: RequestHandler = async (req, res, next) => {
  try {
    const input = resendVerificationSchema.parse(req.body);
    const payload = await resendVerification(input);

    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

export const forgotPasswordController: RequestHandler = async (req, res, next) => {
  try {
    const input = forgotPasswordSchema.parse(req.body);
    const payload = await forgotPassword(input);

    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

export const resetPasswordController: RequestHandler = async (req, res, next) => {
  try {
    const input = resetPasswordSchema.parse(req.body);
    const payload = await resetPassword(input);

    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};
