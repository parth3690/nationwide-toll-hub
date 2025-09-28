/**
 * Elite Filter Modal Component
 * 
 * Advanced filtering modal for toll events with date range, amount range,
 * agency selection, and other filtering options.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CustomCard } from '../common/CustomCard';
import { CustomButton } from '../common/CustomButton';
import { THEME } from '../../utils/constants';
import { TollFilters } from '../../types';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: TollFilters) => void;
  initialFilters?: Partial<TollFilters>;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters,
}) => {
  const [filters, setFilters] = useState<TollFilters>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date(),
    },
    agencies: [],
    vehicleIds: [],
    amountRange: {
      min: 0,
      max: 1000,
    },
    status: [],
    tags: [],
    ...initialFilters,
  });

  const [tempFilters, setTempFilters] = useState(filters);

  const handleApply = () => {
    setFilters(tempFilters);
    onApply(tempFilters);
  };

  const handleReset = () => {
    const defaultFilters: TollFilters = {
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      },
      agencies: [],
      vehicleIds: [],
      amountRange: {
        min: 0,
        max: 1000,
      },
      status: [],
      tags: [],
    };
    setTempFilters(defaultFilters);
  };

  const toggleAgency = (agencyId: string) => {
    setTempFilters(prev => ({
      ...prev,
      agencies: prev.agencies.includes(agencyId)
        ? prev.agencies.filter(id => id !== agencyId)
        : [...prev.agencies, agencyId],
    }));
  };

  const toggleStatus = (status: string) => {
    setTempFilters(prev => ({
      ...prev,
      status: prev.status.includes(status as any)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status as any],
    }));
  };

  const agencies = [
    { id: 'etoll', name: 'E-Toll', color: THEME.COLORS.PRIMARY },
    { id: 'expresstoll', name: 'ExpressToll', color: THEME.COLORS.SECONDARY },
    { id: 'fasttrack', name: 'FastTrack', color: THEME.COLORS.INFO },
  ];

  const statuses = [
    { id: 'paid', name: 'Paid', color: THEME.COLORS.SUCCESS },
    { id: 'pending', name: 'Pending', color: THEME.COLORS.WARNING },
    { id: 'disputed', name: 'Disputed', color: THEME.COLORS.ERROR },
    { id: 'failed', name: 'Failed', color: THEME.COLORS.ERROR },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Filters</Text>
          
          <TouchableOpacity onPress={handleReset} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Date Range */}
          <CustomCard style={styles.section}>
            <Text style={styles.sectionTitle}>Date Range</Text>
            <View style={styles.dateRangeContainer}>
              <View style={styles.dateInput}>
                <Text style={styles.dateLabel}>From</Text>
                <TextInput
                  style={styles.dateInputField}
                  value={tempFilters.dateRange.start.toLocaleDateString()}
                  placeholder="Start date"
                  editable={false}
                />
              </View>
              
              <View style={styles.dateInput}>
                <Text style={styles.dateLabel}>To</Text>
                <TextInput
                  style={styles.dateInputField}
                  value={tempFilters.dateRange.end.toLocaleDateString()}
                  placeholder="End date"
                  editable={false}
                />
              </View>
            </View>
          </CustomCard>

          {/* Amount Range */}
          <CustomCard style={styles.section}>
            <Text style={styles.sectionTitle}>Amount Range</Text>
            <View style={styles.amountRangeContainer}>
              <View style={styles.amountInput}>
                <Text style={styles.amountLabel}>Min</Text>
                <TextInput
                  style={styles.amountInputField}
                  value={tempFilters.amountRange.min.toString()}
                  onChangeText={(text) => setTempFilters(prev => ({
                    ...prev,
                    amountRange: {
                      ...prev.amountRange,
                      min: parseFloat(text) || 0,
                    },
                  }))}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
              
              <View style={styles.amountInput}>
                <Text style={styles.amountLabel}>Max</Text>
                <TextInput
                  style={styles.amountInputField}
                  value={tempFilters.amountRange.max.toString()}
                  onChangeText={(text) => setTempFilters(prev => ({
                    ...prev,
                    amountRange: {
                      ...prev.amountRange,
                      max: parseFloat(text) || 1000,
                    },
                  }))}
                  keyboardType="numeric"
                  placeholder="1000"
                />
              </View>
            </View>
          </CustomCard>

          {/* Agencies */}
          <CustomCard style={styles.section}>
            <Text style={styles.sectionTitle}>Agencies</Text>
            <View style={styles.optionsContainer}>
              {agencies.map((agency) => (
                <TouchableOpacity
                  key={agency.id}
                  style={[
                    styles.option,
                    tempFilters.agencies.includes(agency.id) && styles.selectedOption,
                    { borderColor: agency.color },
                  ]}
                  onPress={() => toggleAgency(agency.id)}
                >
                  <View style={styles.optionContent}>
                    <View style={[styles.optionIndicator, { backgroundColor: agency.color }]} />
                    <Text style={[
                      styles.optionText,
                      tempFilters.agencies.includes(agency.id) && styles.selectedOptionText,
                    ]}>
                      {agency.name}
                    </Text>
                  </View>
                  
                  {tempFilters.agencies.includes(agency.id) && (
                    <Icon name="check" size={THEME.SIZES.ICON_SM} color={agency.color} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </CustomCard>

          {/* Status */}
          <CustomCard style={styles.section}>
            <Text style={styles.sectionTitle}>Status</Text>
            <View style={styles.optionsContainer}>
              {statuses.map((status) => (
                <TouchableOpacity
                  key={status.id}
                  style={[
                    styles.option,
                    tempFilters.status.includes(status.id as any) && styles.selectedOption,
                    { borderColor: status.color },
                  ]}
                  onPress={() => toggleStatus(status.id)}
                >
                  <View style={styles.optionContent}>
                    <View style={[styles.optionIndicator, { backgroundColor: status.color }]} />
                    <Text style={[
                      styles.optionText,
                      tempFilters.status.includes(status.id as any) && styles.selectedOptionText,
                    ]}>
                      {status.name}
                    </Text>
                  </View>
                  
                  {tempFilters.status.includes(status.id as any) && (
                    <Icon name="check" size={THEME.SIZES.ICON_SM} color={status.color} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </CustomCard>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <CustomButton
            title="Apply Filters"
            onPress={handleApply}
            style={styles.applyButton}
            gradient
          />
        </View>
      </View>
    </Modal>
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
    paddingVertical: THEME.SIZES.SPACE_MD,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.BORDER,
    backgroundColor: THEME.COLORS.WHITE,
  },
  headerButton: {
    paddingVertical: THEME.SIZES.SPACE_SM,
  },
  headerButtonText: {
    fontSize: THEME.SIZES.FONT_MD,
    color: THEME.COLORS.PRIMARY,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: THEME.SIZES.FONT_LG,
    fontWeight: 'bold',
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  content: {
    flex: 1,
    paddingHorizontal: THEME.SIZES.SPACE_LG,
    paddingTop: THEME.SIZES.SPACE_LG,
  },
  section: {
    marginBottom: THEME.SIZES.SPACE_LG,
  },
  sectionTitle: {
    fontSize: THEME.SIZES.FONT_LG,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInput: {
    flex: 1,
    marginHorizontal: THEME.SIZES.SPACE_XS,
  },
  dateLabel: {
    fontSize: THEME.SIZES.FONT_SM,
    color: THEME.COLORS.TEXT_SECONDARY,
    marginBottom: THEME.SIZES.SPACE_XS,
  },
  dateInputField: {
    borderWidth: 1,
    borderColor: THEME.COLORS.BORDER,
    borderRadius: THEME.SIZES.RADIUS_MD,
    paddingHorizontal: THEME.SIZES.SPACE_MD,
    paddingVertical: THEME.SIZES.SPACE_MD,
    fontSize: THEME.SIZES.FONT_MD,
    color: THEME.COLORS.TEXT_PRIMARY,
    backgroundColor: THEME.COLORS.WHITE,
  },
  amountRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amountInput: {
    flex: 1,
    marginHorizontal: THEME.SIZES.SPACE_XS,
  },
  amountLabel: {
    fontSize: THEME.SIZES.FONT_SM,
    color: THEME.COLORS.TEXT_SECONDARY,
    marginBottom: THEME.SIZES.SPACE_XS,
  },
  amountInputField: {
    borderWidth: 1,
    borderColor: THEME.COLORS.BORDER,
    borderRadius: THEME.SIZES.RADIUS_MD,
    paddingHorizontal: THEME.SIZES.SPACE_MD,
    paddingVertical: THEME.SIZES.SPACE_MD,
    fontSize: THEME.SIZES.FONT_MD,
    color: THEME.COLORS.TEXT_PRIMARY,
    backgroundColor: THEME.COLORS.WHITE,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: -THEME.SIZES.SPACE_SM,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.SIZES.SPACE_MD,
    paddingVertical: THEME.SIZES.SPACE_SM,
    borderRadius: THEME.SIZES.RADIUS_MD,
    borderWidth: 1,
    borderColor: THEME.COLORS.BORDER,
    backgroundColor: THEME.COLORS.WHITE,
    marginTop: THEME.SIZES.SPACE_SM,
    marginRight: THEME.SIZES.SPACE_SM,
    minWidth: 120,
  },
  selectedOption: {
    backgroundColor: THEME.COLORS.BACKGROUND_SECONDARY,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: THEME.SIZES.SPACE_SM,
  },
  optionText: {
    fontSize: THEME.SIZES.FONT_SM,
    color: THEME.COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  selectedOptionText: {
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: THEME.SIZES.SPACE_LG,
    paddingVertical: THEME.SIZES.SPACE_LG,
    borderTopWidth: 1,
    borderTopColor: THEME.COLORS.BORDER,
    backgroundColor: THEME.COLORS.WHITE,
  },
  applyButton: {
    width: '100%',
  },
});
