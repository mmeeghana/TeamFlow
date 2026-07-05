import { api } from '../../lib/api';
import type { AuthResponse, AuthUser } from './types';

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export async function registerUser(payload: RegisterPayload) {
  const response = await api.post<AuthResponse>('/auth/register', payload);
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
