import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { VoteButtons } from '../ui/VoteButtons';
import { TestWrapper } from '@/test-utils';

describe('VoteButtons', () => {
  const defaultProps = {
    score: 142,
    likes: null as boolean | null,
    onUpvote: jest.fn(),
    onDownvote: jest.fn(),
  };

  beforeEach(() => {
    defaultProps.onUpvote.mockClear();
    defaultProps.onDownvote.mockClear();
  });

  it('renders the formatted score', () => {
    const { getByText } = render(
      <VoteButtons {...defaultProps} />,
      { wrapper: TestWrapper },
    );
    expect(getByText('142')).toBeTruthy();
  });

  it('renders + and − buttons', () => {
    const { getByText } = render(
      <VoteButtons {...defaultProps} />,
      { wrapper: TestWrapper },
    );
    expect(getByText('+')).toBeTruthy();
    expect(getByText('−')).toBeTruthy();
  });

  it('calls onUpvote when + is pressed', () => {
    const { getByText } = render(
      <VoteButtons {...defaultProps} />,
      { wrapper: TestWrapper },
    );
    fireEvent.press(getByText('+'));
    expect(defaultProps.onUpvote).toHaveBeenCalledTimes(1);
  });

  it('calls onDownvote when − is pressed', () => {
    const { getByText } = render(
      <VoteButtons {...defaultProps} />,
      { wrapper: TestWrapper },
    );
    fireEvent.press(getByText('−'));
    expect(defaultProps.onDownvote).toHaveBeenCalledTimes(1);
  });

  it('renders large scores formatted (e.g., 14.2k)', () => {
    const { getByText } = render(
      <VoteButtons {...defaultProps} score={14200} />,
      { wrapper: TestWrapper },
    );
    expect(getByText('14.2k')).toBeTruthy();
  });

  it('renders in compact mode without crashing', () => {
    const { getByText } = render(
      <VoteButtons {...defaultProps} compact />,
      { wrapper: TestWrapper },
    );
    expect(getByText('142')).toBeTruthy();
  });
});
