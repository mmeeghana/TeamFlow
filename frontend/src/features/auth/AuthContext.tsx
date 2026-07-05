import { useEffect, useMemo, useState } from 'react';
import {
  clearStoredAccessToken,
  getStoredAccessToken,
  storeAccessToken,
} from '../../lib/auth-token';
import { fetchCurrentUser, loginUser, registerUser, verifyEmail } from './auth-api';
import { AuthContext, type AuthContextValue } from './auth-context-value';
import type { AuthUser } from './types';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      const token = getStoredAccessToken();

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await fetchCurrentUser();

        if (isMounted) {
          setUser(currentUser);
        }
      } catch {
        clearStoredAccessToken();
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login: async (payload) => {
        const auth = await loginUser(payload);
        storeAccessToken(auth.accessToken);
        setUser(auth.user);
      },
      register: async (payload) => {
        const response = await registerUser(payload);
        return response.message;
      },
      verifyEmail: async (payload) => {
        const auth = await verifyEmail(payload);
        storeAccessToken(auth.accessToken);
        setUser(auth.user);
      },
      logout: () => {
        clearStoredAccessToken();
        setUser(null);
      },
    }),
    [isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
