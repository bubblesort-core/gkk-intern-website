import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState('otp');
  const [otpSent, setOtpSent] = useState(false);

  // --- Looping ambient animations ---
  const orb1Y = useRef(new Animated.Value(0)).current;
  const orb2X = useRef(new Animated.Value(0)).current;
  const orb3Scale = useRef(new Animated.Value(1)).current;
  const glowPulse = useRef(new Animated.Value(0.04)).current;
  const borderGlow = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  // Card entrance
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    // Card entrance
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(cardTranslateY, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();

    // Looping orb float up/down
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb1Y, { toValue: -25, duration: 3000, useNativeDriver: true }),
        Animated.timing(orb1Y, { toValue: 25, duration: 3000, useNativeDriver: true }),
      ])
    ).start();

    // Looping orb drift left/right
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb2X, { toValue: 20, duration: 4000, useNativeDriver: true }),
        Animated.timing(orb2X, { toValue: -20, duration: 4000, useNativeDriver: true }),
      ])
    ).start();

    // Looping orb scale breathe
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb3Scale, { toValue: 1.3, duration: 2500, useNativeDriver: true }),
        Animated.timing(orb3Scale, { toValue: 0.8, duration: 2500, useNativeDriver: true }),
      ])
    ).start();

    // Looping background glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 0.09, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.03, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    // Looping border glow rotation (via opacity trick for subtle effect)
    Animated.loop(
      Animated.sequence([
        Animated.timing(borderGlow, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(borderGlow, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();

    // Shimmer across the button
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const checkEmailRegistered = async (emailToCheck) => {
    const { data, error } = await supabase
      .from('applications')
      .select('email')
      .eq('email', emailToCheck.trim())
      .single();
    if (error || !data) return false;
    return true;
  };

  const handleSendOtp = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter a valid email.');
      return;
    }
    setLoading(true);
    const isRegistered = await checkEmailRegistered(email);
    if (!isRegistered) {
      setLoading(false);
      Alert.alert('Not Registered', 'No application found with this email. Please apply on our website first.');
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
    setLoading(false);
    if (error) {
      Alert.alert('Login Failed', error.message);
    } else {
      setOtpSent(true);
      Alert.alert('Check your inbox', 'An OTP has been sent to your email.');
    }
  };

  const handleVerifyOtp = async () => {
    if (!email || !otp) {
      Alert.alert('Error', 'Please enter both email and OTP.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: otp.trim(), type: 'email' });
    setLoading(false);
    if (error) Alert.alert('Verification Failed', error.message);
  };

  const handlePasswordLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    const isRegistered = await checkEmailRegistered(email);
    if (!isRegistered) {
      setLoading(false);
      Alert.alert('Not Registered', 'No application found with this email. Please apply on our website first.');
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: password.trim() });
    setLoading(false);
    if (error) Alert.alert('Login Failed', error.message);
  };

  const borderGlowColor = borderGlow.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(34, 216, 122, 0.08)', 'rgba(34, 216, 122, 0.25)'],
  });

  const shimmerOpacity = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.85, 1, 0.85],
  });

  return (
    <View style={styles.container}>
      {/* Ambient floating orbs */}
      <Animated.View style={[styles.orb, styles.orb1, {
        opacity: glowPulse,
        transform: [{ translateY: orb1Y }],
      }]} />
      <Animated.View style={[styles.orb, styles.orb2, {
        opacity: glowPulse,
        transform: [{ translateX: orb2X }],
      }]} />
      <Animated.View style={[styles.orb, styles.orb3, {
        opacity: glowPulse,
        transform: [{ scale: orb3Scale }],
      }]} />

      {/* Subtle grid lines */}
      <View style={styles.gridLine1} />
      <View style={styles.gridLine2} />
      <View style={styles.gridLine3} />

      {/* Card with animated border */}
      <Animated.View style={[styles.cardOuter, { borderColor: borderGlowColor }]}>
        <Animated.View style={[styles.card, {
          opacity: cardOpacity,
          transform: [{ translateY: cardTranslateY }],
        }]}>
          {/* Logo mark */}
          <View style={styles.logoMark}>
            <Text style={styles.logoText}>GKK</Text>
          </View>

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            {otpSent 
              ? 'Enter the OTP sent to your email.'
              : 'Sign in to access your intern dashboard.'}
          </Text>
          
          <TextInput
            style={[styles.input, otpSent && styles.inputDisabled]}
            placeholder="Email address"
            placeholderTextColor={colors.textFaint}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!otpSent}
          />

          {!otpSent && loginMode === 'password' && (
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textFaint}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          )}

          {otpSent && (
            <TextInput
              style={styles.input}
              placeholder="Enter OTP"
              placeholderTextColor={colors.textFaint}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              autoFocus
            />
          )}
          
          {!otpSent ? (
            <>
              {loginMode === 'otp' ? (
                <Animated.View style={{ opacity: shimmerOpacity }}>
                  <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={loading}>
                    {loading ? <ActivityIndicator color="#0a0a0f" /> : <Text style={styles.buttonText}>Send Login OTP</Text>}
                  </TouchableOpacity>
                </Animated.View>
              ) : (
                <Animated.View style={{ opacity: shimmerOpacity }}>
                  <TouchableOpacity style={styles.button} onPress={handlePasswordLogin} disabled={loading}>
                    {loading ? <ActivityIndicator color="#0a0a0f" /> : <Text style={styles.buttonText}>Login with Password</Text>}
                  </TouchableOpacity>
                </Animated.View>
              )}

              <TouchableOpacity 
                style={styles.switchModeButton} 
                onPress={() => setLoginMode(loginMode === 'otp' ? 'password' : 'otp')}
              >
                <Text style={styles.switchModeText}>
                  {loginMode === 'otp' ? 'Switch to Password Login' : 'Switch to Email OTP Login'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Animated.View style={{ opacity: shimmerOpacity }}>
                <TouchableOpacity style={styles.button} onPress={handleVerifyOtp} disabled={loading}>
                  {loading ? <ActivityIndicator color="#0a0a0f" /> : <Text style={styles.buttonText}>Verify OTP</Text>}
                </TouchableOpacity>
              </Animated.View>
              
              <TouchableOpacity 
                style={styles.switchModeButton} 
                onPress={() => { setOtpSent(false); setOtp(''); }}
              >
                <Text style={styles.switchModeText}>← Go back</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </Animated.View>

      {/* Bottom branding */}
      <View style={styles.bottomBrand}>
        <View style={styles.brandDot} />
        <Text style={styles.brandText}>GKK INTERNS</Text>
        <View style={styles.brandDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: 24,
    overflow: 'hidden',
  },

  // Floating ambient orbs
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orb1: {
    width: 280,
    height: 280,
    backgroundColor: colors.primary,
    top: -60,
    right: -80,
  },
  orb2: {
    width: 200,
    height: 200,
    backgroundColor: colors.secondary,
    bottom: 60,
    left: -70,
  },
  orb3: {
    width: 120,
    height: 120,
    backgroundColor: colors.primary,
    bottom: -20,
    right: 50,
  },

  // Subtle grid lines
  gridLine1: {
    position: 'absolute',
    top: height * 0.2,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  gridLine2: {
    position: 'absolute',
    top: height * 0.5,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  gridLine3: {
    position: 'absolute',
    top: height * 0.8,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },

  // Card with animated border
  cardOuter: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 19,
    padding: 28,
  },

  // Logo mark
  logoMark: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  logoText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },

  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 20,
  },
  input: {
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    color: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 14,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  buttonText: {
    color: '#0a0a0f',
    fontSize: 16,
    fontWeight: '700',
  },
  switchModeButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  switchModeText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },

  // Bottom branding
  bottomBrand: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  brandDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    opacity: 0.5,
  },
  brandText: {
    color: colors.textFaint,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 4,
  },
});
