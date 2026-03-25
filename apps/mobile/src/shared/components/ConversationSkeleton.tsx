import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Shimmer } from './Shimmer';
import { colors } from '../utils/theme';

export function ConversationSkeleton() {
  const rows = Array(6).fill(0);

  return (
    <Shimmer>
      <View style={styles.container}>
        {rows.map((_, idx) => (
          <View key={idx} style={styles.row}>
            <View style={styles.avatar} />
            <View style={styles.textContainer}>
              <View style={[styles.text, styles.textLarge]} />
              <View style={[styles.text, styles.textSmall]} />
            </View>
          </View>
        ))}
      </View>
    </Shimmer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gray200,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  text: {
    height: 12,
    backgroundColor: colors.gray200,
    borderRadius: 6,
    marginBottom: 6,
  },
  textLarge: {
    width: '60%',
  },
  textSmall: {
    width: '40%',
  },
});
