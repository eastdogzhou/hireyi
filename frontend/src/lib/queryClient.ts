/**
 * React Query Configuration
 * 配置 React Query (TanStack Query)
 */

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes
      staleTime: 5 * 60 * 1000,
      // Garbage collection time: 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed queries 3 times
      retry: 3,
      // Exponential backoff with max 30 seconds
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
})
