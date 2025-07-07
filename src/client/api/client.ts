import { hc } from 'hono/client';
import type { AuthRoutes, ApiRoutes } from '../../server';

// Create typed clients for different route groups
export const authClient = hc<AuthRoutes>('');
export const apiClient = hc<ApiRoutes>('');

// Export individual clients for easy access
export { authClient as auth, apiClient as api };

// Create a combined client type for convenience
export type Client = {
  auth: typeof authClient;
  api: typeof apiClient;
};

// Combined client instance
export const client: Client = {
  auth: authClient,
  api: apiClient,
}; 