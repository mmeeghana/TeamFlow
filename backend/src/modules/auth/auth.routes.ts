import { Router } from 'express';
import { otpRateLimiter } from '../../middleware/rate-limit.js';
import { requireAuth } from '../../middleware/require-auth.js';
import {
  forgotPasswordController,
  login,
  me,
  register,
  resendVerificationController,
  resetPasswordController,
  verifyEmailController,
} from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/verify-email', otpRateLimiter, verifyEmailController);
authRouter.post('/resend-verification', otpRateLimiter, resendVerificationController);
authRouter.post('/forgot-password', otpRateLimiter, forgotPasswordController);
authRouter.post('/reset-password', otpRateLimiter, resetPasswordController);
authRouter.get('/me', requireAuth, me);
