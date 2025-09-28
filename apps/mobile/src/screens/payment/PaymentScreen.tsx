/**
 * Elite Payment Screen Component
 * 
 * Comprehensive payment processing for individual tolls or statements
 * with multiple payment methods and security features.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { CustomCard } from '../../components/common/CustomCard';
import { CustomButton } from '../../components/common/CustomButton';
import { CustomInput } from '../../components/common/CustomInput';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { api } from '../../services/api';
import { THEME } from '../../utils/constants';

// Types
interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'wallet';
  lastFour: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  nickname?: string;
}

interface PaymentItem {
  id: string;
  description: string;
  amount: number;
  type: 'toll' | 'statement' | 'fine';
}

type RootStackParamList = {
  Payment: { 
    tollId?: string; 
    statementId?: string;
    amount?: number;
  };
};

type PaymentRouteProp = RouteProp<RootStackParamList, 'Payment'>;

export const PaymentScreen: React.FC = () => {
  const route = useRoute<PaymentRouteProp>();
  const navigation = useNavigation();
  const { tollId, statementId, amount } = route.params;

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [paymentItems, setPaymentItems] = useState<PaymentItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [fees, setFees] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);
  const [addTip, setAddTip] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);
  const [customTip, setCustomTip] = useState('');

  useEffect(() => {
    initializePayment();
  }, []);

  const initializePayment = async () => {
    try {
      setLoading(true);
      
      // Fetch payment methods
      const methodsResponse = await api.get('/payment-methods');
      setPaymentMethods(methodsResponse.data);
      
      // Set default payment method
      const defaultMethod = methodsResponse.data.find((method: PaymentMethod) => method.isDefault);
      if (defaultMethod) {
        setSelectedMethod(defaultMethod);
      }

      // Fetch payment items based on type
      let items: PaymentItem[] = [];
      let calculatedSubtotal = 0;

      if (tollId) {
        const tollResponse = await api.get(`/tolls/${tollId}`);
        items = [{
          id: tollId,
          description: `Toll - ${tollResponse.data.location}`,
          amount: tollResponse.data.amount,
          type: 'toll',
        }];
        calculatedSubtotal = tollResponse.data.amount;
      } else if (statementId) {
        const statementResponse = await api.get(`/statements/${statementId}`);
        items = [{
          id: statementId,
          description: `Statement - ${statementResponse.data.period}`,
          amount: statementResponse.data.totalAmount,
          type: 'statement',
        }];
        calculatedSubtotal = statementResponse.data.totalAmount;
      } else if (amount) {
        items = [{
          id: 'custom',
          description: 'Custom Payment',
          amount: amount,
          type: 'toll',
        }];
        calculatedSubtotal = amount;
      }

      setPaymentItems(items);
      setSubtotal(calculatedSubtotal);
      
      // Calculate fees (2.5% processing fee)
      const calculatedFees = calculatedSubtotal * 0.025;
      setFees(calculatedFees);
      setTotal(calculatedSubtotal + calculatedFees);

    } catch (error) {
      console.error('Failed to initialize payment:', error);
      Alert.alert('Error', 'Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
  };

  const handleTipToggle = (enabled: boolean) => {
    setAddTip(enabled);
    if (!enabled) {
      setTipAmount(0);
      setCustomTip('');
    }
  };

  const handleTipAmountChange = (amount: string) => {
    setCustomTip(amount);
    const numericAmount = parseFloat(amount) || 0;
    setTipAmount(numericAmount);
  };

  const calculateFinalTotal = () => {
    return subtotal + fees + tipAmount;
  };

  const handleProcessPayment = async () => {
    if (!selectedMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    Alert.alert(
      'Confirm Payment',
      `Pay $${calculateFinalTotal().toFixed(2)} using ${selectedMethod.type === 'card' ? 'card' : 'bank account'} ending in ${selectedMethod.lastFour}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: processPayment },
      ]
    );
  };

  const processPayment = async () => {
    try {
      setProcessing(true);

      const paymentData = {
        paymentMethodId: selectedMethod.id,
        items: paymentItems,
        subtotal,
        fees,
        tip: tipAmount,
        total: calculateFinalTotal(),
        savePaymentMethod,
        metadata: {
          tollId,
          statementId,
          timestamp: new Date().toISOString(),
        },
      };

      const response = await api.post('/payments', paymentData);

      Alert.alert(
        'Payment Successful',
        'Your payment has been processed successfully.',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.goBack() 
          },
        ]
      );

    } catch (error) {
      console.error('Payment failed:', error);
      Alert.alert(
        'Payment Failed',
        'There was an error processing your payment. Please try again.'
      );
    } finally {
      setProcessing(false);
    }
  };

  const renderPaymentMethod = (method: PaymentMethod) => {
    const isSelected = selectedMethod?.id === method.id;
    
    return (
      <TouchableOpacity
        key={method.id}
        style={[styles.paymentMethod, isSelected && styles.selectedPaymentMethod]}
        onPress={() => handlePaymentMethodSelect(method)}
      >
        <View style={styles.paymentMethodContent}>
          <View style={styles.paymentMethodInfo}>
            <Icon
              name={method.type === 'card' ? 'credit-card' : 'account-balance'}
              size={THEME.SIZES.ICON_MD}
              color={isSelected ? THEME.COLORS.PRIMARY : THEME.COLORS.TEXT_SECONDARY}
            />
            <View style={styles.paymentMethodDetails}>
              <Text style={styles.paymentMethodName}>
                {method.type === 'card' ? 'Credit Card' : 'Bank Account'} 
                {method.brand && ` (${method.brand})`}
              </Text>
              <Text style={styles.paymentMethodNumber}>
                **** **** **** {method.lastFour}
                {method.expiryMonth && method.expiryYear && 
                  ` • ${method.expiryMonth}/${method.expiryYear}`
                }
              </Text>
              {method.nickname && (
                <Text style={styles.paymentMethodNickname}>{method.nickname}</Text>
              )}
            </View>
          </View>
          
          <View style={styles.paymentMethodActions}>
            {method.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>DEFAULT</Text>
              </View>
            )}
            {isSelected && (
              <Icon name="check-circle" size={THEME.SIZES.ICON_MD} color={THEME.COLORS.PRIMARY} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPaymentItem = (item: PaymentItem) => (
    <View key={item.id} style={styles.paymentItem}>
      <View style={styles.paymentItemContent}>
        <Icon
          name={item.type === 'toll' ? 'local-shipping' : 'description'}
          size={THEME.SIZES.ICON_SM}
          color={THEME.COLORS.TEXT_SECONDARY}
        />
        <Text style={styles.paymentItemDescription}>{item.description}</Text>
      </View>
      <Text style={styles.paymentItemAmount}>${item.amount.toFixed(2)}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>Loading payment information...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Payment Items */}
      <CustomCard style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Summary</Text>
        {paymentItems.map(renderPaymentItem)}
        
        <View style={styles.divider} />
        
        <View style={styles.paymentItem}>
          <Text style={styles.paymentItemDescription}>Subtotal</Text>
          <Text style={styles.paymentItemAmount}>${subtotal.toFixed(2)}</Text>
        </View>
        
        <View style={styles.paymentItem}>
          <Text style={styles.paymentItemDescription}>Processing Fee</Text>
          <Text style={styles.paymentItemAmount}>${fees.toFixed(2)}</Text>
        </View>

        {/* Tip Section */}
        <View style={styles.tipSection}>
          <View style={styles.tipHeader}>
            <Text style={styles.paymentItemDescription}>Tip</Text>
            <Switch
              value={addTip}
              onValueChange={handleTipToggle}
              trackColor={{ false: THEME.COLORS.BORDER, true: THEME.COLORS.PRIMARY }}
              thumbColor={THEME.COLORS.WHITE}
            />
          </View>
          
          {addTip && (
            <View style={styles.tipOptions}>
              {[0.15, 0.18, 0.20].map((percentage) => (
                <TouchableOpacity
                  key={percentage}
                  style={[
                    styles.tipButton,
                    tipAmount === subtotal * percentage && styles.selectedTipButton,
                  ]}
                  onPress={() => {
                    setTipAmount(subtotal * percentage);
                    setCustomTip('');
                  }}
                >
                  <Text style={[
                    styles.tipButtonText,
                    tipAmount === subtotal * percentage && styles.selectedTipButtonText,
                  ]}>
                    {Math.round(percentage * 100)}%
                  </Text>
                </TouchableOpacity>
              ))}
              
              <CustomInput
                placeholder="Custom"
                value={customTip}
                onChangeText={handleTipAmountChange}
                keyboardType="numeric"
                style={styles.customTipInput}
              />
            </View>
          )}
          
          {addTip && (
            <Text style={styles.tipAmount}>${tipAmount.toFixed(2)}</Text>
          )}
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.paymentItem}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>${calculateFinalTotal().toFixed(2)}</Text>
        </View>
      </CustomCard>

      {/* Payment Methods */}
      <CustomCard style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        {paymentMethods.map(renderPaymentMethod)}
        
        <TouchableOpacity style={styles.addPaymentMethod}>
          <Icon name="add" size={THEME.SIZES.ICON_MD} color={THEME.COLORS.PRIMARY} />
          <Text style={styles.addPaymentMethodText}>Add New Payment Method</Text>
        </TouchableOpacity>
      </CustomCard>

      {/* Payment Options */}
      <CustomCard style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Options</Text>
        
        <View style={styles.option}>
          <Text style={styles.optionText}>Save this payment method</Text>
          <Switch
            value={savePaymentMethod}
            onValueChange={setSavePaymentMethod}
            trackColor={{ false: THEME.COLORS.BORDER, true: THEME.COLORS.PRIMARY }}
            thumbColor={THEME.COLORS.WHITE}
          />
        </View>
      </CustomCard>

      {/* Security Notice */}
      <CustomCard style={styles.securityCard}>
        <Icon name="security" size={THEME.SIZES.ICON_MD} color={THEME.COLORS.SUCCESS} />
        <Text style={styles.securityText}>
          Your payment information is encrypted and secure. We use industry-standard 
          security measures to protect your data.
        </Text>
      </CustomCard>

      {/* Process Payment Button */}
      <CustomButton
        title={`Pay $${calculateFinalTotal().toFixed(2)}`}
        onPress={handleProcessPayment}
        disabled={!selectedMethod || processing}
        loading={processing}
        style={styles.processButton}
        icon="payment"
      />

      <View style={styles.bottomSpacing} />
    </ScrollView>
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
  section: {
    margin: THEME.SIZES.SPACE_MD,
  },
  sectionTitle: {
    fontSize: THEME.SIZES.FONT_LG,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: THEME.SIZES.SPACE_SM,
  },
  paymentItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentItemDescription: {
    fontSize: THEME.SIZES.FONT_MD,
    color: THEME.COLORS.TEXT_PRIMARY,
    marginLeft: THEME.SIZES.SPACE_SM,
  },
  paymentItemAmount: {
    fontSize: THEME.SIZES.FONT_MD,
    color: THEME.COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: THEME.COLORS.BORDER_LIGHT,
    marginVertical: THEME.SIZES.SPACE_MD,
  },
  tipSection: {
    marginVertical: THEME.SIZES.SPACE_SM,
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tipOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: THEME.SIZES.SPACE_MD,
    marginBottom: THEME.SIZES.SPACE_SM,
  },
  tipButton: {
    flex: 1,
    paddingVertical: THEME.SIZES.SPACE_SM,
    paddingHorizontal: THEME.SIZES.SPACE_MD,
    backgroundColor: THEME.COLORS.BACKGROUND_SECONDARY,
    borderRadius: THEME.SIZES.BORDER_RADIUS_MD,
    alignItems: 'center',
    marginHorizontal: THEME.SIZES.SPACE_XS,
  },
  selectedTipButton: {
    backgroundColor: THEME.COLORS.PRIMARY,
  },
  tipButtonText: {
    fontSize: THEME.SIZES.FONT_MD,
    color: THEME.COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  selectedTipButtonText: {
    color: THEME.COLORS.WHITE,
  },
  customTipInput: {
    flex: 1,
    marginLeft: THEME.SIZES.SPACE_XS,
  },
  tipAmount: {
    fontSize: THEME.SIZES.FONT_MD,
    color: THEME.COLORS.TEXT_PRIMARY,
    fontWeight: '500',
    textAlign: 'right',
  },
  totalLabel: {
    fontSize: THEME.SIZES.FONT_LG,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  totalAmount: {
    fontSize: THEME.SIZES.FONT_LG,
    fontWeight: 'bold',
    color: THEME.COLORS.PRIMARY,
  },
  paymentMethod: {
    borderWidth: 1,
    borderColor: THEME.COLORS.BORDER,
    borderRadius: THEME.SIZES.BORDER_RADIUS_MD,
    marginBottom: THEME.SIZES.SPACE_MD,
    padding: THEME.SIZES.SPACE_MD,
  },
  selectedPaymentMethod: {
    borderColor: THEME.COLORS.PRIMARY,
    backgroundColor: THEME.COLORS.BACKGROUND_SECONDARY,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodDetails: {
    marginLeft: THEME.SIZES.SPACE_MD,
    flex: 1,
  },
  paymentMethodName: {
    fontSize: THEME.SIZES.FONT_MD,
    fontWeight: '500',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SIZES.SPACE_XS,
  },
  paymentMethodNumber: {
    fontSize: THEME.SIZES.FONT_SM,
    color: THEME.COLORS.TEXT_SECONDARY,
  },
  paymentMethodNickname: {
    fontSize: THEME.SIZES.FONT_SM,
    color: THEME.COLORS.TEXT_SECONDARY,
    fontStyle: 'italic',
    marginTop: THEME.SIZES.SPACE_XS,
  },
  paymentMethodActions: {
    alignItems: 'center',
  },
  defaultBadge: {
    backgroundColor: THEME.COLORS.SUCCESS,
    paddingHorizontal: THEME.SIZES.SPACE_SM,
    paddingVertical: THEME.SIZES.SPACE_XS,
    borderRadius: THEME.SIZES.BORDER_RADIUS_SM,
    marginBottom: THEME.SIZES.SPACE_XS,
  },
  defaultBadgeText: {
    fontSize: THEME.SIZES.FONT_XS,
    color: THEME.COLORS.WHITE,
    fontWeight: '600',
  },
  addPaymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: THEME.SIZES.SPACE_MD,
    borderWidth: 1,
    borderColor: THEME.COLORS.PRIMARY,
    borderStyle: 'dashed',
    borderRadius: THEME.SIZES.BORDER_RADIUS_MD,
  },
  addPaymentMethodText: {
    fontSize: THEME.SIZES.FONT_MD,
    color: THEME.COLORS.PRIMARY,
    marginLeft: THEME.SIZES.SPACE_SM,
    fontWeight: '500',
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: THEME.SIZES.SPACE_SM,
  },
  optionText: {
    fontSize: THEME.SIZES.FONT_MD,
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: THEME.SIZES.SPACE_MD,
    padding: THEME.SIZES.SPACE_MD,
    backgroundColor: THEME.COLORS.BACKGROUND_SECONDARY,
  },
  securityText: {
    flex: 1,
    fontSize: THEME.SIZES.FONT_SM,
    color: THEME.COLORS.TEXT_SECONDARY,
    marginLeft: THEME.SIZES.SPACE_MD,
    lineHeight: 18,
  },
  processButton: {
    marginHorizontal: THEME.SIZES.SPACE_MD,
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  bottomSpacing: {
    height: THEME.SIZES.SPACE_XL,
  },
});
