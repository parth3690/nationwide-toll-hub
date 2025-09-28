/**
 * Elite Notification Settings Screen
 * 
 * Comprehensive notification preferences management with granular controls
 * for different notification types and quiet hours.
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
import { useNavigation } from '@react-navigation/native';
import { CustomCard } from '../../components/common/CustomCard';
import { CustomButton } from '../../components/common/CustomButton';
import { CustomInput } from '../../components/common/CustomInput';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { notificationService } from '../../services/notificationService';
import { THEME } from '../../utils/constants';
import { NotificationSettings } from '../../types';

export const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const notificationSettings = await notificationService.getNotificationSettings();
      setSettings(notificationSettings);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      Alert.alert('Error', 'Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      await notificationService.updateNotificationSettings(settings);
      Alert.alert('Success', 'Notification settings saved successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      Alert.alert('Error', 'Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await notificationService.sendTestNotification();
      Alert.alert('Test Sent', 'Check your notification panel for the test notification');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const handlePermissionRequest = async () => {
    const granted = await notificationService.requestNotificationPermission();
    if (granted) {
      Alert.alert('Success', 'Notification permissions granted');
      await loadSettings();
    }
  };

  const updateSetting = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const updateQuietHours = <K extends keyof NotificationSettings['quietHours']>(
    key: K,
    value: NotificationSettings['quietHours'][K]
  ) => {
    if (!settings) return;
    setSettings({
      ...settings,
      quietHours: {
        ...settings.quietHours,
        [key]: value,
      },
    });
  };

  const renderMainToggle = () => (
    <CustomCard style={styles.section}>
      <Text style={styles.sectionTitle}>Push Notifications</Text>
      
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Icon name="notifications" size={THEME.SIZES.ICON_LG} color={THEME.COLORS.PRIMARY} />
          <View style={styles.settingDetails}>
            <Text style={styles.settingLabel}>Enable Push Notifications</Text>
            <Text style={styles.settingDescription}>
              Receive notifications about toll events, payments, and statements
            </Text>
          </View>
        </View>
        <Switch
          value={settings?.pushEnabled || false}
          onValueChange={(value) => updateSetting('pushEnabled', value)}
          trackColor={{ false: THEME.COLORS.BORDER, true: THEME.COLORS.PRIMARY }}
          thumbColor={THEME.COLORS.WHITE}
        />
      </View>

      {!settings?.pushEnabled && (
        <CustomButton
          title="Request Permission"
          onPress={handlePermissionRequest}
          variant="outline"
          style={styles.permissionButton}
          icon="security"
        />
      )}
    </CustomCard>
  );

  const renderNotificationTypes = () => (
    <CustomCard style={styles.section}>
      <Text style={styles.sectionTitle}>Notification Types</Text>
      
      {[
        {
          key: 'tollAlerts',
          icon: 'local-shipping',
          label: 'Toll Alerts',
          description: 'New toll events and charges',
        },
        {
          key: 'paymentAlerts',
          icon: 'payment',
          label: 'Payment Alerts',
          description: 'Payment confirmations and failures',
        },
        {
          key: 'statementAlerts',
          icon: 'description',
          label: 'Statement Alerts',
          description: 'Monthly statements and due dates',
        },
        {
          key: 'disputeAlerts',
          icon: 'gavel',
          label: 'Dispute Alerts',
          description: 'Dispute updates and resolutions',
        },
        {
          key: 'systemAlerts',
          icon: 'info',
          label: 'System Alerts',
          description: 'App updates and maintenance notices',
        },
      ].map((type) => (
        <View key={type.key} style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name={type.icon} size={THEME.SIZES.ICON_MD} color={THEME.COLORS.TEXT_SECONDARY} />
            <View style={styles.settingDetails}>
              <Text style={styles.settingLabel}>{type.label}</Text>
              <Text style={styles.settingDescription}>{type.description}</Text>
            </View>
          </View>
          <Switch
            value={settings?.[type.key as keyof NotificationSettings] as boolean || false}
            onValueChange={(value) => updateSetting(type.key as keyof NotificationSettings, value)}
            trackColor={{ false: THEME.COLORS.BORDER, true: THEME.COLORS.PRIMARY }}
            thumbColor={THEME.COLORS.WHITE}
          />
        </View>
      ))}
    </CustomCard>
  );

  const renderDeliveryMethods = () => (
    <CustomCard style={styles.section}>
      <Text style={styles.sectionTitle}>Delivery Methods</Text>
      
      {[
        {
          key: 'emailEnabled',
          icon: 'email',
          label: 'Email Notifications',
          description: 'Receive notifications via email',
        },
        {
          key: 'smsEnabled',
          icon: 'sms',
          label: 'SMS Notifications',
          description: 'Receive notifications via text message',
        },
      ].map((method) => (
        <View key={method.key} style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name={method.icon} size={THEME.SIZES.ICON_MD} color={THEME.COLORS.TEXT_SECONDARY} />
            <View style={styles.settingDetails}>
              <Text style={styles.settingLabel}>{method.label}</Text>
              <Text style={styles.settingDescription}>{method.description}</Text>
            </View>
          </View>
          <Switch
            value={settings?.[method.key as keyof NotificationSettings] as boolean || false}
            onValueChange={(value) => updateSetting(method.key as keyof NotificationSettings, value)}
            trackColor={{ false: THEME.COLORS.BORDER, true: THEME.COLORS.PRIMARY }}
            thumbColor={THEME.COLORS.WHITE}
          />
        </View>
      ))}
    </CustomCard>
  );

  const renderQuietHours = () => (
    <CustomCard style={styles.section}>
      <Text style={styles.sectionTitle}>Quiet Hours</Text>
      
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Icon name="bedtime" size={THEME.SIZES.ICON_MD} color={THEME.COLORS.TEXT_SECONDARY} />
          <View style={styles.settingDetails}>
            <Text style={styles.settingLabel}>Enable Quiet Hours</Text>
            <Text style={styles.settingDescription}>
              Pause notifications during specified hours
            </Text>
          </View>
        </View>
        <Switch
          value={settings?.quietHours.enabled || false}
          onValueChange={(value) => updateQuietHours('enabled', value)}
          trackColor={{ false: THEME.COLORS.BORDER, true: THEME.COLORS.PRIMARY }}
          thumbColor={THEME.COLORS.WHITE}
        />
      </View>

      {settings?.quietHours.enabled && (
        <View style={styles.quietHoursContainer}>
          <View style={styles.timeInputContainer}>
            <Text style={styles.timeLabel}>Start Time</Text>
            <CustomInput
              value={settings.quietHours.start}
              onChangeText={(value) => updateQuietHours('start', value)}
              placeholder="22:00"
              style={styles.timeInput}
            />
          </View>
          
          <View style={styles.timeInputContainer}>
            <Text style={styles.timeLabel}>End Time</Text>
            <CustomInput
              value={settings.quietHours.end}
              onChangeText={(value) => updateQuietHours('end', value)}
              placeholder="07:00"
              style={styles.timeInput}
            />
          </View>
        </View>
      )}
    </CustomCard>
  );

  const renderActions = () => (
    <CustomCard style={styles.section}>
      <Text style={styles.sectionTitle}>Actions</Text>
      
      <CustomButton
        title="Send Test Notification"
        onPress={handleTestNotification}
        variant="outline"
        style={styles.actionButton}
        icon="send"
      />
      
      <CustomButton
        title="Clear All Notifications"
        onPress={() => {
          Alert.alert(
            'Clear Notifications',
            'Are you sure you want to clear all notifications?',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Clear', 
                style: 'destructive',
                onPress: () => {
                  notificationService.clearAllNotifications();
                  Alert.alert('Success', 'All notifications cleared');
                }
              },
            ]
          );
        }}
        variant="outline"
        style={styles.actionButton}
        icon="clear"
      />
    </CustomCard>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>Loading notification settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderMainToggle()}
      {renderNotificationTypes()}
      {renderDeliveryMethods()}
      {renderQuietHours()}
      {renderActions()}
      
      <CustomButton
        title="Save Settings"
        onPress={handleSave}
        loading={saving}
        style={styles.saveButton}
        icon="save"
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
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: THEME.SIZES.SPACE_MD,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.BORDER_LIGHT,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingDetails: {
    marginLeft: THEME.SIZES.SPACE_MD,
    flex: 1,
  },
  settingLabel: {
    fontSize: THEME.SIZES.FONT_MD,
    fontWeight: '500',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SIZES.SPACE_XS,
  },
  settingDescription: {
    fontSize: THEME.SIZES.FONT_SM,
    color: THEME.COLORS.TEXT_SECONDARY,
    lineHeight: 18,
  },
  permissionButton: {
    marginTop: THEME.SIZES.SPACE_MD,
  },
  quietHoursContainer: {
    marginTop: THEME.SIZES.SPACE_MD,
    paddingTop: THEME.SIZES.SPACE_MD,
    borderTopWidth: 1,
    borderTopColor: THEME.COLORS.BORDER_LIGHT,
  },
  timeInputContainer: {
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  timeLabel: {
    fontSize: THEME.SIZES.FONT_MD,
    fontWeight: '500',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SIZES.SPACE_SM,
  },
  timeInput: {
    textAlign: 'center',
    fontFamily: 'monospace',
    fontSize: THEME.SIZES.FONT_LG,
  },
  actionButton: {
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  saveButton: {
    marginHorizontal: THEME.SIZES.SPACE_MD,
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  bottomSpacing: {
    height: THEME.SIZES.SPACE_XL,
  },
});
