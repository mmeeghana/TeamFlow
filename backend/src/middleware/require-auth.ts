import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http-error.js';

type AccessTokenPayload = jwt.JwtPayload & {
  sub: string;
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  const authorizationHeader = req.header('authorization');
  const [scheme, token] = authorizationHeader?.split(' ') ?? [];

  if (scheme !== 'Bearer' || !token) {
    next(new HttpError(401, 'Authentication token is required.'));
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;

    if (!payload.sub) {
      next(new HttpError(401, 'Invalid authentication token.'));
      return;
    }

    req.userId = payload.sub;
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired authentication token.'));
  }
};
