import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useThemeColors } from '../../shared/hooks/useThemeColors';

interface Props {
  totalSegments: number;
  currentIndex: number;
  progress: Animated.Value;
}

export function StoryProgressBar({ totalSegments, currentIndex, progress }: Props) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      {Array.from({ length: totalSegments }).map((_, index) => {
        const filled = index < currentIndex;
        const current = index === currentIndex;
        return (
          <View key={index} style={[styles.segment, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
            {filled ? (
              <View style={[styles.fill, { width: '100%', backgroundColor: colors.white }]} />
            ) : current ? (
              <Animated.View
                style={[
                  styles.fill,
                  {
                    backgroundColor: colors.white,
                    width: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 4,
    width: '100%',
  },
  segment: {
    flex: 1,
    height: 2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});
