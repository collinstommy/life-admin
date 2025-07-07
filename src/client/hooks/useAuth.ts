import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { InferResponseType } from 'hono/client';
import { client } from '../api/client';

// API functions using typed client with inferred types
const authApi = {
  async login(password: string) {
    const response = await client.auth.auth.login.$post({
      json: { password }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Login failed (${response.status}): ${errorText}`);
    }
    
    return response.json();
  },
  
  async checkAuth() {
    const response = await client.auth.auth.status.$get();
    if (!response.ok) {
      throw new Error('Failed to check auth status');
    }
    return response.json();
  },
  
  async logout() {
    const response = await client.auth.auth.logout.$post({});
    if (!response.ok) {
      throw new Error('Logout failed');
    }
    return response.json();
  }
};

// Inferred types from server
type CheckAuthResponse = InferResponseType<typeof client.auth.auth.status.$get>;

export function useAuth() {
  const queryClient = useQueryClient();

  // Query for auth state with inferred types
  const authQuery = useQuery({
    queryKey: ['auth'],
    queryFn: authApi.checkAuth,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
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
      await authApi.logout();
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