/**
 * Elite Stat Card Component
 * 
 * Dashboard statistics card with trend indicators and customizable styling.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CustomCard } from '../common/CustomCard';
import { THEME } from '../../utils/constants';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  color: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  style?: any;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
  trendValue,
  style,
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      default:
        return 'trending-flat';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return THEME.COLORS.SUCCESS;
      case 'down':
        return THEME.COLORS.ERROR;
      default:
        return THEME.COLORS.TEXT_SECONDARY;
    }
  };

  return (
    <CustomCard style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Icon name={icon} size={THEME.SIZES.ICON_LG} color={color} />
        </View>
        
        {trend && trendValue && (
          <View style={styles.trendContainer}>
            <Icon
              name={getTrendIcon()}
              size={THEME.SIZES.ICON_SM}
              color={getTrendColor()}
            />
            <Text style={[styles.trendText, { color: getTrendColor() }]}>
              {trendValue}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      
      {subtitle && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}
    </CustomCard>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: THEME.SIZES.SPACE_MD,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.SIZES.SPACE_SM,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: THEME.SIZES.RADIUS_MD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: THEME.SIZES.FONT_SM,
    fontWeight: '600',
    marginLeft: THEME.SIZES.SPACE_XS,
  },
  title: {
    fontSize: THEME.SIZES.FONT_SM,
    color: THEME.COLORS.TEXT_SECONDARY,
    marginBottom: THEME.SIZES.SPACE_XS,
  },
  value: {
    fontSize: THEME.SIZES.FONT_XL,
    fontWeight: 'bold',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SIZES.SPACE_XS,
  },
  subtitle: {
    fontSize: THEME.SIZES.FONT_XS,
    color: THEME.COLORS.TEXT_TERTIARY,
  },
});
