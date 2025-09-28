/**
 * Elite Quick Action Button Component
 * 
 * Quick action button for dashboard with icon and customizable styling.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { THEME } from '../../utils/constants';

interface QuickActionButtonProps {
  title: string;
  icon: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
  style?: any;
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  title,
  icon,
  color,
  onPress,
  disabled = false,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: color + '10', borderColor: color + '30' },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Icon name={icon} size={THEME.SIZES.ICON_LG} color={color} />
      </View>
      
      <Text style={[styles.title, { color }]} numberOfLines={2}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: (THEME.SIZES.SPACE_LG * 4),
    alignItems: 'center',
    padding: THEME.SIZES.SPACE_MD,
    borderRadius: THEME.SIZES.RADIUS_LG,
    borderWidth: 1,
    ...THEME.SHADOWS.SMALL,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: THEME.SIZES.RADIUS_LG,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.SIZES.SPACE_SM,
  },
  title: {
    fontSize: THEME.SIZES.FONT_SM,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
});
