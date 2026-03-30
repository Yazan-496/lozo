import { useEffect, useMemo, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useThemeColors } from '../../../shared/hooks/useThemeColors';
import type { ThemeColors } from '../../../shared/utils/theme';

const DOT_SIZE = 8;
const STAGGER = 150;
const HALF_DURATION = 200;

export function TypingIndicator() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const dot0 = useRef(new Animated.Value(1)).current;
  const dot1 = useRef(new Animated.Value(1)).current;
  const dot2 = useRef(new Animated.Value(1)).current;
  const dots = [dot0, dot1, dot2];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * STAGGER),
          Animated.timing(dot, { toValue: 1.5, duration: HALF_DURATION, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 1.0, duration: HALF_DURATION, useNativeDriver: true }),
        ]),
      ),
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        {dots.map((dot, i) => (
          <Animated.View key={i} style={[styles.dot, { transform: [{ scale: dot }] }]} />
        ))}
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { paddingHorizontal: 16, paddingVertical: 4, alignItems: 'flex-start' },
    bubble: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.gray100,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 5,
    },
    dot: {
      width: DOT_SIZE,
      height: DOT_SIZE,
      borderRadius: DOT_SIZE / 2,
      backgroundColor: colors.gray400,
    },
  });
}
