/**
 * Elite Sort Modal Component
 * 
 * Sorting options modal for toll events with multiple sorting criteria
 * and order options.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CustomCard } from '../common/CustomCard';
import { CustomButton } from '../common/CustomButton';
import { THEME } from '../../utils/constants';

interface SortModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (sortBy: 'date' | 'amount' | 'location', sortOrder: 'asc' | 'desc') => void;
  sortBy: 'date' | 'amount' | 'location';
  sortOrder: 'asc' | 'desc';
}

export const SortModal: React.FC<SortModalProps> = ({
  visible,
  onClose,
  onApply,
  sortBy,
  sortOrder,
}) => {
  const [selectedSortBy, setSelectedSortBy] = useState(sortBy);
  const [selectedSortOrder, setSelectedSortOrder] = useState(sortOrder);

  const handleApply = () => {
    onApply(selectedSortBy, selectedSortOrder);
  };

  const sortOptions = [
    { id: 'date', name: 'Date', icon: 'schedule' },
    { id: 'amount', name: 'Amount', icon: 'attach-money' },
    { id: 'location', name: 'Location', icon: 'location-on' },
  ];

  const orderOptions = [
    { id: 'desc', name: 'Newest First', icon: 'arrow-downward' },
    { id: 'asc', name: 'Oldest First', icon: 'arrow-upward' },
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
          
          <Text style={styles.headerTitle}>Sort By</Text>
          
          <TouchableOpacity onPress={handleApply} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Apply</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Sort By Options */}
          <CustomCard style={styles.section}>
            <Text style={styles.sectionTitle}>Sort By</Text>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.option,
                  selectedSortBy === option.id && styles.selectedOption,
                ]}
                onPress={() => setSelectedSortBy(option.id as any)}
              >
                <View style={styles.optionContent}>
                  <Icon
                    name={option.icon}
                    size={THEME.SIZES.ICON_MD}
                    color={selectedSortBy === option.id ? THEME.COLORS.PRIMARY : THEME.COLORS.TEXT_SECONDARY}
                  />
                  <Text style={[
                    styles.optionText,
                    selectedSortBy === option.id && styles.selectedOptionText,
                  ]}>
                    {option.name}
                  </Text>
                </View>
                
                {selectedSortBy === option.id && (
                  <Icon name="check" size={THEME.SIZES.ICON_MD} color={THEME.COLORS.PRIMARY} />
                )}
              </TouchableOpacity>
            ))}
          </CustomCard>

          {/* Order Options */}
          <CustomCard style={styles.section}>
            <Text style={styles.sectionTitle}>Order</Text>
            {orderOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.option,
                  selectedSortOrder === option.id && styles.selectedOption,
                ]}
                onPress={() => setSelectedSortOrder(option.id as any)}
              >
                <View style={styles.optionContent}>
                  <Icon
                    name={option.icon}
                    size={THEME.SIZES.ICON_MD}
                    color={selectedSortOrder === option.id ? THEME.COLORS.PRIMARY : THEME.COLORS.TEXT_SECONDARY}
                  />
                  <Text style={[
                    styles.optionText,
                    selectedSortOrder === option.id && styles.selectedOptionText,
                  ]}>
                    {option.name}
                  </Text>
                </View>
                
                {selectedSortOrder === option.id && (
                  <Icon name="check" size={THEME.SIZES.ICON_MD} color={THEME.COLORS.PRIMARY} />
                )}
              </TouchableOpacity>
            ))}
          </CustomCard>
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
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: THEME.SIZES.SPACE_MD,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.BORDER_LIGHT,
  },
  selectedOption: {
    backgroundColor: THEME.COLORS.BACKGROUND_SECONDARY,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    fontSize: THEME.SIZES.FONT_MD,
    color: THEME.COLORS.TEXT_PRIMARY,
    marginLeft: THEME.SIZES.SPACE_MD,
  },
  selectedOptionText: {
    fontWeight: '600',
    color: THEME.COLORS.PRIMARY,
  },
});
