/**
 * Elite Biometric Authentication Button
 * 
 * Secure biometric authentication component with fallback options
 * and comprehensive error handling.
 */

import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ReactNativeBiometrics from 'react-native-biometrics';
import { THEME } from '../../utils/constants';

interface BiometricButtonProps {
  onPress: () => void;
  disabled?: boolean;
  style?: any;
  textStyle?: any;
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const BiometricButton: React.FC<BiometricButtonProps> = ({
  onPress,
  disabled = false,
  style,
  textStyle,
  showText = true,
  size = 'medium',
}) => {
  const [biometricType, setBiometricType] = useState<'TouchID' | 'FaceID' | 'Biometrics' | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();

      if (available) {
        setIsAvailable(true);
        setBiometricType(biometryType);
      } else {
        setIsAvailable(false);
        setBiometricType(null);
      }
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setIsAvailable(false);
      setBiometricType(null);
    }
  };

  const handlePress = async () => {
    if (!isAvailable || disabled) return;

    try {
      const rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });
      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: 'Authenticate to sign in',
        cancelButtonText: 'Cancel',
      });

      if (success) {
        onPress();
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      Alert.alert(
        'Authentication Failed',
        'Biometric authentication failed. Please try again or use your password.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const getIconName = () => {
    switch (biometricType) {
      case 'TouchID':
        return 'fingerprint';
      case 'FaceID':
        return 'face';
      default:
        return 'security';
    }
  };

  const getButtonText = () => {
    switch (biometricType) {
      case 'TouchID':
        return 'Use Touch ID';
      case 'FaceID':
        return 'Use Face ID';
      default:
        return 'Use Biometrics';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return THEME.SIZES.ICON_SM;
      case 'large':
        return THEME.SIZES.ICON_LG;
      default:
        return THEME.SIZES.ICON_MD;
    }
  };

  const getButtonStyle = () => {
    const baseStyle = styles.button;
    const sizeStyle = styles[size];
    const disabledStyle = disabled ? styles.disabled : {};

    return [baseStyle, sizeStyle, disabledStyle, style];
  };

  if (!isAvailable) {
    return null;
  }

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Icon
        name={getIconName()}
        size={getIconSize()}
        color={disabled ? THEME.COLORS.TEXT_TERTIARY : THEME.COLORS.PRIMARY}
        style={styles.icon}
      />
      
      {showText && (
        <Text style={[
          styles.text,
          textStyle,
          disabled && styles.disabledText
        ]}>
          {getButtonText()}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: THEME.COLORS.BORDER,
    borderRadius: THEME.SIZES.RADIUS_MD,
    paddingHorizontal: THEME.SIZES.SPACE_MD,
    paddingVertical: THEME.SIZES.SPACE_MD,
  },
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
  icon: {
    marginRight: THEME.SIZES.SPACE_SM,
  },
  text: {
    fontSize: THEME.SIZES.FONT_MD,
    fontWeight: '600',
    color: THEME.COLORS.PRIMARY,
  },
  disabled: {
    opacity: 0.5,
    borderColor: THEME.COLORS.BORDER_LIGHT,
  },
  disabledText: {
    color: THEME.COLORS.TEXT_TERTIARY,
  },
});
