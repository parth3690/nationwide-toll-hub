/**
 * Elite Custom Input Component
 * 
 * Reusable, accessible input component with validation,
 * icons, and comprehensive styling options.
 */

import React, { forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { THEME } from '../../utils/constants';

interface CustomInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: string;
  rightIcon?: string;
  onLeftIconPress?: () => void;
  onRightIconPress?: () => void;
  containerStyle?: any;
  inputStyle?: any;
  labelStyle?: any;
  errorStyle?: any;
  iconSize?: number;
  iconColor?: string;
  required?: boolean;
  disabled?: boolean;
}

export const CustomInput = forwardRef<TextInput, CustomInputProps>(({
  label,
  error,
  leftIcon,
  rightIcon,
  onLeftIconPress,
  onRightIconPress,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  iconSize = THEME.SIZES.ICON_MD,
  iconColor = THEME.COLORS.TEXT_SECONDARY,
  required = false,
  disabled = false,
  ...props
}, ref) => {
  const hasError = Boolean(error);
  const isDisabled = disabled || props.editable === false;

  const getBorderColor = () => {
    if (hasError) return THEME.COLORS.ERROR;
    if (isDisabled) return THEME.COLORS.BORDER_LIGHT;
    return THEME.COLORS.BORDER;
  };

  const getBackgroundColor = () => {
    if (isDisabled) return THEME.COLORS.BACKGROUND_SECONDARY;
    return THEME.COLORS.WHITE;
  };

  const getTextColor = () => {
    if (isDisabled) return THEME.COLORS.TEXT_TERTIARY;
    return THEME.COLORS.TEXT_PRIMARY;
  };

  const renderLeftIcon = () => {
    if (!leftIcon) return null;

    if (onLeftIconPress) {
      return (
        <TouchableOpacity
          onPress={onLeftIconPress}
          style={styles.iconButton}
          disabled={isDisabled}
        >
          <Icon
            name={leftIcon}
            size={iconSize}
            color={isDisabled ? THEME.COLORS.TEXT_TERTIARY : iconColor}
          />
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.iconContainer}>
        <Icon
          name={leftIcon}
          size={iconSize}
          color={isDisabled ? THEME.COLORS.TEXT_TERTIARY : iconColor}
        />
      </View>
    );
  };

  const renderRightIcon = () => {
    if (!rightIcon) return null;

    if (onRightIconPress) {
      return (
        <TouchableOpacity
          onPress={onRightIconPress}
          style={styles.iconButton}
          disabled={isDisabled}
        >
          <Icon
            name={rightIcon}
            size={iconSize}
            color={isDisabled ? THEME.COLORS.TEXT_TERTIARY : iconColor}
          />
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.iconContainer}>
        <Icon
          name={rightIcon}
          size={iconSize}
          color={isDisabled ? THEME.COLORS.TEXT_TERTIARY : iconColor}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      {label && (
        <Text style={[
          styles.label,
          labelStyle,
          isDisabled && styles.labelDisabled
        ]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      {/* Input Container */}
      <View style={[
        styles.inputContainer,
        {
          borderColor: getBorderColor(),
          backgroundColor: getBackgroundColor(),
        },
        isDisabled && styles.inputContainerDisabled,
        hasError && styles.inputContainerError,
      ]}>
        {/* Left Icon */}
        {renderLeftIcon()}

        {/* Text Input */}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            inputStyle,
            {
              color: getTextColor(),
              paddingLeft: leftIcon ? THEME.SIZES.SPACE_SM : THEME.SIZES.SPACE_MD,
              paddingRight: rightIcon ? THEME.SIZES.SPACE_SM : THEME.SIZES.SPACE_MD,
            },
          ]}
          placeholderTextColor={THEME.COLORS.TEXT_TERTIARY}
          editable={!isDisabled}
          {...props}
        />

        {/* Right Icon */}
        {renderRightIcon()}
      </View>

      {/* Error Message */}
      {hasError && (
        <Text style={[styles.error, errorStyle]}>
          {error}
        </Text>
      )}
    </View>
  );
});

CustomInput.displayName = 'CustomInput';

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  label: {
    fontSize: THEME.SIZES.FONT_SM,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SIZES.SPACE_XS,
  },
  labelDisabled: {
    color: THEME.COLORS.TEXT_TERTIARY,
  },
  required: {
    color: THEME.COLORS.ERROR,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: THEME.SIZES.RADIUS_MD,
    minHeight: THEME.SIZES.INPUT_MD,
    paddingHorizontal: THEME.SIZES.SPACE_MD,
  },
  inputContainerDisabled: {
    opacity: 0.6,
  },
  inputContainerError: {
    borderColor: THEME.COLORS.ERROR,
  },
  input: {
    flex: 1,
    fontSize: THEME.SIZES.FONT_MD,
    lineHeight: 20,
    paddingVertical: THEME.SIZES.SPACE_MD,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: THEME.SIZES.SPACE_XS,
  },
  error: {
    fontSize: THEME.SIZES.FONT_SM,
    color: THEME.COLORS.ERROR,
    marginTop: THEME.SIZES.SPACE_XS,
    marginLeft: THEME.SIZES.SPACE_XS,
  },
});
