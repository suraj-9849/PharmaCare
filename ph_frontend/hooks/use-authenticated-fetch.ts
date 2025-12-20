'use client';

import { useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

/**
 * Hook that returns a wrapper function for API calls that only executes when authenticated.
 * This prevents unauthorized API calls from being made before authentication is established.
 */
export function useAuthenticatedFetch() {
  const { isAuthenticated, isLoading } = useAuth();

  const authenticatedFetch = useCallback(
    async <T>(fetchFn: () => Promise<T>): Promise<T | null> => {
      // Don't make API calls while auth is loading or if not authenticated
      if (isLoading || !isAuthenticated) {
        return null;
      }
      return fetchFn();
    },
    [isAuthenticated, isLoading]
  );

  return {
    authenticatedFetch,
    isAuthReady: !isLoading && isAuthenticated,
    isLoading,
    isAuthenticated,
  };
}
