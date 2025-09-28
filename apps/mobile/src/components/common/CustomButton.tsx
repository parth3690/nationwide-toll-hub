/**
 * Elite Custom Button Component
 * 
 * Reusable, accessible button component with multiple variants,
 * loading states, and comprehensive styling options.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { THEME } from '../../utils/constants';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface CustomButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  gradient?: boolean;
  gradientColors?: string[];
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
  gradient = false,
  gradientColors,
  ...props
}) => {
  const isDisabled = disabled || loading;

  const getButtonStyle = (): ViewStyle => {
    const baseStyle = styles.base;
    const sizeStyle = styles[size];
    const variantStyle = styles[variant];
    const disabledStyle = isDisabled ? styles.disabled : {};
    const fullWidthStyle = fullWidth ? styles.fullWidth : {};

    return {
      ...baseStyle,
      ...sizeStyle,
      ...variantStyle,
      ...disabledStyle,
      ...fullWidthStyle,
      ...style,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle = styles.baseText;
    const sizeTextStyle = styles[`${size}Text`];
    const variantTextStyle = styles[`${variant}Text`];
    const disabledTextStyle = isDisabled ? styles.disabledText : {};

    return {
      ...baseTextStyle,
      ...sizeTextStyle,
      ...variantTextStyle,
      ...disabledTextStyle,
      ...textStyle,
    };
  };

  const getGradientColors = (): string[] => {
    if (gradientColors) return gradientColors;

    switch (variant) {
      case 'primary':
        return [THEME.COLORS.PRIMARY, THEME.COLORS.PRIMARY_DARK];
      case 'secondary':
        return [THEME.COLORS.SECONDARY, THEME.COLORS.SECONDARY_DARK];
      case 'danger':
        return [THEME.COLORS.ERROR, THEME.COLORS.ACCENT_DARK];
      default:
        return [THEME.COLORS.PRIMARY, THEME.COLORS.PRIMARY_DARK];
    }
  };

  const renderContent = () => (
    <>
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? THEME.COLORS.PRIMARY : THEME.COLORS.WHITE}
          style={iconPosition === 'right' ? styles.loadingRight : styles.loadingLeft}
        />
      )}
      
      {icon && !loading && (
        <Icon
          name={icon}
          size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
          color={getTextStyle().color}
          style={iconPosition === 'right' ? styles.iconRight : styles.iconLeft}
        />
      )}
      
      <Text style={getTextStyle()}>
        {title}
      </Text>
    </>
  );

  const ButtonWrapper = gradient && !isDisabled ? LinearGradient : TouchableOpacity;
  const buttonProps = gradient && !isDisabled 
    ? { colors: getGradientColors(), start: { x: 0, y: 0 }, end: { x: 1, y: 0 } }
    : {};

  return (
    <ButtonWrapper
      style={getButtonStyle()}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...buttonProps}
      {...props}
    >
      {renderContent()}
    </ButtonWrapper>
  );
};

const styles = StyleSheet.create({
  // Base styles
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: THEME.SIZES.RADIUS_MD,
    paddingHorizontal: THEME.SIZES.SPACE_MD,
    ...THEME.SHADOWS.SMALL,
  },
  baseText: {
    fontWeight: '600',
    textAlign: 'center',
  },

  // Size styles
  small: {
    height: THEME.SIZES.BUTTON_SM,
    paddingHorizontal: THEME.SIZES.SPACE_SM,
  },
  medium: {
    height: THEME.SIZES.BUTTON_MD,
    paddingHorizontal: THEME.SIZES.SPACE_MD,
  },
  large: {
    height: THEME.SIZES.BUTTON_LG,
    paddingHorizontal: THEME.SIZES.SPACE_LG,
  },

  // Size text styles
  smallText: {
    fontSize: THEME.SIZES.FONT_SM,
  },
  mediumText: {
    fontSize: THEME.SIZES.FONT_MD,
  },
  largeText: {
    fontSize: THEME.SIZES.FONT_LG,
  },

  // Variant styles
  primary: {
    backgroundColor: THEME.COLORS.PRIMARY,
  },
  secondary: {
    backgroundColor: THEME.COLORS.SECONDARY,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: THEME.COLORS.PRIMARY,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: THEME.COLORS.ERROR,
  },

  // Variant text styles
  primaryText: {
    color: THEME.COLORS.WHITE,
  },
  secondaryText: {
    color: THEME.COLORS.WHITE,
  },
  outlineText: {
    color: THEME.COLORS.PRIMARY,
  },
  ghostText: {
    color: THEME.COLORS.PRIMARY,
  },
  dangerText: {
    color: THEME.COLORS.WHITE,
  },

  // State styles
  disabled: {
    opacity: 0.5,
    backgroundColor: THEME.COLORS.GRAY_300,
  },
  disabledText: {
    color: THEME.COLORS.TEXT_TERTIARY,
  },

  // Layout styles
  fullWidth: {
    width: '100%',
  },

  // Icon styles
  iconLeft: {
    marginRight: THEME.SIZES.SPACE_SM,
  },
  iconRight: {
    marginLeft: THEME.SIZES.SPACE_SM,
  },

  // Loading styles
  loadingLeft: {
    marginRight: THEME.SIZES.SPACE_SM,
  },
  loadingRight: {
    marginLeft: THEME.SIZES.SPACE_SM,
  },
});
