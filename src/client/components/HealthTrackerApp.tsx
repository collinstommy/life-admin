import React from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { LoginForm } from './LoginForm';
import { useAuth } from '../hooks/useAuth';
import { router } from '../router';

export function HealthTrackerApp() {
  const { isAuthenticated, isLoading } = useAuth();

  console.log('HealthTrackerApp render - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Show the router-based app when authenticated
  return <RouterProvider router={router} />;
} 