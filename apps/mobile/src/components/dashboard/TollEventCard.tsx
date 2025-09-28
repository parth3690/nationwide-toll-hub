/**
 * Elite Toll Event Card Component
 * 
 * Card component for displaying toll events with status, amount, and actions.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CustomCard } from '../common/CustomCard';
import { MobileTollEvent, TOLL_STATUS } from '../../types';
import { THEME, DATE_FORMATS } from '../../utils/constants';

interface TollEventCardProps {
  tollEvent: MobileTollEvent;
  onPress: () => void;
  onFavorite?: (tollId: string) => void;
  onDispute?: (tollId: string) => void;
  style?: any;
}

export const TollEventCard: React.FC<TollEventCardProps> = ({
  tollEvent,
  onPress,
  onFavorite,
  onDispute,
  style,
}) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = () => {
    switch (tollEvent.status) {
      case TOLL_STATUS.PAID:
        return THEME.COLORS.SUCCESS;
      case TOLL_STATUS.PENDING:
        return THEME.COLORS.WARNING;
      case TOLL_STATUS.DISPUTED:
        return THEME.COLORS.ERROR;
      case TOLL_STATUS.FAILED:
        return THEME.COLORS.ERROR;
      default:
        return THEME.COLORS.TEXT_SECONDARY;
    }
  };

  const getStatusIcon = () => {
    switch (tollEvent.status) {
      case TOLL_STATUS.PAID:
        return 'check-circle';
      case TOLL_STATUS.PENDING:
        return 'schedule';
      case TOLL_STATUS.DISPUTED:
        return 'gavel';
      case TOLL_STATUS.FAILED:
        return 'error';
      default:
        return 'help';
    }
  };

  const handleFavoritePress = () => {
    if (onFavorite) {
      onFavorite(tollEvent.id);
    }
  };

  const handleDisputePress = () => {
    if (onDispute) {
      onDispute(tollEvent.id);
    }
  };

  return (
    <CustomCard style={[styles.container, style]} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.locationContainer}>
          <Icon name="location-on" size={THEME.SIZES.ICON_SM} color={THEME.COLORS.TEXT_SECONDARY} />
          <Text style={styles.location} numberOfLines={1}>
            {tollEvent.location.name}
          </Text>
        </View>
        
        <TouchableOpacity
          onPress={handleFavoritePress}
          style={styles.favoriteButton}
        >
          <Icon
            name={tollEvent.isFavorited ? 'favorite' : 'favorite-border'}
            size={THEME.SIZES.ICON_MD}
            color={tollEvent.isFavorited ? THEME.COLORS.ERROR : THEME.COLORS.TEXT_SECONDARY}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.leftContent}>
          <Text style={styles.date}>
            {formatDate(tollEvent.timestamp)}
          </Text>
          
          <View style={styles.vehicleContainer}>
            <Icon name="directions-car" size={THEME.SIZES.ICON_SM} color={THEME.COLORS.TEXT_SECONDARY} />
            <Text style={styles.licensePlate}>
              {tollEvent.vehicle.licensePlate}
            </Text>
          </View>

          <View style={styles.agencyContainer}>
            <Text style={styles.agency}>
              {tollEvent.agencyId.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.rightContent}>
          <Text style={styles.amount}>
            ${tollEvent.amount.toFixed(2)}
          </Text>
          
          <View style={styles.statusContainer}>
            <Icon
              name={getStatusIcon()}
              size={THEME.SIZES.ICON_SM}
              color={getStatusColor()}
            />
            <Text style={[styles.status, { color: getStatusColor() }]}>
              {tollEvent.status.charAt(0).toUpperCase() + tollEvent.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      {tollEvent.status === TOLL_STATUS.PENDING && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDisputePress}
          >
            <Icon name="gavel" size={THEME.SIZES.ICON_SM} color={THEME.COLORS.ERROR} />
            <Text style={styles.actionText}>Dispute</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.payButton]}>
            <Icon name="payment" size={THEME.SIZES.ICON_SM} color={THEME.COLORS.WHITE} />
            <Text style={[styles.actionText, styles.payButtonText]}>Pay Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {tollEvent.evidenceImages.length > 0 && (
        <View style={styles.evidenceContainer}>
          <Icon name="photo" size={THEME.SIZES.ICON_SM} color={THEME.COLORS.TEXT_SECONDARY} />
          <Text style={styles.evidenceText}>
            {tollEvent.evidenceImages.length} photo{tollEvent.evidenceImages.length > 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </CustomCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.SIZES.SPACE_SM,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  location: {
    fontSize: THEME.SIZES.FONT_MD,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginLeft: THEME.SIZES.SPACE_XS,
    flex: 1,
  },
  favoriteButton: {
    padding: THEME.SIZES.SPACE_XS,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftContent: {
    flex: 1,
  },
  date: {
    fontSize: THEME.SIZES.FONT_SM,
    color: THEME.COLORS.TEXT_SECONDARY,
    marginBottom: THEME.SIZES.SPACE_XS,
  },
  vehicleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.SIZES.SPACE_XS,
  },
  licensePlate: {
    fontSize: THEME.SIZES.FONT_SM,
    color: THEME.COLORS.TEXT_PRIMARY,
    marginLeft: THEME.SIZES.SPACE_XS,
    fontWeight: '500',
  },
  agencyContainer: {
    alignSelf: 'flex-start',
  },
  agency: {
    fontSize: THEME.SIZES.FONT_XS,
    color: THEME.COLORS.TEXT_SECONDARY,
    backgroundColor: THEME.COLORS.BACKGROUND_SECONDARY,
    paddingHorizontal: THEME.SIZES.SPACE_SM,
    paddingVertical: THEME.SIZES.SPACE_XS,
    borderRadius: THEME.SIZES.RADIUS_SM,
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: THEME.SIZES.FONT_LG,
    fontWeight: 'bold',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SIZES.SPACE_XS,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  status: {
    fontSize: THEME.SIZES.FONT_XS,
    fontWeight: '600',
    marginLeft: THEME.SIZES.SPACE_XS,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: THEME.SIZES.SPACE_MD,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: THEME.SIZES.SPACE_SM,
    paddingHorizontal: THEME.SIZES.SPACE_MD,
    borderRadius: THEME.SIZES.RADIUS_MD,
    borderWidth: 1,
    borderColor: THEME.COLORS.BORDER,
    flex: 1,
    marginHorizontal: THEME.SIZES.SPACE_XS,
    justifyContent: 'center',
  },
  payButton: {
    backgroundColor: THEME.COLORS.PRIMARY,
    borderColor: THEME.COLORS.PRIMARY,
  },
  actionText: {
    fontSize: THEME.SIZES.FONT_SM,
    fontWeight: '600',
    marginLeft: THEME.SIZES.SPACE_XS,
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  payButtonText: {
    color: THEME.COLORS.WHITE,
  },
  evidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: THEME.SIZES.SPACE_SM,
    paddingTop: THEME.SIZES.SPACE_SM,
    borderTopWidth: 1,
    borderTopColor: THEME.COLORS.BORDER_LIGHT,
  },
  evidenceText: {
    fontSize: THEME.SIZES.FONT_XS,
    color: THEME.COLORS.TEXT_SECONDARY,
    marginLeft: THEME.SIZES.SPACE_XS,
  },
});
