import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface LoginResponse {
  message: string;
}

interface AuthResponse {
  isAuthenticated: boolean;
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

// Check authentication status
const checkAuthApi = async (): Promise<AuthResponse> => {
  const response = await fetch('/auth/status');
  if (!response.ok) {
    throw new Error('Failed to check auth status');
  }
  return response.json();
};

export function useAuth() {
  const queryClient = useQueryClient();

  // Query for auth state
  const authQuery = useQuery({
    queryKey: ['auth'],
    queryFn: checkAuthApi,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: loginApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  const login = (password: string) => {
    loginMutation.mutate(password);
  };

  const logout = async () => {
    try {
      // Call logout endpoint to clear server-side cookie
      await fetch('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if server call fails
    }
    
    // Update auth query to show logged out state immediately
    queryClient.setQueryData(['auth'], { isAuthenticated: false });
    // Clear all other cached queries
    queryClient.clear();
  };

  return {
    isAuthenticated: authQuery.data?.isAuthenticated ?? false,
    isLoading: authQuery.isLoading,
    error: loginMutation.error?.message || null,
    login,
    logout,
    isLoggingIn: loginMutation.isPending,
  };
} 