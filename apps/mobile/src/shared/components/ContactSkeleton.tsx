import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Shimmer } from './Shimmer';
import { colors } from '../utils/theme';

export function ContactSkeleton() {
  const rows = Array(8).fill(0);

  return (
    <Shimmer>
      <View style={styles.container}>
        {rows.map((_, idx) => (
          <View key={idx} style={styles.row}>
            <View style={styles.avatar} />
            <View style={[styles.text, styles.textName]} />
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray200,
    marginRight: 12,
  },
  text: {
    height: 12,
    backgroundColor: colors.gray200,
    borderRadius: 6,
  },
  textName: {
    width: '50%',
    flex: 1,
  },
});
