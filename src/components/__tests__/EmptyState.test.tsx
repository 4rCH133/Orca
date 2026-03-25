import React from 'react';
import { render } from '@testing-library/react-native';
import { EmptyState } from '../ui/EmptyState';
import { TestWrapper } from '@/test-utils';

describe('EmptyState', () => {
  it('renders icon, title, and subtitle', () => {
    const { getByText } = render(
      <EmptyState icon="◆" title="No saved posts" subtitle="Save posts to search them offline" />,
      { wrapper: TestWrapper },
    );
    expect(getByText('◆')).toBeTruthy();
    expect(getByText('No saved posts')).toBeTruthy();
    expect(getByText('Save posts to search them offline')).toBeTruthy();
  });

  it('renders without subtitle', () => {
    const { getByText, queryByText } = render(
      <EmptyState icon="⌕" title="No results" />,
      { wrapper: TestWrapper },
    );
    expect(getByText('⌕')).toBeTruthy();
    expect(getByText('No results')).toBeTruthy();
    // No subtitle text should exist
  });
});
