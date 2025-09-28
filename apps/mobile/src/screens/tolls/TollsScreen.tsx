/**
 * Elite Tolls Screen
 * 
 * Comprehensive toll management screen with filtering, searching,
 * and detailed toll event management capabilities.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { THEME, TOLL_STATUS } from '../../utils/constants';
import { DashboardStackParamList, MobileTollEvent, TollFilters } from '../../types';
import { CustomCard } from '../../components/common/CustomCard';
import { TollEventCard } from '../../components/dashboard/TollEventCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { FilterModal } from '../../components/tolls/FilterModal';
import { SortModal } from '../../components/tolls/SortModal';

type TollsNavigationProp = StackNavigationProp<DashboardStackParamList>;

export const TollsScreen: React.FC = () => {
  const navigation = useNavigation<TollsNavigationProp>();
  const [tolls, setTolls] = useState<MobileTollEvent[]>([]);
  const [filteredTolls, setFilteredTolls] = useState<MobileTollEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'paid' | 'disputed'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'location'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadTolls();
  }, []);

  useEffect(() => {
    filterAndSortTolls();
  }, [tolls, searchQuery, activeFilter, sortBy, sortOrder]);

  const loadTolls = async () => {
    try {
      setIsLoading(true);
      
      // Simulate API call - replace with actual API call
      const mockTolls: MobileTollEvent[] = [
        {
          id: '1',
          agencyId: 'etoll',
          amount: 4.50,
          currency: 'USD',
          timestamp: new Date(),
          location: { name: 'Golden Gate Bridge', coordinates: { latitude: 37.8199, longitude: -122.4783 } },
          vehicle: { licensePlate: 'ABC123', type: 'car' },
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
          location: { name: 'I-95 Express', coordinates: { latitude: 25.7617, longitude: -80.1918 } },
          vehicle: { licensePlate: 'ABC123', type: 'car' },
          status: 'pending',
          metadata: {},
          evidenceImages: [],
          isFavorited: true,
          tags: [],
        },
        {
          id: '3',
          agencyId: 'fasttrack',
          amount: 6.25,
          currency: 'USD',
          timestamp: new Date(Date.now() - 172800000),
          location: { name: 'I-405 Express Lanes', coordinates: { latitude: 33.6846, longitude: -117.8265 } },
          vehicle: { licensePlate: 'ABC123', type: 'car' },
          status: 'disputed',
          metadata: {},
          evidenceImages: ['image1.jpg'],
          isFavorited: false,
          tags: [],
        },
      ];
      
      setTolls(mockTolls);
    } catch (error) {
      console.error('Error loading tolls:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortTolls = () => {
    let filtered = [...tolls];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(toll =>
        toll.location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        toll.vehicle.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        toll.agencyId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(toll => toll.status === activeFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = a.timestamp.getTime() - b.timestamp.getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'location':
          comparison = a.location.name.localeCompare(b.location.name);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredTolls(filtered);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTolls();
    setIsRefreshing(false);
  };

  const handleTollPress = (tollId: string) => {
    navigation.navigate('TollDetails', { tollId });
  };

  const handleFavorite = (tollId: string) => {
    setTolls(prev => prev.map(toll =>
      toll.id === tollId ? { ...toll, isFavorited: !toll.isFavorited } : toll
    ));
  };

  const handleDispute = (tollId: string) => {
    // Navigate to dispute screen or show dispute modal
    console.log('Dispute toll:', tollId);
  };

  const getFilterCount = (status: string) => {
    return tolls.filter(toll => toll.status === status).length;
  };

  const getTotalAmount = () => {
    return filteredTolls.reduce((sum, toll) => sum + toll.amount, 0);
  };

  const getSortText = () => {
    const sortText = sortBy.charAt(0).toUpperCase() + sortBy.slice(1);
    const orderText = sortOrder === 'asc' ? '↑' : '↓';
    return `${sortText} ${orderText}`;
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Toll Events</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSort(true)}
          >
            <Icon name="sort" size={THEME.SIZES.ICON_MD} color={THEME.COLORS.PRIMARY} />
            <Text style={styles.headerButtonText}>{getSortText()}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowFilters(true)}
          >
            <Icon name="filter-list" size={THEME.SIZES.ICON_MD} color={THEME.COLORS.PRIMARY} />
            <Text style={styles.headerButtonText}>Filter</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={THEME.SIZES.ICON_MD} color={THEME.COLORS.TEXT_SECONDARY} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tolls by location, license plate, or agency..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={THEME.COLORS.TEXT_TERTIARY}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="clear" size={THEME.SIZES.ICON_MD} color={THEME.COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterTabs}
        contentContainerStyle={styles.filterTabsContent}
      >
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'all' && styles.activeFilterTab]}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[styles.filterTabText, activeFilter === 'all' && styles.activeFilterTabText]}>
            All ({tolls.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'pending' && styles.activeFilterTab]}
          onPress={() => setActiveFilter('pending')}
        >
          <Text style={[styles.filterTabText, activeFilter === 'pending' && styles.activeFilterTabText]}>
            Pending ({getFilterCount('pending')})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'paid' && styles.activeFilterTab]}
          onPress={() => setActiveFilter('paid')}
        >
          <Text style={[styles.filterTabText, activeFilter === 'paid' && styles.activeFilterTabText]}>
            Paid ({getFilterCount('paid')})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'disputed' && styles.activeFilterTab]}
          onPress={() => setActiveFilter('disputed')}
        >
          <Text style={[styles.filterTabText, activeFilter === 'disputed' && styles.activeFilterTabText]}>
            Disputed ({getFilterCount('disputed')})
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Summary Card */}
      <CustomCard style={styles.summaryCard}>
        <View style={styles.summaryContent}>
          <View>
            <Text style={styles.summaryTitle}>Showing {filteredTolls.length} tolls</Text>
            <Text style={styles.summarySubtitle}>
              Total: ${getTotalAmount().toFixed(2)}
            </Text>
          </View>
          
          <TouchableOpacity style={styles.summaryAction}>
            <Icon name="download" size={THEME.SIZES.ICON_MD} color={THEME.COLORS.PRIMARY} />
            <Text style={styles.summaryActionText}>Export</Text>
          </TouchableOpacity>
        </View>
      </CustomCard>

      {/* Tolls List */}
      <ScrollView
        style={styles.tollsList}
        contentContainerStyle={styles.tollsListContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[THEME.COLORS.PRIMARY]}
            tintColor={THEME.COLORS.PRIMARY}
          />
        }
      >
        {filteredTolls.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="toll" size={THEME.SIZES.ICON_3XL} color={THEME.COLORS.TEXT_TERTIARY} />
            <Text style={styles.emptyStateTitle}>No tolls found</Text>
            <Text style={styles.emptyStateSubtitle}>
              {searchQuery || activeFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'You haven\'t had any toll events yet'
              }
            </Text>
          </View>
        ) : (
          filteredTolls.map((toll) => (
            <TollEventCard
              key={toll.id}
              tollEvent={toll}
              onPress={() => handleTollPress(toll.id)}
              onFavorite={handleFavorite}
              onDispute={handleDispute}
            />
          ))
        )}
      </ScrollView>

      {/* Modals */}
      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={(filters) => {
          // Apply filters
          setShowFilters(false);
        }}
      />

      <SortModal
        visible={showSort}
        onClose={() => setShowSort(false)}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onApply={(newSortBy, newSortOrder) => {
          setSortBy(newSortBy);
          setSortOrder(newSortOrder);
          setShowSort(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.BACKGROUND_SECONDARY,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.SIZES.SPACE_LG,
    paddingTop: THEME.SIZES.SPACE_LG,
    paddingBottom: THEME.SIZES.SPACE_MD,
  },
  title: {
    fontSize: THEME.SIZES.FONT_2XL,
    fontWeight: 'bold',
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.SIZES.SPACE_MD,
    paddingVertical: THEME.SIZES.SPACE_SM,
    borderRadius: THEME.SIZES.RADIUS_MD,
    borderWidth: 1,
    borderColor: THEME.COLORS.BORDER,
    marginLeft: THEME.SIZES.SPACE_SM,
  },
  headerButtonText: {
    fontSize: THEME.SIZES.FONT_SM,
    color: THEME.COLORS.PRIMARY,
    fontWeight: '500',
    marginLeft: THEME.SIZES.SPACE_XS,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.WHITE,
    marginHorizontal: THEME.SIZES.SPACE_LG,
    marginBottom: THEME.SIZES.SPACE_MD,
    paddingHorizontal: THEME.SIZES.SPACE_MD,
    borderRadius: THEME.SIZES.RADIUS_MD,
    borderWidth: 1,
    borderColor: THEME.COLORS.BORDER,
    ...THEME.SHADOWS.SMALL,
  },
  searchInput: {
    flex: 1,
    paddingVertical: THEME.SIZES.SPACE_MD,
    paddingHorizontal: THEME.SIZES.SPACE_SM,
    fontSize: THEME.SIZES.FONT_MD,
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  filterTabs: {
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  filterTabsContent: {
    paddingHorizontal: THEME.SIZES.SPACE_LG,
  },
  filterTab: {
    paddingHorizontal: THEME.SIZES.SPACE_MD,
    paddingVertical: THEME.SIZES.SPACE_SM,
    borderRadius: THEME.SIZES.RADIUS_MD,
    marginRight: THEME.SIZES.SPACE_SM,
    borderWidth: 1,
    borderColor: THEME.COLORS.BORDER,
    backgroundColor: THEME.COLORS.WHITE,
  },
  activeFilterTab: {
    backgroundColor: THEME.COLORS.PRIMARY,
    borderColor: THEME.COLORS.PRIMARY,
  },
  filterTabText: {
    fontSize: THEME.SIZES.FONT_SM,
    color: THEME.COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  activeFilterTabText: {
    color: THEME.COLORS.WHITE,
  },
  summaryCard: {
    marginHorizontal: THEME.SIZES.SPACE_LG,
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: THEME.SIZES.FONT_MD,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  summarySubtitle: {
    fontSize: THEME.SIZES.FONT_SM,
    color: THEME.COLORS.TEXT_SECONDARY,
    marginTop: THEME.SIZES.SPACE_XS,
  },
  summaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.SIZES.SPACE_MD,
    paddingVertical: THEME.SIZES.SPACE_SM,
    borderRadius: THEME.SIZES.RADIUS_MD,
    borderWidth: 1,
    borderColor: THEME.COLORS.PRIMARY,
  },
  summaryActionText: {
    fontSize: THEME.SIZES.FONT_SM,
    color: THEME.COLORS.PRIMARY,
    fontWeight: '500',
    marginLeft: THEME.SIZES.SPACE_XS,
  },
  tollsList: {
    flex: 1,
  },
  tollsListContent: {
    paddingHorizontal: THEME.SIZES.SPACE_LG,
    paddingBottom: THEME.SIZES.SPACE_2XL,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: THEME.SIZES.SPACE_3XL,
  },
  emptyStateTitle: {
    fontSize: THEME.SIZES.FONT_XL,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginTop: THEME.SIZES.SPACE_MD,
    marginBottom: THEME.SIZES.SPACE_SM,
  },
  emptyStateSubtitle: {
    fontSize: THEME.SIZES.FONT_MD,
    color: THEME.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
  },
});
