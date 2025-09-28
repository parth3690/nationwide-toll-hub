/**
 * Elite Profile Screen Component
 * 
 * User profile management with settings, preferences,
 * and account information.
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
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { authService } from '../../services/authService';
import { api } from '../../services/api';
import { THEME } from '../../utils/constants';

// Types
interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profileImage?: string;
  preferences: {
    notifications: {
      push: boolean;
      email: boolean;
      sms: boolean;
    };
    privacy: {
      shareData: boolean;
      analytics: boolean;
    };
  };
  vehicles: Array<{
    id: string;
    licensePlate: string;
    type: string;
    make?: string;
    model?: string;
  }>;
  paymentMethods: Array<{
    id: string;
    type: string;
    lastFour: string;
    isDefault: boolean;
  }>;
}

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/profile');
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      Alert.alert('Error', 'Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout },
      ]
    );
  };

  const logout = async () => {
    try {
      await authService.logout();
      navigation.navigate('Login');
    } catch (error) {
      console.error('Logout failed:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const handleNotificationToggle = (type: keyof UserProfile['preferences']['notifications']) => {
    if (!profile) return;
    
    setProfile({
      ...profile,
      preferences: {
        ...profile.preferences,
        notifications: {
          ...profile.preferences.notifications,
          [type]: !profile.preferences.notifications[type],
        },
      },
    });
  };

  const handlePrivacyToggle = (type: keyof UserProfile['preferences']['privacy']) => {
    if (!profile) return;
    
    setProfile({
      ...profile,
      preferences: {
        ...profile.preferences,
        privacy: {
          ...profile.preferences.privacy,
          [type]: !profile.preferences.privacy[type],
        },
      },
    });
  };

  const renderProfileHeader = () => (
    <CustomCard style={styles.headerCard}>
      <View style={styles.profileInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.firstName?.[0]}{profile?.lastName?.[0]}
          </Text>
        </View>
        
        <View style={styles.profileDetails}>
          <Text style={styles.profileName}>
            {profile?.firstName} {profile?.lastName}
          </Text>
          <Text style={styles.profileEmail}>{profile?.email}</Text>
          {profile?.phone && (
            <Text style={styles.profilePhone}>{profile.phone}</Text>
          )}
        </View>
        
        <TouchableOpacity style={styles.editButton}>
          <Icon name="edit" size={THEME.SIZES.ICON_MD} color={THEME.COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>
    </CustomCard>
  );

  const renderQuickStats = () => (
    <CustomCard style={styles.statsCard}>
      <Text style={styles.cardTitle}>Quick Stats</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{profile?.vehicles.length || 0}</Text>
          <Text style={styles.statLabel}>Vehicles</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{profile?.paymentMethods.length || 0}</Text>
          <Text style={styles.statLabel}>Payment Methods</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Disputes</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>
      </View>
    </CustomCard>
  );

  const renderVehicles = () => (
    <CustomCard style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.cardTitle}>Vehicles</Text>
        <TouchableOpacity style={styles.addButton}>
          <Icon name="add" size={THEME.SIZES.ICON_SM} color={THEME.COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>
      
      {profile?.vehicles.map((vehicle) => (
        <View key={vehicle.id} style={styles.vehicleItem}>
          <Icon name="local-shipping" size={THEME.SIZES.ICON_MD} color={THEME.COLORS.TEXT_SECONDARY} />
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehiclePlate}>{vehicle.licensePlate}</Text>
            <Text style={styles.vehicleType}>
              {vehicle.type}
              {vehicle.make && vehicle.model && ` • ${vehicle.make} ${vehicle.model}`}
            </Text>
          </View>
          <TouchableOpacity style={styles.vehicleAction}>
            <Icon name="chevron-right" size={THEME.SIZES.ICON_SM} color={THEME.COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>
        </View>
      ))}
    </CustomCard>
  );

  const renderSettings = () => (
    <CustomCard style={styles.section}>
      <Text style={styles.cardTitle}>Settings</Text>
      
      {/* Notification Settings */}
      <View style={styles.settingSection}>
        <Text style={styles.settingSectionTitle}>Notifications</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="notifications" size={THEME.SIZES.ICON_MD} color={THEME.COLORS.TEXT_SECONDARY} />
            <Text style={styles.settingLabel}>Push Notifications</Text>
          </View>
          <Switch
            value={profile?.preferences.notifications.push || false}
            onValueChange={() => handleNotificationToggle('push')}
            trackColor={{ false: THEME.COLORS.BORDER, true: THEME.COLORS.PRIMARY }}
            thumbColor={THEME.COLORS.WHITE}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="email" size={THEME.SIZES.ICON_MD} color={THEME.COLORS.TEXT_SECONDARY} />
            <Text style={styles.settingLabel}>Email Notifications</Text>
          </View>
          <Switch
            value={profile?.preferences.notifications.email || false}
            onValueChange={() => handleNotificationToggle('email')}
            trackColor={{ false: THEME.COLORS.BORDER, true: THEME.COLORS.PRIMARY }}
            thumbColor={THEME.COLORS.WHITE}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="sms" size={THEME.SIZES.ICON_MD} color={THEME.COLORS.TEXT_SECONDARY} />
            <Text style={styles.settingLabel}>SMS Notifications</Text>
          </View>
          <Switch
            value={profile?.preferences.notifications.sms || false}
            onValueChange={() => handleNotificationToggle('sms')}
            trackColor={{ false: THEME.COLORS.BORDER, true: THEME.COLORS.PRIMARY }}
            thumbColor={THEME.COLORS.WHITE}
          />
        </View>
      </View>

      {/* Privacy Settings */}
      <View style={styles.settingSection}>
        <Text style={styles.settingSectionTitle}>Privacy</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="share" size={THEME.SIZES.ICON_MD} color={THEME.COLORS.TEXT_SECONDARY} />
            <Text style={styles.settingLabel}>Share Usage Data</Text>
          </View>
          <Switch
            value={profile?.preferences.privacy.shareData || false}
            onValueChange={() => handlePrivacyToggle('shareData')}
            trackColor={{ false: THEME.COLORS.BORDER, true: THEME.COLORS.PRIMARY }}
            thumbColor={THEME.COLORS.WHITE}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="analytics" size={THEME.SIZES.ICON_MD} color={THEME.COLORS.TEXT_SECONDARY} />
            <Text style={styles.settingLabel}>Analytics</Text>
          </View>
          <Switch
            value={profile?.preferences.privacy.analytics || false}
            onValueChange={() => handlePrivacyToggle('analytics')}
            trackColor={{ false: THEME.COLORS.BORDER, true: THEME.COLORS.PRIMARY }}
            thumbColor={THEME.COLORS.WHITE}
          />
        </View>
      </View>
    </CustomCard>
  );

  const renderMenuItems = () => (
    <CustomCard style={styles.section}>
      <Text style={styles.cardTitle}>Account</Text>
      
      {[
        { icon: 'payment', label: 'Payment Methods', onPress: () => {} },
        { icon: 'history', label: 'Transaction History', onPress: () => {} },
        { icon: 'support', label: 'Help & Support', onPress: () => {} },
        { icon: 'info', label: 'About', onPress: () => {} },
        { icon: 'security', label: 'Security', onPress: () => {} },
        { icon: 'privacy-tip', label: 'Privacy Policy', onPress: () => {} },
        { icon: 'description', label: 'Terms of Service', onPress: () => {} },
      ].map((item, index) => (
        <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
          <View style={styles.menuItemContent}>
            <Icon name={item.icon} size={THEME.SIZES.ICON_MD} color={THEME.COLORS.TEXT_SECONDARY} />
            <Text style={styles.menuItemLabel}>{item.label}</Text>
          </View>
          <Icon name="chevron-right" size={THEME.SIZES.ICON_SM} color={THEME.COLORS.TEXT_SECONDARY} />
        </TouchableOpacity>
      ))}
    </CustomCard>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderProfileHeader()}
      {renderQuickStats()}
      {renderVehicles()}
      {renderSettings()}
      {renderMenuItems()}
      
      <CustomButton
        title="Logout"
        onPress={handleLogout}
        variant="outline"
        style={styles.logoutButton}
        icon="logout"
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
  headerCard: {
    margin: THEME.SIZES.SPACE_MD,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: THEME.SIZES.SPACE_MD,
  },
  avatarText: {
    fontSize: THEME.SIZES.FONT_LG,
    fontWeight: 'bold',
    color: THEME.COLORS.WHITE,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: THEME.SIZES.FONT_LG,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SIZES.SPACE_XS,
  },
  profileEmail: {
    fontSize: THEME.SIZES.FONT_MD,
    color: THEME.COLORS.TEXT_SECONDARY,
    marginBottom: THEME.SIZES.SPACE_XS,
  },
  profilePhone: {
    fontSize: THEME.SIZES.FONT_SM,
    color: THEME.COLORS.TEXT_SECONDARY,
  },
  editButton: {
    padding: THEME.SIZES.SPACE_SM,
  },
  statsCard: {
    marginHorizontal: THEME.SIZES.SPACE_MD,
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  cardTitle: {
    fontSize: THEME.SIZES.FONT_LG,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  section: {
    marginHorizontal: THEME.SIZES.SPACE_MD,
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  addButton: {
    padding: THEME.SIZES.SPACE_SM,
  },
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: THEME.SIZES.SPACE_MD,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.BORDER_LIGHT,
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: THEME.SIZES.SPACE_MD,
  },
  vehiclePlate: {
    fontSize: THEME.SIZES.FONT_MD,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SIZES.SPACE_XS,
  },
  vehicleType: {
    fontSize: THEME.SIZES.FONT_SM,
    color: THEME.COLORS.TEXT_SECONDARY,
  },
  vehicleAction: {
    padding: THEME.SIZES.SPACE_SM,
  },
  settingSection: {
    marginBottom: THEME.SIZES.SPACE_LG,
  },
  settingSectionTitle: {
    fontSize: THEME.SIZES.FONT_MD,
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
  settingLabel: {
    fontSize: THEME.SIZES.FONT_MD,
    color: THEME.COLORS.TEXT_PRIMARY,
    marginLeft: THEME.SIZES.SPACE_MD,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: THEME.SIZES.SPACE_MD,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.BORDER_LIGHT,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemLabel: {
    fontSize: THEME.SIZES.FONT_MD,
    color: THEME.COLORS.TEXT_PRIMARY,
    marginLeft: THEME.SIZES.SPACE_MD,
  },
  logoutButton: {
    marginHorizontal: THEME.SIZES.SPACE_MD,
    marginBottom: THEME.SIZES.SPACE_MD,
    borderColor: THEME.COLORS.ERROR,
  },
  bottomSpacing: {
    height: THEME.SIZES.SPACE_XL,
  },
});
