/**
 * Elite Login Screen for Nationwide Toll Hub Mobile App
 * 
 * Modern, secure login interface with biometric authentication,
 * form validation, and comprehensive error handling.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../types';
import { LoginCredentials } from '../../types';
import { authService } from '../../services/authService';
import { THEME, VALIDATION, ERROR_MESSAGES } from '../../utils/constants';
import { CustomInput } from '../../components/common/CustomInput';
import { CustomButton } from '../../components/common/CustomButton';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { BiometricButton } from '../../components/auth/BiometricButton';
import { SocialLoginButtons } from '../../components/auth/SocialLoginButtons';
import Icon from 'react-native-vector-icons/MaterialIcons';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

// Validation schema
const loginSchema = yup.object().shape({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(VALIDATION.PASSWORD.MIN_LENGTH, `Password must be at least ${VALIDATION.PASSWORD.MIN_LENGTH} characters`)
    .required('Password is required'),
});

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginCredentials>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const isAvailable = await authService.isBiometricEnabled();
      setBiometricAvailable(isAvailable);
    } catch (error) {
      console.error('Error checking biometric availability:', error);
    }
  };

  const onSubmit = async (data: LoginCredentials) => {
    try {
      setIsLoading(true);
      
      const loginData = {
        ...data,
        rememberMe,
      };

      await authService.login(loginData);
      
      // Navigation will be handled by the auth state change
      // The main app will automatically navigate to the dashboard
      
    } catch (error) {
      console.error('Login error:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : ERROR_MESSAGES.LOGIN_FAILED;
      
      Alert.alert(
        'Login Failed',
        errorMessage,
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      setIsLoading(true);
      
      // Get stored credentials for biometric login
      const storedEmail = await authService.getStoredEmail();
      if (!storedEmail) {
        Alert.alert(
          'Biometric Login',
          'No stored credentials found. Please login with your email and password first.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      // Perform biometric authentication
      const biometricResult = await authService.authenticateWithBiometric();
      
      if (biometricResult.success) {
        // Auto-fill email and attempt login
        setValue('email', storedEmail);
        
        // Note: In a real app, you'd store the password securely or use a different flow
        Alert.alert(
          'Biometric Login',
          'Please enter your password to complete biometric login.',
          [{ text: 'OK', style: 'default' }]
        );
      }
      
    } catch (error) {
      console.error('Biometric login error:', error);
      Alert.alert(
        'Biometric Login Failed',
        ERROR_MESSAGES.BIOMETRIC_ERROR,
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    try {
      setIsLoading(true);
      
      // Implement social login logic here
      // This would typically involve OAuth flow with the respective provider
      
      Alert.alert(
        'Social Login',
        `${provider.charAt(0).toUpperCase() + provider.slice(1)} login is not yet implemented.`,
        [{ text: 'OK', style: 'default' }]
      );
      
    } catch (error) {
      console.error('Social login error:', error);
      Alert.alert(
        'Social Login Failed',
        'An error occurred during social login. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={THEME.COLORS.WHITE} 
      />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Icon name="toll" size={THEME.SIZES.ICON_3XL} color={THEME.COLORS.PRIMARY} />
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Sign in to your Nationwide Toll Hub account
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email Input */}
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <CustomInput
                label="Email Address"
                placeholder="Enter your email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon="email"
                editable={!isLoading}
              />
            )}
          />

          {/* Password Input */}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <CustomInput
                label="Password"
                placeholder="Enter your password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                secureTextEntry={!showPassword}
                rightIcon={showPassword ? 'visibility-off' : 'visibility'}
                onRightIconPress={() => setShowPassword(!showPassword)}
                leftIcon="lock"
                editable={!isLoading}
              />
            )}
          />

          {/* Remember Me & Forgot Password */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberMeContainer}
              onPress={() => setRememberMe(!rememberMe)}
              disabled={isLoading}
            >
              <View style={[
                styles.checkbox,
                rememberMe && styles.checkboxChecked
              ]}>
                {rememberMe && (
                  <Icon name="check" size={16} color={THEME.COLORS.WHITE} />
                )}
              </View>
              <Text style={styles.rememberMeText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleForgotPassword}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <CustomButton
            title="Sign In"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            disabled={isLoading}
            style={styles.loginButton}
          />

          {/* Biometric Login */}
          {biometricAvailable && (
            <BiometricButton
              onPress={handleBiometricLogin}
              disabled={isLoading}
              style={styles.biometricButton}
            />
          )}

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login */}
          <SocialLoginButtons
            onGooglePress={() => handleSocialLogin('google')}
            onApplePress={() => handleSocialLogin('apple')}
            disabled={isLoading}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don't have an account?{' '}
            <Text 
              style={styles.registerLink}
              onPress={handleRegister}
            >
              Sign Up
            </Text>
          </Text>
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      {isLoading && <LoadingSpinner />}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.WHITE,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: THEME.SIZES.SPACE_LG,
  },
  header: {
    alignItems: 'center',
    paddingTop: THEME.SIZES.SPACE_3XL,
    paddingBottom: THEME.SIZES.SPACE_2XL,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: THEME.SIZES.RADIUS_XL,
    backgroundColor: THEME.COLORS.PRIMARY_LIGHT + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.SIZES.SPACE_LG,
  },
  title: {
    fontSize: THEME.SIZES.FONT_3XL,
    fontWeight: 'bold',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SIZES.SPACE_SM,
  },
  subtitle: {
    fontSize: THEME.SIZES.FONT_MD,
    color: THEME.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    flex: 1,
    paddingBottom: THEME.SIZES.SPACE_LG,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.SIZES.SPACE_LG,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: THEME.SIZES.RADIUS_SM,
    borderWidth: 2,
    borderColor: THEME.COLORS.GRAY_300,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: THEME.SIZES.SPACE_SM,
  },
  checkboxChecked: {
    backgroundColor: THEME.COLORS.PRIMARY,
    borderColor: THEME.COLORS.PRIMARY,
  },
  rememberMeText: {
    fontSize: THEME.SIZES.FONT_SM,
    color: THEME.COLORS.TEXT_SECONDARY,
  },
  forgotPasswordText: {
    fontSize: THEME.SIZES.FONT_SM,
    color: THEME.COLORS.PRIMARY,
    fontWeight: '500',
  },
  loginButton: {
    marginBottom: THEME.SIZES.SPACE_MD,
  },
  biometricButton: {
    marginBottom: THEME.SIZES.SPACE_LG,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: THEME.SIZES.SPACE_LG,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: THEME.COLORS.BORDER,
  },
  dividerText: {
    marginHorizontal: THEME.SIZES.SPACE_MD,
    fontSize: THEME.SIZES.FONT_SM,
    color: THEME.COLORS.TEXT_SECONDARY,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: THEME.SIZES.SPACE_LG,
  },
  footerText: {
    fontSize: THEME.SIZES.FONT_MD,
    color: THEME.COLORS.TEXT_SECONDARY,
  },
  registerLink: {
    color: THEME.COLORS.PRIMARY,
    fontWeight: '600',
  },
});
