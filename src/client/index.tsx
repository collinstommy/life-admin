import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HealthTrackerApp } from './components/HealthTrackerApp';
import '../styles.css';

// Create a query client with good defaults for your health app
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(
    <QueryClientProvider client={queryClient}>
      <HealthTrackerApp />
      {/* Only show devtools in development */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
} else {
  console.error('Could not find app container element');
} 