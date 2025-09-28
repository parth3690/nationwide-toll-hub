/**
 * Elite Custom Card Component
 * 
 * Reusable card component with shadows, borders, and customizable content.
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { THEME } from '../../utils/constants';

interface CustomCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
  elevation?: 'small' | 'medium' | 'large';
  borderRadius?: number;
  backgroundColor?: string;
  padding?: number;
  margin?: number;
}

export const CustomCard: React.FC<CustomCardProps> = ({
  children,
  style,
  onPress,
  disabled = false,
  elevation = 'medium',
  borderRadius = THEME.SIZES.RADIUS_LG,
  backgroundColor = THEME.COLORS.WHITE,
  padding = THEME.SIZES.SPACE_LG,
  margin = 0,
}) => {
  const getShadowStyle = () => {
    switch (elevation) {
      case 'small':
        return THEME.SHADOWS.SMALL;
      case 'large':
        return THEME.SHADOWS.LARGE;
      default:
        return THEME.SHADOWS.MEDIUM;
    }
  };

  const cardStyle: ViewStyle = {
    backgroundColor,
    borderRadius,
    padding,
    margin,
    ...getShadowStyle(),
    ...style,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
};
