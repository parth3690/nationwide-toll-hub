/**
 * Elite Notification Center Screen
 * 
 * Comprehensive notification management with filtering, marking as read,
 * and quick actions for different notification types.
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
import { Notification } from '../../types';

interface NotificationItemProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
  onMarkAsRead: (notification: Notification) => void;
  onDelete: (notification: Notification) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  onMarkAsRead,
  onDelete,
}) => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'toll':
        return 'local-shipping';
      case 'payment':
        return 'payment';
      case 'statement':
        return 'description';
      case 'dispute':
        return 'gavel';
      case 'system':
        return 'info';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string, isImportant: boolean) => {
    if (isImportant) return THEME.COLORS.ERROR;
    
    switch (type) {
      case 'toll':
        return THEME.COLORS.PRIMARY;
      case 'payment':
        return THEME.COLORS.SUCCESS;
      case 'statement':
        return THEME.COLORS.WARNING;
      case 'dispute':
        return THEME.COLORS.ERROR;
      case 'system':
        return THEME.COLORS.INFO;
      default:
        return THEME.COLORS.TEXT_SECONDARY;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <TouchableOpacity onPress={() => onPress(notification)}>
      <CustomCard style={[
        styles.notificationCard,
        !notification.isRead && styles.unreadNotification,
      ]}>
        <View style={styles.notificationHeader}>
          <View style={styles.notificationIcon}>
            <Icon
              name={getNotificationIcon(notification.type)}
              size={THEME.SIZES.ICON_MD}
              color={getNotificationColor(notification.type, notification.isImportant)}
            />
          </View>
          
          <View style={styles.notificationContent}>
            <View style={styles.notificationTitleRow}>
              <Text style={[
                styles.notificationTitle,
                !notification.isRead && styles.unreadTitle,
              ]}>
                {notification.title}
              </Text>
              {notification.isImportant && (
                <Icon name="priority-high" size={THEME.SIZES.ICON_SM} color={THEME.COLORS.ERROR} />
              )}
            </View>
            
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {notification.message}
            </Text>
            
            <Text style={styles.notificationTime}>
              {formatTime(notification.createdAt)}
            </Text>
          </View>
          
          <View style={styles.notificationActions}>
            {!notification.isRead && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onMarkAsRead(notification)}
              >
                <Icon name="done" size={THEME.SIZES.ICON_SM} color={THEME.COLORS.PRIMARY} />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onDelete(notification)}
            >
              <Icon name="delete" size={THEME.SIZES.ICON_SM} color={THEME.COLORS.ERROR} />
            </TouchableOpacity>
          </View>
        </View>
        
        {notification.actionText && (
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.actionButtonLarge}>
              <Text style={styles.actionButtonText}>{notification.actionText}</Text>
            </TouchableOpacity>
          </View>
        )}
      </CustomCard>
    </TouchableOpacity>
  );
};

export const NotificationCenterScreen: React.FC = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'important'>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      markAsRead(notification);
    }

    // Navigate based on notification type and action
    if (notification.actionUrl) {
      // Handle deep linking or navigation
      console.log('Navigate to:', notification.actionUrl);
    }
  };

  const markAsRead = async (notification: Notification) => {
    try {
      await api.put(`/notifications/${notification.id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const deleteNotification = async (notification: Notification) => {
    try {
      await api.delete(`/notifications/${notification.id}`);
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
      Alert.alert('Error', 'Failed to delete notification');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const clearAllNotifications = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/notifications');
              setNotifications([]);
            } catch (error) {
              console.error('Failed to clear all notifications:', error);
              Alert.alert('Error', 'Failed to clear all notifications');
            }
          },
        },
      ]
    );
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.isRead;
      case 'important':
        return notification.isImportant;
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const importantCount = notifications.filter(n => n.isImportant).length;

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="notifications-none" size={THEME.SIZES.ICON_XXL} color={THEME.COLORS.TEXT_SECONDARY} />
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'all' 
          ? 'You\'re all caught up! No notifications to show.'
          : `No ${filter} notifications found.`
        }
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.headerButton} onPress={markAllAsRead}>
              <Icon name="done-all" size={THEME.SIZES.ICON_MD} color={THEME.COLORS.PRIMARY} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.headerButton} onPress={clearAllNotifications}>
            <Icon name="clear-all" size={THEME.SIZES.ICON_MD} color={THEME.COLORS.ERROR} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {[
          { key: 'all', label: 'All', count: notifications.length },
          { key: 'unread', label: 'Unread', count: unreadCount },
          { key: 'important', label: 'Important', count: importantCount },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.filterTab,
              filter === tab.key && styles.activeFilterTab,
            ]}
            onPress={() => setFilter(tab.key as typeof filter)}
          >
            <Text style={[
              styles.filterTabText,
              filter === tab.key && styles.activeFilterTabText,
            ]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{tab.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={handleNotificationPress}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
          />
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
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: THEME.SIZES.SPACE_SM,
    marginLeft: THEME.SIZES.SPACE_SM,
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
    flexDirection: 'row',
    justifyContent: 'center',
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
  badge: {
    backgroundColor: THEME.COLORS.PRIMARY,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: THEME.SIZES.SPACE_XS,
  },
  badgeText: {
    fontSize: THEME.SIZES.FONT_XS,
    color: THEME.COLORS.WHITE,
    fontWeight: '600',
  },
  notificationCard: {
    marginHorizontal: THEME.SIZES.SPACE_MD,
    marginBottom: THEME.SIZES.SPACE_SM,
  },
  unreadNotification: {
    backgroundColor: THEME.COLORS.BACKGROUND_SECONDARY,
    borderLeftWidth: 4,
    borderLeftColor: THEME.COLORS.PRIMARY,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: THEME.SIZES.SPACE_MD,
    ...THEME.SHADOWS.SMALL,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.SIZES.SPACE_XS,
  },
  notificationTitle: {
    fontSize: THEME.SIZES.FONT_MD,
    fontWeight: '500',
    color: THEME.COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '600',
  },
  notificationMessage: {
    fontSize: THEME.SIZES.FONT_SM,
    color: THEME.COLORS.TEXT_SECONDARY,
    lineHeight: 18,
    marginBottom: THEME.SIZES.SPACE_XS,
  },
  notificationTime: {
    fontSize: THEME.SIZES.FONT_XS,
    color: THEME.COLORS.TEXT_SECONDARY,
  },
  notificationActions: {
    flexDirection: 'row',
    marginLeft: THEME.SIZES.SPACE_SM,
  },
  actionButton: {
    padding: THEME.SIZES.SPACE_SM,
    marginLeft: THEME.SIZES.SPACE_XS,
  },
  actionContainer: {
    marginTop: THEME.SIZES.SPACE_MD,
    paddingTop: THEME.SIZES.SPACE_MD,
    borderTopWidth: 1,
    borderTopColor: THEME.COLORS.BORDER_LIGHT,
  },
  actionButtonLarge: {
    backgroundColor: THEME.COLORS.PRIMARY,
    paddingVertical: THEME.SIZES.SPACE_SM,
    paddingHorizontal: THEME.SIZES.SPACE_MD,
    borderRadius: THEME.SIZES.BORDER_RADIUS_MD,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: THEME.SIZES.FONT_SM,
    color: THEME.COLORS.WHITE,
    fontWeight: '600',
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
