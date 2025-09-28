/**
 * Elite Notification Service
 * 
 * Comprehensive push notification management with Firebase Cloud Messaging,
 * local notifications, and notification preferences.
 */

import { Platform, Alert, Linking } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import PushNotification, { Importance } from 'react-native-push-notification';
import { PermissionsAndroid } from 'react-native';
import { authService } from './authService';
import { api } from './api';
import { THEME } from '../utils/constants';

// Types
interface NotificationData {
  type: 'toll' | 'payment' | 'statement' | 'dispute' | 'system';
  title: string;
  body: string;
  data?: any;
  actionUrl?: string;
  priority?: 'high' | 'normal';
}

interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  tollAlerts: boolean;
  paymentAlerts: boolean;
  statementAlerts: boolean;
  disputeAlerts: boolean;
  systemAlerts: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

class NotificationService {
  private fcmToken: string | null = null;
  private notificationSettings: NotificationSettings | null = null;
  private notificationHandlers: Map<string, (data: any) => void> = new Map();

  /**
   * Initialize the notification service
   */
  async initialize(): Promise<void> {
    try {
      await this.requestPermissions();
      await this.configurePushNotifications();
      await this.configureLocalNotifications();
      await this.registerFCMToken();
      this.setupNotificationHandlers();
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  /**
   * Request notification permissions
   */
  private async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Notification Permission',
            message: 'Allow Nationwide Toll Hub to send you notifications about toll events, payments, and statements?',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const authStatus = await messaging().requestPermission();
        return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
               authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Configure Firebase Cloud Messaging
   */
  private async configurePushNotifications(): Promise<void> {
    // Handle background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Message handled in the background!', remoteMessage);
      await this.handleNotification(remoteMessage.data);
    });

    // Handle foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('A new FCM message arrived!', remoteMessage);
      await this.showLocalNotification({
        title: remoteMessage.notification?.title || 'New Notification',
        body: remoteMessage.notification?.body || '',
        data: remoteMessage.data,
      });
    });

    // Handle notification opened app
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification caused app to open from background state:', remoteMessage);
      this.handleNotificationTap(remoteMessage.data);
    });

    // Check if app was opened from a notification
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('Notification caused app to open from quit state:', remoteMessage);
          this.handleNotificationTap(remoteMessage.data);
        }
      });
  }

  /**
   * Configure local notifications
   */
  private configureLocalNotifications(): void {
    PushNotification.configure({
      onRegister: (token) => {
        console.log('TOKEN:', token);
      },

      onNotification: (notification) => {
        console.log('NOTIFICATION:', notification);
        this.handleNotificationTap(notification.data);
      },

      onAction: (notification) => {
        console.log('ACTION:', notification.action);
        console.log('NOTIFICATION:', notification);
      },

      onRegistrationError: (err) => {
        console.error(err.message, err);
      },

      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      popInitialNotification: true,

      requestPermissions: Platform.OS === 'ios',
    });

    // Create notification channel for Android
    PushNotification.createChannel(
      {
        channelId: 'toll-hub-channel',
        channelName: 'Toll Hub Notifications',
        channelDescription: 'Notifications for toll events, payments, and statements',
        playSound: true,
        soundName: 'default',
        importance: Importance.HIGH,
        vibrate: true,
      },
      (created) => console.log(`createChannel returned '${created}'`)
    );
  }

  /**
   * Register FCM token with backend
   */
  private async registerFCMToken(): Promise<void> {
    try {
      const token = await messaging().getToken();
      this.fcmToken = token;
      
      if (token && authService.isAuthenticated()) {
        await api.post('/notifications/register-token', {
          token,
          platform: Platform.OS,
          appVersion: '1.0.0', // You might want to get this from app config
        });
      }
    } catch (error) {
      console.error('Failed to register FCM token:', error);
    }
  }

  /**
   * Setup notification handlers for different types
   */
  private setupNotificationHandlers(): void {
    this.notificationHandlers.set('toll', this.handleTollNotification.bind(this));
    this.notificationHandlers.set('payment', this.handlePaymentNotification.bind(this));
    this.notificationHandlers.set('statement', this.handleStatementNotification.bind(this));
    this.notificationHandlers.set('dispute', this.handleDisputeNotification.bind(this));
    this.notificationHandlers.set('system', this.handleSystemNotification.bind(this));
  }

  /**
   * Show local notification
   */
  async showLocalNotification(notification: NotificationData): Promise<void> {
    if (!this.shouldShowNotification(notification)) {
      return;
    }

    PushNotification.localNotification({
      channelId: 'toll-hub-channel',
      title: notification.title,
      message: notification.body,
      data: notification.data,
      playSound: true,
      soundName: 'default',
      importance: 'high',
      priority: notification.priority || 'normal',
      vibrate: true,
      vibration: 300,
      actions: notification.actionUrl ? ['View', 'Dismiss'] : ['Dismiss'],
      invokeApp: false,
    });
  }

  /**
   * Check if notification should be shown based on settings
   */
  private shouldShowNotification(notification: NotificationData): boolean {
    if (!this.notificationSettings?.pushEnabled) {
      return false;
    }

    // Check quiet hours
    if (this.notificationSettings.quietHours.enabled) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const startTime = this.notificationSettings.quietHours.start;
      const endTime = this.notificationSettings.quietHours.end;
      
      if (currentTime >= startTime && currentTime <= endTime) {
        return false;
      }
    }

    // Check type-specific settings
    switch (notification.type) {
      case 'toll':
        return this.notificationSettings.tollAlerts;
      case 'payment':
        return this.notificationSettings.paymentAlerts;
      case 'statement':
        return this.notificationSettings.statementAlerts;
      case 'dispute':
        return this.notificationSettings.disputeAlerts;
      case 'system':
        return this.notificationSettings.systemAlerts;
      default:
        return true;
    }
  }

  /**
   * Handle notification tap
   */
  private handleNotificationTap(data: any): void {
    if (!data || !data.type) return;

    const handler = this.notificationHandlers.get(data.type);
    if (handler) {
      handler(data);
    }
  }

  /**
   * Handle toll notification
   */
  private handleTollNotification(data: any): void {
    if (data.tollId) {
      // Navigate to toll detail screen
      // This would typically use navigation service
      console.log('Navigate to toll detail:', data.tollId);
    }
  }

  /**
   * Handle payment notification
   */
  private handlePaymentNotification(data: any): void {
    if (data.paymentId) {
      // Navigate to payment detail screen
      console.log('Navigate to payment detail:', data.paymentId);
    }
  }

  /**
   * Handle statement notification
   */
  private handleStatementNotification(data: any): void {
    if (data.statementId) {
      // Navigate to statement detail screen
      console.log('Navigate to statement detail:', data.statementId);
    }
  }

  /**
   * Handle dispute notification
   */
  private handleDisputeNotification(data: any): void {
    if (data.disputeId) {
      // Navigate to dispute detail screen
      console.log('Navigate to dispute detail:', data.disputeId);
    }
  }

  /**
   * Handle system notification
   */
  private handleSystemNotification(data: any): void {
    if (data.actionUrl) {
      Linking.openURL(data.actionUrl);
    }
  }

  /**
   * Handle notification data
   */
  private async handleNotification(data: any): Promise<void> {
    if (!data || !data.type) return;

    const handler = this.notificationHandlers.get(data.type);
    if (handler) {
      handler(data);
    }
  }

  /**
   * Send test notification
   */
  async sendTestNotification(): Promise<void> {
    await this.showLocalNotification({
      type: 'system',
      title: 'Test Notification',
      body: 'This is a test notification from Nationwide Toll Hub',
      data: { test: true },
    });
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
      this.notificationSettings = { ...this.notificationSettings, ...settings } as NotificationSettings;
      await api.put('/notifications/settings', this.notificationSettings);
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      throw error;
    }
  }

  /**
   * Get notification settings
   */
  async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      if (!this.notificationSettings) {
        const response = await api.get('/notifications/settings');
        this.notificationSettings = response.data;
      }
      return this.notificationSettings;
    } catch (error) {
      console.error('Failed to get notification settings:', error);
      return this.getDefaultNotificationSettings();
    }
  }

  /**
   * Get default notification settings
   */
  private getDefaultNotificationSettings(): NotificationSettings {
    return {
      pushEnabled: true,
      emailEnabled: true,
      smsEnabled: false,
      tollAlerts: true,
      paymentAlerts: true,
      statementAlerts: true,
      disputeAlerts: true,
      systemAlerts: true,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00',
      },
    };
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications(): void {
    PushNotification.cancelAllLocalNotifications();
  }

  /**
   * Get FCM token
   */
  getFCMToken(): string | null {
    return this.fcmToken;
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    const authStatus = await messaging().hasPermission();
    return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
           authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  }

  /**
   * Request notification permission with user-friendly dialog
   */
  async requestNotificationPermission(): Promise<boolean> {
    try {
      const enabled = await this.areNotificationsEnabled();
      if (enabled) {
        return true;
      }

      Alert.alert(
        'Enable Notifications',
        'Stay updated with toll events, payments, and important alerts. You can change this in settings anytime.',
        [
          { text: 'Not Now', style: 'cancel' },
          { 
            text: 'Enable', 
            onPress: async () => {
              const granted = await this.requestPermissions();
              if (granted) {
                await this.registerFCMToken();
              }
              return granted;
            }
          },
        ]
      );

      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
