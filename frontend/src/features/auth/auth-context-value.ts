import { createContext } from 'react';
import type { LoginPayload, RegisterPayload, VerifyEmailPayload } from './auth-api';
import type { AuthUser } from './types';

export type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<string>;
  verifyEmail: (payload: VerifyEmailPayload) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
