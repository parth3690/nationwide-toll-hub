/**
 * Elite Toll Detail Screen Component
 * 
 * Detailed view of a single toll event with evidence, payment options,
 * and dispute functionality.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  Share,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { CustomCard } from '../../components/common/CustomCard';
import { CustomButton } from '../../components/common/CustomButton';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { api } from '../../services/api';
import { THEME } from '../../utils/constants';

// Types
interface TollEvent {
  id: string;
  timestamp: Date;
  location: string;
  amount: number;
  status: 'pending' | 'paid' | 'disputed' | 'failed';
  evidence: {
    image?: string;
    video?: string;
    gps?: {
      latitude: number;
      longitude: number;
    };
  };
  agency: {
    name: string;
    logo?: string;
  };
  vehicle: {
    licensePlate: string;
    type: string;
  };
}

type RootStackParamList = {
  TollDetail: { tollId: string };
};

type TollDetailRouteProp = RouteProp<RootStackParamList, 'TollDetail'>;

export const TollDetailScreen: React.FC = () => {
  const route = useRoute<TollDetailRouteProp>();
  const navigation = useNavigation();
  const { tollId } = route.params;

  const [tollEvent, setTollEvent] = useState<TollEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTollEvent();
  }, [tollId]);

  const fetchTollEvent = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tolls/${tollId}`);
      setTollEvent(response.data);
    } catch (error) {
      console.error('Failed to fetch toll event:', error);
      Alert.alert('Error', 'Failed to load toll event details');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = () => {
    Alert.alert(
      'Pay Now',
      'This will redirect you to the payment screen',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => navigation.navigate('Payment', { tollId }) },
      ]
    );
  };

  const handleDispute = () => {
    Alert.alert(
      'Dispute Toll',
      'Are you sure you want to dispute this toll? You will need to provide evidence and reason.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => navigation.navigate('Dispute', { tollId }) },
      ]
    );
  };

  const handleShare = async () => {
    if (!tollEvent) return;

    try {
      await Share.share({
        message: `Toll Event - ${tollEvent.location}\nAmount: $${tollEvent.amount}\nDate: ${new Date(tollEvent.timestamp).toLocaleDateString()}`,
        title: 'Toll Event Details',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return THEME.COLORS.SUCCESS;
      case 'pending':
        return THEME.COLORS.WARNING;
      case 'disputed':
        return THEME.COLORS.ERROR;
      case 'failed':
        return THEME.COLORS.ERROR;
      default:
        return THEME.COLORS.TEXT_SECONDARY;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return 'check-circle';
      case 'pending':
        return 'schedule';
      case 'disputed':
        return 'gavel';
      case 'failed':
        return 'error';
      default:
        return 'help';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>Loading toll details...</Text>
      </View>
    );
  }

  if (!tollEvent) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error" size={THEME.SIZES.ICON_XL} color={THEME.COLORS.ERROR} />
        <Text style={styles.errorText}>Failed to load toll event</Text>
        <CustomButton title="Retry" onPress={fetchTollEvent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Card */}
      <CustomCard style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={styles.agencyInfo}>
            {tollEvent.agency.logo && (
              <Image source={{ uri: tollEvent.agency.logo }} style={styles.agencyLogo} />
            )}
            <View style={styles.agencyDetails}>
              <Text style={styles.agencyName}>{tollEvent.agency.name}</Text>
              <Text style={styles.location}>{tollEvent.location}</Text>
            </View>
          </View>
          
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Icon name="share" size={THEME.SIZES.ICON_MD} color={THEME.COLORS.PRIMARY} />
          </TouchableOpacity>
        </View>

        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amount}>${tollEvent.amount.toFixed(2)}</Text>
        </View>

        <View style={styles.statusSection}>
          <View style={styles.statusBadge}>
            <Icon
              name={getStatusIcon(tollEvent.status)}
              size={THEME.SIZES.ICON_SM}
              color={getStatusColor(tollEvent.status)}
            />
            <Text style={[styles.statusText, { color: getStatusColor(tollEvent.status) }]}>
              {tollEvent.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </CustomCard>

      {/* Event Details */}
      <CustomCard style={styles.detailsCard}>
        <Text style={styles.cardTitle}>Event Details</Text>
        
        <View style={styles.detailRow}>
          <Icon name="schedule" size={THEME.SIZES.ICON_MD} color={THEME.COLORS.TEXT_SECONDARY} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>
              {new Date(tollEvent.timestamp).toLocaleDateString()} at{' '}
              {new Date(tollEvent.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Icon name="local-shipping" size={THEME.SIZES.ICON_MD} color={THEME.COLORS.TEXT_SECONDARY} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Vehicle</Text>
            <Text style={styles.detailValue}>
              {tollEvent.vehicle.licensePlate} ({tollEvent.vehicle.type})
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Icon name="location-on" size={THEME.SIZES.ICON_MD} color={THEME.COLORS.TEXT_SECONDARY} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>{tollEvent.location}</Text>
          </View>
        </View>
      </CustomCard>

      {/* Evidence */}
      {tollEvent.evidence && (
        <CustomCard style={styles.evidenceCard}>
          <Text style={styles.cardTitle}>Evidence</Text>
          
          {tollEvent.evidence.image && (
            <View style={styles.evidenceItem}>
              <Text style={styles.evidenceLabel}>Photo Evidence</Text>
              <Image source={{ uri: tollEvent.evidence.image }} style={styles.evidenceImage} />
            </View>
          )}

          {tollEvent.evidence.video && (
            <View style={styles.evidenceItem}>
              <Text style={styles.evidenceLabel}>Video Evidence</Text>
              <TouchableOpacity style={styles.videoButton}>
                <Icon name="play-circle-filled" size={THEME.SIZES.ICON_XL} color={THEME.COLORS.PRIMARY} />
                <Text style={styles.videoButtonText}>Play Video</Text>
              </TouchableOpacity>
            </View>
          )}

          {tollEvent.evidence.gps && (
            <View style={styles.evidenceItem}>
              <Text style={styles.evidenceLabel}>GPS Location</Text>
              <Text style={styles.gpsText}>
                {tollEvent.evidence.gps.latitude.toFixed(6)}, {tollEvent.evidence.gps.longitude.toFixed(6)}
              </Text>
            </View>
          )}
        </CustomCard>
      )}

      {/* Actions */}
      <CustomCard style={styles.actionsCard}>
        <Text style={styles.cardTitle}>Actions</Text>
        
        {tollEvent.status === 'pending' && (
          <CustomButton
            title="Pay Now"
            onPress={handlePayNow}
            style={styles.actionButton}
            icon="payment"
          />
        )}

        {tollEvent.status !== 'disputed' && (
          <CustomButton
            title="Dispute Toll"
            onPress={handleDispute}
            style={[styles.actionButton, styles.disputeButton]}
            variant="outline"
            icon="gavel"
          />
        )}

        <CustomButton
          title="View on Map"
          onPress={() => navigation.navigate('Map', { tollId })}
          style={styles.actionButton}
          variant="outline"
          icon="map"
        />
      </CustomCard>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.BACKGROUND_PRIMARY,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.BACKGROUND_PRIMARY,
  },
  loadingText: {
    marginTop: THEME.SIZES.SPACE_MD,
    fontSize: THEME.SIZES.FONT_MD,
    color: THEME.COLORS.TEXT_SECONDARY,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: THEME.SIZES.SPACE_LG,
    backgroundColor: THEME.COLORS.BACKGROUND_PRIMARY,
  },
  errorText: {
    marginTop: THEME.SIZES.SPACE_MD,
    marginBottom: THEME.SIZES.SPACE_LG,
    fontSize: THEME.SIZES.FONT_LG,
    color: THEME.COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  headerCard: {
    margin: THEME.SIZES.SPACE_MD,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  agencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  agencyLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: THEME.SIZES.SPACE_MD,
  },
  agencyDetails: {
    flex: 1,
  },
  agencyName: {
    fontSize: THEME.SIZES.FONT_LG,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SIZES.SPACE_XS,
  },
  location: {
    fontSize: THEME.SIZES.FONT_MD,
    color: THEME.COLORS.TEXT_SECONDARY,
  },
  shareButton: {
    padding: THEME.SIZES.SPACE_SM,
  },
  amountSection: {
    alignItems: 'center',
    marginVertical: THEME.SIZES.SPACE_MD,
  },
  amountLabel: {
    fontSize: THEME.SIZES.FONT_MD,
    color: THEME.COLORS.TEXT_SECONDARY,
    marginBottom: THEME.SIZES.SPACE_XS,
  },
  amount: {
    fontSize: THEME.SIZES.FONT_XXL,
    fontWeight: 'bold',
    color: THEME.COLORS.PRIMARY,
  },
  statusSection: {
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.BACKGROUND_SECONDARY,
    paddingHorizontal: THEME.SIZES.SPACE_MD,
    paddingVertical: THEME.SIZES.SPACE_SM,
    borderRadius: THEME.SIZES.BORDER_RADIUS_MD,
  },
  statusText: {
    fontSize: THEME.SIZES.FONT_MD,
    fontWeight: '600',
    marginLeft: THEME.SIZES.SPACE_XS,
  },
  detailsCard: {
    marginHorizontal: THEME.SIZES.SPACE_MD,
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  cardTitle: {
    fontSize: THEME.SIZES.FONT_LG,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  detailContent: {
    flex: 1,
    marginLeft: THEME.SIZES.SPACE_MD,
  },
  detailLabel: {
    fontSize: THEME.SIZES.FONT_SM,
    color: THEME.COLORS.TEXT_SECONDARY,
    marginBottom: THEME.SIZES.SPACE_XS,
  },
  detailValue: {
    fontSize: THEME.SIZES.FONT_MD,
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  evidenceCard: {
    marginHorizontal: THEME.SIZES.SPACE_MD,
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  evidenceItem: {
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  evidenceLabel: {
    fontSize: THEME.SIZES.FONT_MD,
    fontWeight: '500',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SIZES.SPACE_SM,
  },
  evidenceImage: {
    width: width - (THEME.SIZES.SPACE_MD * 4),
    height: 200,
    borderRadius: THEME.SIZES.BORDER_RADIUS_MD,
  },
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.COLORS.BACKGROUND_SECONDARY,
    paddingVertical: THEME.SIZES.SPACE_MD,
    borderRadius: THEME.SIZES.BORDER_RADIUS_MD,
  },
  videoButtonText: {
    fontSize: THEME.SIZES.FONT_MD,
    color: THEME.COLORS.PRIMARY,
    marginLeft: THEME.SIZES.SPACE_SM,
    fontWeight: '500',
  },
  gpsText: {
    fontSize: THEME.SIZES.FONT_MD,
    color: THEME.COLORS.TEXT_PRIMARY,
    fontFamily: 'monospace',
  },
  actionsCard: {
    marginHorizontal: THEME.SIZES.SPACE_MD,
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  actionButton: {
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  disputeButton: {
    borderColor: THEME.COLORS.ERROR,
  },
  bottomSpacing: {
    height: THEME.SIZES.SPACE_XL,
  },
});
