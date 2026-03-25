/**
 * Test utilities — wrappers for rendering components in tests.
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/theme/ThemeProvider';

const testQueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

/**
 * Wraps children with all required providers for component tests.
 * Use with @testing-library/react-native render:
 *   render(<MyComponent />, { wrapper: TestWrapper });
 */
export function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={testQueryClient}>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryClientProvider>
  );
}
