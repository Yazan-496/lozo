import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { lightColors as colors } from '../utils/theme';

interface SplashViewProps {
  onHide: () => void;
  visible: boolean;
}

export function SplashView({ onHide, visible }: SplashViewProps) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onHide();
      });
    }
  }, [visible, opacity, onHide]);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.logoContainer}>
        <View style={styles.circle}>
          <Text style={styles.letter}>L</Text>
        </View>
        <Text style={styles.brandName}>LoZo</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  logoContainer: {
    alignItems: 'center',
  },
  circle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  letter: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.white,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.dark,
  },
});
