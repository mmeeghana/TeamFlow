import { api } from '../../lib/api';
import type { AuthResponse, AuthUser, MessageResponse } from './types';

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type VerifyEmailPayload = {
  email: string;
  otp: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  email: string;
  otp: string;
  newPassword: string;
};

export async function registerUser(payload: RegisterPayload) {
  const response = await api.post<MessageResponse>('/auth/register', payload);
  return response.data;
}

export async function loginUser(payload: LoginPayload) {
  const response = await api.post<AuthResponse>('/auth/login', payload);
  return response.data;
}

export async function fetchCurrentUser() {
  const response = await api.get<{ user: AuthUser }>('/auth/me');
  return response.data.user;
}

export async function verifyEmail(payload: VerifyEmailPayload) {
  const response = await api.post<AuthResponse>('/auth/verify-email', payload);
  return response.data;
}

export async function resendVerification(email: string) {
  const response = await api.post<MessageResponse>('/auth/resend-verification', { email });
  return response.data;
}

export async function forgotPassword(payload: ForgotPasswordPayload) {
  const response = await api.post<MessageResponse>('/auth/forgot-password', payload);
  return response.data;
}

export async function resetPassword(payload: ResetPasswordPayload) {
  const response = await api.post<MessageResponse>('/auth/reset-password', payload);
  return response.data;
}
