import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(20)).current;
  const barWidth = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  // Floating particles
  const particle1Y = useRef(new Animated.Value(0)).current;
  const particle2Y = useRef(new Animated.Value(0)).current;
  const particle3Y = useRef(new Animated.Value(0)).current;
  const particle1Opacity = useRef(new Animated.Value(0)).current;
  const particle2Opacity = useRef(new Animated.Value(0)).current;
  const particle3Opacity = useRef(new Animated.Value(0)).current;

  // Glow ring
  const ringScale = useRef(new Animated.Value(0.5)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Particles float up
    const floatParticle = (yVal, opacityVal, delay) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacityVal, { toValue: 0.6, duration: 400, useNativeDriver: true }),
          Animated.timing(yVal, { toValue: -60, duration: 2000, useNativeDriver: true }),
        ]),
        Animated.timing(opacityVal, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]);
    };

    // Main animation sequence
    Animated.sequence([
      // 1. Glow ring pulses in
      Animated.parallel([
        Animated.timing(ringOpacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.spring(ringScale, { toValue: 1.2, friction: 4, useNativeDriver: true }),
      ]),

      // 2. Logo scales up with bounce
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 0.1, duration: 400, useNativeDriver: true }),
      ]),

      // 3. Title slides up
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(titleTranslateY, { toValue: 0, friction: 6, useNativeDriver: true }),
      ]),

      // 4. Subtitle slides up
      Animated.parallel([
        Animated.timing(subtitleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(subtitleTranslateY, { toValue: 0, friction: 6, useNativeDriver: true }),
      ]),

      // 5. Loading bar fills
      Animated.timing(barWidth, { toValue: 1, duration: 1200, useNativeDriver: false }),

      // 6. Particles float up
      Animated.parallel([
        floatParticle(particle1Y, particle1Opacity, 0),
        floatParticle(particle2Y, particle2Opacity, 200),
        floatParticle(particle3Y, particle3Opacity, 400),
      ]),

      // 7. Fade out everything
      Animated.timing(screenOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => {
      if (onFinish) onFinish();
    });
  }, []);

  const barInterpolate = barWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>  
      {/* Background gradient dots */}
      <View style={styles.bgDot1} />
      <View style={styles.bgDot2} />
      <View style={styles.bgDot3} />

      {/* Glow ring behind logo */}
      <Animated.View style={[styles.glowRing, {
        opacity: ringOpacity,
        transform: [{ scale: ringScale }],
      }]} />

      {/* Logo */}
      <Animated.View style={[styles.logoContainer, {
        opacity: logoOpacity,
        transform: [{ scale: logoScale }],
      }]}>
        <Text style={styles.logoText}>GKK</Text>
        <View style={styles.logoDot} />
      </Animated.View>

      {/* Title */}
      <Animated.Text style={[styles.title, {
        opacity: titleOpacity,
        transform: [{ translateY: titleTranslateY }],
      }]}>
        GKK INTERNS
      </Animated.Text>

      {/* Subtitle */}
      <Animated.Text style={[styles.subtitle, {
        opacity: subtitleOpacity,
        transform: [{ translateY: subtitleTranslateY }],
      }]}>
        Your Career Starts Here
      </Animated.Text>

      {/* Loading bar */}
      <View style={styles.barContainer}>
        <Animated.View style={[styles.bar, { width: barInterpolate }]} />
      </View>

      {/* Floating particles */}
      <Animated.View style={[styles.particle, styles.particle1, {
        opacity: particle1Opacity,
        transform: [{ translateY: particle1Y }],
      }]} />
      <Animated.View style={[styles.particle, styles.particle2, {
        opacity: particle2Opacity,
        transform: [{ translateY: particle2Y }],
      }]} />
      <Animated.View style={[styles.particle, styles.particle3, {
        opacity: particle3Opacity,
        transform: [{ translateY: particle3Y }],
      }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bgDot1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(34, 216, 122, 0.05)',
    top: -50,
    right: -80,
  },
  bgDot2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(6, 228, 249, 0.03)',
    bottom: 100,
    left: -60,
  },
  bgDot3: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(34, 216, 122, 0.04)',
    bottom: -30,
    right: 40,
  },
  glowRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 24,
  },
  logoText: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 3,
  },
  logoDot: {
    position: 'absolute',
    bottom: 14,
    right: 18,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 6,
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 2,
    marginBottom: 40,
  },
  barContainer: {
    width: 160,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  particle: {
    position: 'absolute',
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  particle1: {
    width: 6,
    height: 6,
    bottom: height * 0.35,
    left: width * 0.3,
  },
  particle2: {
    width: 4,
    height: 4,
    bottom: height * 0.38,
    right: width * 0.3,
  },
  particle3: {
    width: 5,
    height: 5,
    bottom: height * 0.33,
    left: width * 0.55,
  },
});
