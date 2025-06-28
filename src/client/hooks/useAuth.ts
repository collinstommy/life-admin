import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface LoginRequest {
  password: string;
}

interface LoginResponse {
  message: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// API function for login
const loginApi = async (password: string): Promise<LoginResponse> => {
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Login failed');
  }

  return response.json();
};

// Check if user is authenticated by making a test API call
const checkAuthApi = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/health-log');
    return response.ok;
  } catch {
    return false;
  }
};

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const queryClient = useQueryClient();

  // Check authentication status on mount
  useEffect(() => {
    checkAuthApi().then(isAuthenticated => {
      setAuthState({
        isAuthenticated,
        isLoading: false,
        error: null,
      });
    });
  }, []);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: loginApi,
    onSuccess: () => {
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      // Clear any cached queries since auth state changed
      queryClient.clear();
    },
    onError: (error: Error) => {
      setAuthState(prev => ({
        ...prev,
        error: error.message,
        isLoading: false,
      }));
    },
  });

  const login = (password: string) => {
    setAuthState(prev => ({ ...prev, error: null, isLoading: true }));
    loginMutation.mutate(password);
  };

  const logout = () => {
    // Since we're using HTTP-only cookies, we can't directly clear them
    // We'll just update the local state and clear the cache
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    queryClient.clear();
  };

  return {
    ...authState,
    login,
    logout,
    isLoggingIn: loginMutation.isPending,
  };
} 