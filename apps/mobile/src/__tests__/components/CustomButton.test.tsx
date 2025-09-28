/**
 * Elite Custom Button Component Tests
 * 
 * Comprehensive testing for the CustomButton component with various
 * props, states, and user interactions.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CustomButton } from '../../components/common/CustomButton';

describe('CustomButton Component', () => {
  const defaultProps = {
    title: 'Test Button',
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    const { getByText } = render(<CustomButton {...defaultProps} />);
    
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <CustomButton {...defaultProps} onPress={mockOnPress} />
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <CustomButton {...defaultProps} onPress={mockOnPress} disabled />
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('shows loading state correctly', () => {
    const { getByTestId } = render(
      <CustomButton {...defaultProps} loading />
    );
    
    expect(getByTestId('loading-spinner')).toBeTruthy();
  });

  it('renders with outline variant', () => {
    const { getByText } = render(
      <CustomButton {...defaultProps} variant="outline" />
    );
    
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('renders with custom style', () => {
    const customStyle = { backgroundColor: 'red' };
    const { getByText } = render(
      <CustomButton {...defaultProps} style={customStyle} />
    );
    
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('renders with icon', () => {
    const { getByText } = render(
      <CustomButton {...defaultProps} icon="home" />
    );
    
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('renders with gradient when specified', () => {
    const { getByText } = render(
      <CustomButton {...defaultProps} gradient />
    );
    
    expect(getByText('Test Button')).toBeTruthy();
  });
});
