import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorState } from '../ui/ErrorState';
import { TestWrapper } from '@/test-utils';

describe('ErrorState', () => {
  it('renders the default error message', () => {
    const { getByText } = render(<ErrorState />, { wrapper: TestWrapper });
    expect(getByText('Something went wrong.')).toBeTruthy();
  });

  it('renders a custom error message', () => {
    const { getByText } = render(
      <ErrorState message="Failed to load post." />,
      { wrapper: TestWrapper },
    );
    expect(getByText('Failed to load post.')).toBeTruthy();
  });

  it('renders retry button when onRetry is provided', () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <ErrorState message="Error" onRetry={onRetry} />,
      { wrapper: TestWrapper },
    );
    expect(getByText('Try Again')).toBeTruthy();
  });

  it('does not render retry button when onRetry is undefined', () => {
    const { queryByText } = render(
      <ErrorState message="Error" />,
      { wrapper: TestWrapper },
    );
    expect(queryByText('Try Again')).toBeNull();
  });

  it('calls onRetry when retry button is pressed', () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <ErrorState message="Error" onRetry={onRetry} />,
      { wrapper: TestWrapper },
    );
    fireEvent.press(getByText('Try Again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
