/**
 * Elite Statements Screen Component
 * 
 * Comprehensive view of toll statements with filtering, searching,
 * and statement management capabilities.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { CustomCard } from '../../components/common/CustomCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { api } from '../../services/api';
import { THEME } from '../../utils/constants';

// Types
interface Statement {
  id: string;
  period: string;
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  totalTolls: number;
  status: 'draft' | 'generated' | 'sent' | 'paid';
  dueDate?: Date;
  createdAt: Date;
  summary: {
    byAgency: Array<{
      agencyName: string;
      count: number;
      amount: number;
    }>;
    byVehicle: Array<{
      licensePlate: string;
      count: number;
      amount: number;
    }>;
  };
}

interface StatementItemProps {
  statement: Statement;
  onPress: (statement: Statement) => void;
}

const StatementItem: React.FC<StatementItemProps> = ({ statement, onPress }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return THEME.COLORS.SUCCESS;
      case 'sent':
        return THEME.COLORS.WARNING;
      case 'generated':
        return THEME.COLORS.INFO;
      case 'draft':
        return THEME.COLORS.TEXT_SECONDARY;
      default:
        return THEME.COLORS.TEXT_SECONDARY;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return 'check-circle';
      case 'sent':
        return 'send';
      case 'generated':
        return 'description';
      case 'draft':
        return 'edit';
      default:
        return 'help';
    }
  };

  const formatPeriod = (startDate: Date, endDate: Date) => {
    const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${start} - ${end}`;
  };

  const isOverdue = statement.dueDate && new Date(statement.dueDate) < new Date();

  return (
    <TouchableOpacity onPress={() => onPress(statement)}>
      <CustomCard style={styles.statementCard}>
        <View style={styles.statementHeader}>
          <View style={styles.periodInfo}>
            <Text style={styles.periodText}>{statement.period}</Text>
            <Text style={styles.dateRange}>
              {formatPeriod(statement.startDate, statement.endDate)}
            </Text>
          </View>
          
          <View style={styles.statusBadge}>
            <Icon
              name={getStatusIcon(statement.status)}
              size={THEME.SIZES.ICON_SM}
              color={getStatusColor(statement.status)}
            />
            <Text style={[styles.statusText, { color: getStatusColor(statement.status) }]}>
              {statement.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.statementContent}>
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amount}>${statement.totalAmount.toFixed(2)}</Text>
          </View>

          <View style={styles.summarySection}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Tolls</Text>
              <Text style={styles.summaryValue}>{statement.totalTolls}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Agencies</Text>
              <Text style={styles.summaryValue}>{statement.summary.byAgency.length}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Vehicles</Text>
              <Text style={styles.summaryValue}>{statement.summary.byVehicle.length}</Text>
            </View>
          </View>

          {statement.dueDate && (
            <View style={styles.dueDateSection}>
              <Icon
                name="schedule"
                size={THEME.SIZES.ICON_SM}
                color={isOverdue ? THEME.COLORS.ERROR : THEME.COLORS.TEXT_SECONDARY}
              />
              <Text style={[
                styles.dueDateText,
                isOverdue && styles.overdueText,
              ]}>
                Due: {new Date(statement.dueDate).toLocaleDateString()}
                {isOverdue && ' (Overdue)'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.statementActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="visibility" size={THEME.SIZES.ICON_SM} color={THEME.COLORS.PRIMARY} />
            <Text style={styles.actionText}>View</Text>
          </TouchableOpacity>
          
          {statement.status === 'generated' && (
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="download" size={THEME.SIZES.ICON_SM} color={THEME.COLORS.SUCCESS} />
              <Text style={styles.actionText}>Download</Text>
            </TouchableOpacity>
          )}
          
          {statement.status === 'sent' && (
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="payment" size={THEME.SIZES.ICON_SM} color={THEME.COLORS.WARNING} />
              <Text style={styles.actionText}>Pay</Text>
            </TouchableOpacity>
          )}
        </View>
      </CustomCard>
    </TouchableOpacity>
  );
};

export const StatementsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [statements, setStatements] = useState<Statement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');

  useEffect(() => {
    fetchStatements();
  }, []);

  const fetchStatements = async () => {
    try {
      setLoading(true);
      const response = await api.get('/statements');
      setStatements(response.data);
    } catch (error) {
      console.error('Failed to fetch statements:', error);
      Alert.alert('Error', 'Failed to load statements');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStatements();
    setRefreshing(false);
  };

  const handleStatementPress = (statement: Statement) => {
    navigation.navigate('StatementDetail', { statementId: statement.id });
  };

  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
  };

  const filteredStatements = statements.filter(statement => {
    switch (filter) {
      case 'pending':
        return statement.status === 'sent' || statement.status === 'generated';
      case 'paid':
        return statement.status === 'paid';
      case 'overdue':
        return statement.dueDate && new Date(statement.dueDate) < new Date();
      default:
        return true;
    }
  });

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="description" size={THEME.SIZES.ICON_XXL} color={THEME.COLORS.TEXT_SECONDARY} />
      <Text style={styles.emptyTitle}>No Statements Found</Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'all' 
          ? 'You don\'t have any statements yet.'
          : `No ${filter} statements found.`
        }
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Statements</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Icon name="filter-list" size={THEME.SIZES.ICON_MD} color={THEME.COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: 'Pending' },
          { key: 'paid', label: 'Paid' },
          { key: 'overdue', label: 'Overdue' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.filterTab,
              filter === tab.key && styles.activeFilterTab,
            ]}
            onPress={() => handleFilterChange(tab.key as typeof filter)}
          >
            <Text style={[
              styles.filterTabText,
              filter === tab.key && styles.activeFilterTabText,
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{statements.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {statements.filter(s => s.status === 'sent' || s.status === 'generated').length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            ${statements.reduce((sum, s) => sum + s.totalAmount, 0).toFixed(0)}
          </Text>
          <Text style={styles.statLabel}>Total Amount</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>Loading statements...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredStatements}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StatementItem statement={item} onPress={handleStatementPress} />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

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
  listContent: {
    paddingBottom: THEME.SIZES.SPACE_XL,
  },
  header: {
    backgroundColor: THEME.COLORS.WHITE,
    paddingHorizontal: THEME.SIZES.SPACE_MD,
    paddingTop: THEME.SIZES.SPACE_MD,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.BORDER,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  headerTitle: {
    fontSize: THEME.SIZES.FONT_XXL,
    fontWeight: 'bold',
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  headerButton: {
    padding: THEME.SIZES.SPACE_SM,
  },
  filterTabs: {
    flexDirection: 'row',
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  filterTab: {
    flex: 1,
    paddingVertical: THEME.SIZES.SPACE_SM,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeFilterTab: {
    borderBottomColor: THEME.COLORS.PRIMARY,
  },
  filterTabText: {
    fontSize: THEME.SIZES.FONT_MD,
    color: THEME.COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  activeFilterTabText: {
    color: THEME.COLORS.PRIMARY,
    fontWeight: '600',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: THEME.SIZES.SPACE_MD,
    backgroundColor: THEME.COLORS.BACKGROUND_SECONDARY,
    borderRadius: THEME.SIZES.BORDER_RADIUS_MD,
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: THEME.SIZES.FONT_XL,
    fontWeight: 'bold',
    color: THEME.COLORS.PRIMARY,
  },
  statLabel: {
    fontSize: THEME.SIZES.FONT_SM,
    color: THEME.COLORS.TEXT_SECONDARY,
    marginTop: THEME.SIZES.SPACE_XS,
  },
  statementCard: {
    marginHorizontal: THEME.SIZES.SPACE_MD,
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  statementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  periodInfo: {
    flex: 1,
  },
  periodText: {
    fontSize: THEME.SIZES.FONT_LG,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SIZES.SPACE_XS,
  },
  dateRange: {
    fontSize: THEME.SIZES.FONT_MD,
    color: THEME.COLORS.TEXT_SECONDARY,
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
    fontSize: THEME.SIZES.FONT_SM,
    fontWeight: '600',
    marginLeft: THEME.SIZES.SPACE_XS,
  },
  statementContent: {
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  amountLabel: {
    fontSize: THEME.SIZES.FONT_SM,
    color: THEME.COLORS.TEXT_SECONDARY,
    marginBottom: THEME.SIZES.SPACE_XS,
  },
  amount: {
    fontSize: THEME.SIZES.FONT_XL,
    fontWeight: 'bold',
    color: THEME.COLORS.PRIMARY,
  },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: THEME.SIZES.FONT_SM,
    color: THEME.COLORS.TEXT_SECONDARY,
    marginBottom: THEME.SIZES.SPACE_XS,
  },
  summaryValue: {
    fontSize: THEME.SIZES.FONT_MD,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  dueDateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dueDateText: {
    fontSize: THEME.SIZES.FONT_SM,
    color: THEME.COLORS.TEXT_SECONDARY,
    marginLeft: THEME.SIZES.SPACE_XS,
  },
  overdueText: {
    color: THEME.COLORS.ERROR,
    fontWeight: '600',
  },
  statementActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: THEME.SIZES.SPACE_MD,
    borderTopWidth: 1,
    borderTopColor: THEME.COLORS.BORDER_LIGHT,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: THEME.SIZES.SPACE_SM,
    paddingHorizontal: THEME.SIZES.SPACE_MD,
  },
  actionText: {
    fontSize: THEME.SIZES.FONT_SM,
    color: THEME.COLORS.PRIMARY,
    marginLeft: THEME.SIZES.SPACE_XS,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: THEME.SIZES.SPACE_XXL,
    paddingHorizontal: THEME.SIZES.SPACE_LG,
  },
  emptyTitle: {
    fontSize: THEME.SIZES.FONT_LG,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginTop: THEME.SIZES.SPACE_MD,
    marginBottom: THEME.SIZES.SPACE_SM,
  },
  emptySubtitle: {
    fontSize: THEME.SIZES.FONT_MD,
    color: THEME.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
  },
});
