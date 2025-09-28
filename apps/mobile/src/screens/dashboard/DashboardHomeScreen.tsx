/**
 * Elite Dashboard Home Screen
 * 
 * Main dashboard with toll summary, recent activity, quick actions,
 * and personalized insights for the Nationwide Toll Hub app.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LineChart, BarChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { THEME } from '../../utils/constants';
import { DashboardStackParamList, TollSummary, MobileTollEvent } from '../../types';
import { CustomCard } from '../../components/common/CustomCard';
import { QuickActionButton } from '../../components/dashboard/QuickActionButton';
import { TollEventCard } from '../../components/dashboard/TollEventCard';
import { StatCard } from '../../components/dashboard/StatCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { authService } from '../../services/authService';

type DashboardHomeNavigationProp = StackNavigationProp<DashboardStackParamList, 'DashboardHome'>;

const { width: screenWidth } = Dimensions.get('window');

export const DashboardHomeScreen: React.FC = () => {
  const navigation = useNavigation<DashboardHomeNavigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tollSummary, setTollSummary] = useState<TollSummary | null>(null);
  const [recentTolls, setRecentTolls] = useState<MobileTollEvent[]>([]);
  const [user] = useState(authService.getCurrentUserSync());

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Simulate API calls - replace with actual API calls
      await Promise.all([
        loadTollSummary(),
        loadRecentTolls(),
      ]);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTollSummary = async () => {
    // Simulate API call
    const summary: TollSummary = {
      totalAmount: 1247.50,
      totalTransactions: 89,
      paidAmount: 1150.00,
      pendingAmount: 67.50,
      disputedAmount: 30.00,
      averagePerTransaction: 14.02,
      thisMonth: 234.75,
      lastMonth: 198.50,
      trend: 'up',
    };
    
    setTollSummary(summary);
  };

  const loadRecentTolls = async () => {
    // Simulate API call
    const tolls: MobileTollEvent[] = [
      {
        id: '1',
        agencyId: 'etoll',
        amount: 4.50,
        currency: 'USD',
        timestamp: new Date(),
        location: {
          name: 'Golden Gate Bridge',
          coordinates: { latitude: 37.8199, longitude: -122.4783 },
        },
        vehicle: {
          licensePlate: 'ABC123',
          type: 'car',
        },
        status: 'paid',
        metadata: {},
        evidenceImages: [],
        isFavorited: false,
        tags: [],
      },
      {
        id: '2',
        agencyId: 'expresstoll',
        amount: 2.75,
        currency: 'USD',
        timestamp: new Date(Date.now() - 86400000),
        location: {
          name: 'I-95 Express',
          coordinates: { latitude: 25.7617, longitude: -80.1918 },
        },
        vehicle: {
          licensePlate: 'ABC123',
          type: 'car',
        },
        status: 'pending',
        metadata: {},
        evidenceImages: [],
        isFavorited: true,
        tags: [],
      },
    ];
    
    setRecentTolls(tolls);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const handleTollPress = (tollId: string) => {
    navigation.navigate('TollDetails', { tollId });
  };

  const handleStatementPress = (statementId: string) => {
    navigation.navigate('StatementDetails', { statementId });
  };

  const handlePaymentPress = (paymentId: string) => {
    navigation.navigate('PaymentDetails', { paymentId });
  };

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [120, 145, 180, 165, 200, 235],
        color: (opacity = 1) => `rgba(30, 58, 138, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: THEME.COLORS.WHITE,
    backgroundGradientFrom: THEME.COLORS.WHITE,
    backgroundGradientTo: THEME.COLORS.WHITE,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(30, 58, 138, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: THEME.SIZES.RADIUS_MD,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: THEME.COLORS.PRIMARY,
    },
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[THEME.COLORS.PRIMARY]}
          tintColor={THEME.COLORS.PRIMARY}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning,</Text>
          <Text style={styles.userName}>{user?.firstName || 'User'}</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Icon name="notifications" size={THEME.SIZES.ICON_LG} color={THEME.COLORS.TEXT_PRIMARY} />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      {tollSummary && (
        <View style={styles.summarySection}>
          <StatCard
            title="Total Spent"
            value={`$${tollSummary.totalAmount.toFixed(2)}`}
            subtitle={`${tollSummary.totalTransactions} transactions`}
            icon="attach-money"
            color={THEME.COLORS.PRIMARY}
            trend={tollSummary.trend}
            trendValue={`${((tollSummary.thisMonth - tollSummary.lastMonth) / tollSummary.lastMonth * 100).toFixed(1)}%`}
          />
          
          <View style={styles.statsRow}>
            <StatCard
              title="Pending"
              value={`$${tollSummary.pendingAmount.toFixed(2)}`}
              subtitle="Unpaid tolls"
              icon="schedule"
              color={THEME.COLORS.WARNING}
              style={styles.halfWidth}
            />
            
            <StatCard
              title="Disputed"
              value={`$${tollSummary.disputedAmount.toFixed(2)}`}
              subtitle="Under review"
              icon="gavel"
              color={THEME.COLORS.ERROR}
              style={styles.halfWidth}
            />
          </View>
        </View>
      )}

      {/* Chart */}
      <CustomCard style={styles.chartCard}>
        <Text style={styles.chartTitle}>Monthly Spending Trend</Text>
        <LineChart
          data={chartData}
          width={screenWidth - 48}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </CustomCard>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <QuickActionButton
            title="Pay Tolls"
            icon="payment"
            color={THEME.COLORS.SECONDARY}
            onPress={() => {/* Navigate to payments */}}
          />
          <QuickActionButton
            title="View Statements"
            icon="description"
            color={THEME.COLORS.PRIMARY}
            onPress={() => {/* Navigate to statements */}}
          />
          <QuickActionButton
            title="Add Vehicle"
            icon="directions-car"
            color={THEME.COLORS.INFO}
            onPress={() => {/* Navigate to add vehicle */}}
          />
          <QuickActionButton
            title="Support"
            icon="help"
            color={THEME.COLORS.WARNING}
            onPress={() => {/* Navigate to support */}}
          />
        </View>
      </View>

      {/* Recent Tolls */}
      <View style={styles.recentTollsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Tolls</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {recentTolls.map((toll) => (
          <TollEventCard
            key={toll.id}
            tollEvent={toll}
            onPress={() => handleTollPress(toll.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.BACKGROUND_SECONDARY,
  },
  contentContainer: {
    paddingBottom: THEME.SIZES.SPACE_2XL,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.SIZES.SPACE_LG,
    paddingTop: THEME.SIZES.SPACE_LG,
    paddingBottom: THEME.SIZES.SPACE_MD,
  },
  greeting: {
    fontSize: THEME.SIZES.FONT_LG,
    color: THEME.COLORS.TEXT_SECONDARY,
  },
  userName: {
    fontSize: THEME.SIZES.FONT_2XL,
    fontWeight: 'bold',
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  notificationButton: {
    position: 'relative',
    padding: THEME.SIZES.SPACE_SM,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.COLORS.ERROR,
  },
  summarySection: {
    paddingHorizontal: THEME.SIZES.SPACE_LG,
    marginBottom: THEME.SIZES.SPACE_LG,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: THEME.SIZES.SPACE_MD,
  },
  halfWidth: {
    width: '48%',
  },
  chartCard: {
    marginHorizontal: THEME.SIZES.SPACE_LG,
    marginBottom: THEME.SIZES.SPACE_LG,
  },
  chartTitle: {
    fontSize: THEME.SIZES.FONT_LG,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  chart: {
    marginVertical: THEME.SIZES.SPACE_SM,
    borderRadius: THEME.SIZES.RADIUS_MD,
  },
  quickActionsSection: {
    paddingHorizontal: THEME.SIZES.SPACE_LG,
    marginBottom: THEME.SIZES.SPACE_LG,
  },
  sectionTitle: {
    fontSize: THEME.SIZES.FONT_XL,
    fontWeight: 'bold',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recentTollsSection: {
    paddingHorizontal: THEME.SIZES.SPACE_LG,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  viewAllText: {
    fontSize: THEME.SIZES.FONT_SM,
    color: THEME.COLORS.PRIMARY,
    fontWeight: '500',
  },
});
