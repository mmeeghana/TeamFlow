import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { sendPasswordResetEmail, sendVerificationEmail } from '../email/email.service.js';
import { HttpError } from '../../utils/http-error.js';
import { compareOtp, generateOtp, getOtpExpirationDate, hashOtp } from '../../utils/otp.js';
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResendVerificationInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from './auth.schemas.js';

const PASSWORD_SALT_ROUNDS = 12;

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function sanitizeUser(user: AuthUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function signAccessToken(userId: string) {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as StringValue,
  });
}

async function createVerificationOtp(email: string) {
  const otp = generateOtp();
  const otpHash = await hashOtp(otp);

  await prisma.user.update({
    where: { email },
    data: {
      verificationOtpHash: otpHash,
      verificationOtpExpires: getOtpExpirationDate(),
    },
  });

  await sendVerificationEmail(email, otp);
}

export async function registerUser(input: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existingUser) {
    throw new HttpError(409, 'An account with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);
  const otp = generateOtp();
  const verificationOtpHash = await hashOtp(otp);

  await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      verificationOtpHash,
      verificationOtpExpires: getOtpExpirationDate(),
    },
  });

  await sendVerificationEmail(input.email, otp);

  return {
    message: 'Verification code sent.',
  };
}

export async function verifyEmail(input: VerifyEmailInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      isActive: true,
      isVerified: true,
      verificationOtpHash: true,
      verificationOtpExpires: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user || !user.isActive) {
    throw new HttpError(404, 'Account not found.');
  }

  if (user.isVerified) {
    return {
      user: sanitizeUser(user),
      accessToken: signAccessToken(user.id),
    };
  }

  if (!user.verificationOtpHash || !user.verificationOtpExpires) {
    throw new HttpError(400, 'Verification code is not available. Please request a new code.');
  }

  if (user.verificationOtpExpires.getTime() < Date.now()) {
    throw new HttpError(400, 'Verification code has expired. Please request a new code.');
  }

  const isOtpValid = await compareOtp(input.otp, user.verificationOtpHash);

  if (!isOtpValid) {
    throw new HttpError(400, 'Invalid verification code.');
  }

  const verifiedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      verificationOtpHash: null,
      verificationOtpExpires: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    user: sanitizeUser(verifiedUser),
    accessToken: signAccessToken(verifiedUser.id),
  };
}

export async function resendVerification(input: ResendVerificationInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { email: true, isActive: true, isVerified: true },
  });

  if (!user || !user.isActive) {
    throw new HttpError(404, 'Account not found.');
  }

  if (user.isVerified) {
    throw new HttpError(409, 'Email is already verified.');
  }

  await createVerificationOtp(user.email);

  return {
    message: 'Verification code sent.',
  };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      role: true,
      avatarUrl: true,
      isActive: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user || !user.isActive) {
    throw new HttpError(401, 'Invalid email or password.');
  }

  if (!user.isVerified) {
    throw new HttpError(403, 'Please verify your email before logging in.');
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new HttpError(401, 'Invalid email or password.');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    user: sanitizeUser(user),
    accessToken: signAccessToken(user.id),
  };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      isActive: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user || !user.isActive) {
    throw new HttpError(401, 'User is no longer active.');
  }

  return sanitizeUser(user);
}

export async function forgotPassword(input: ForgotPasswordInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { email: true, isActive: true },
  });

  if (user?.isActive) {
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);

    await prisma.user.update({
      where: { email: input.email },
      data: {
        passwordResetOtpHash: otpHash,
        passwordResetOtpExpires: getOtpExpirationDate(),
      },
    });

    await sendPasswordResetEmail(input.email, otp);
  }

  return {
    message: 'If an account exists for this email, a password reset code has been sent.',
  };
}

export async function resetPassword(input: ResetPasswordInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      passwordResetOtpHash: true,
      passwordResetOtpExpires: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    throw new HttpError(400, 'Invalid or expired password reset code.');
  }

  if (!user.passwordResetOtpHash || !user.passwordResetOtpExpires) {
    throw new HttpError(400, 'Invalid or expired password reset code.');
  }

  if (user.passwordResetOtpExpires.getTime() < Date.now()) {
    throw new HttpError(400, 'Invalid or expired password reset code.');
  }

  const isOtpValid = await compareOtp(input.otp, user.passwordResetOtpHash);

  if (!isOtpValid) {
    throw new HttpError(400, 'Invalid or expired password reset code.');
  }

  const passwordHash = await bcrypt.hash(input.newPassword, PASSWORD_SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetOtpHash: null,
      passwordResetOtpExpires: null,
    },
  });

  return {
    message: 'Password reset successfully.',
  };
}
