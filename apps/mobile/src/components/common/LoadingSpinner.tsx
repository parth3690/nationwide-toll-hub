/**
 * Elite Loading Spinner Component
 * 
 * Reusable loading spinner with customizable size, color, and overlay options.
 */

import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import { THEME } from '../../utils/constants';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface LoadingSpinnerProps {
  visible?: boolean;
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  overlay?: boolean;
  style?: any;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  visible = true,
  size = 'large',
  color = THEME.COLORS.PRIMARY,
  text,
  overlay = false,
  style,
}) => {
  if (overlay) {
    return (
      <Modal
        transparent
        visible={visible}
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <View style={styles.overlayContent}>
            <ActivityIndicator size={size} color={color} />
            {text && <Text style={styles.overlayText}>{text}</Text>}
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.SIZES.SPACE_LG,
  },
  text: {
    fontSize: THEME.SIZES.FONT_MD,
    color: THEME.COLORS.TEXT_SECONDARY,
    marginTop: THEME.SIZES.SPACE_MD,
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    backgroundColor: THEME.COLORS.WHITE,
    borderRadius: THEME.SIZES.RADIUS_LG,
    padding: THEME.SIZES.SPACE_2XL,
    alignItems: 'center',
    minWidth: 120,
    ...THEME.SHADOWS.LARGE,
  },
  overlayText: {
    fontSize: THEME.SIZES.FONT_MD,
    color: THEME.COLORS.TEXT_PRIMARY,
    marginTop: THEME.SIZES.SPACE_MD,
    textAlign: 'center',
  },
});
