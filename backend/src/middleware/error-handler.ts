import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  void next;

  if (error instanceof ZodError) {
    res.status(400).json({
      message: 'Validation failed.',
      errors: error.flatten().fieldErrors,
    });
    return;
  }

  const statusCode = typeof error.statusCode === 'number' ? error.statusCode : 500;

  res.status(statusCode).json({
    message: statusCode === 500 ? 'Internal server error' : error.message,
    ...(env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
  });
};
