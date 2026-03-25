import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Shimmer } from './Shimmer';
import { colors } from '../utils/theme';

export function MessageSkeleton() {
  const messages = [
    { side: 'left', width: '70%' },
    { side: 'right', width: '60%' },
    { side: 'left', width: '80%' },
    { side: 'right', width: '65%' },
    { side: 'left', width: '75%' },
  ];

  return (
    <Shimmer>
      <View style={styles.container}>
        {messages.map((msg, idx) => (
          <View
            key={idx}
            style={[
              styles.messageBubble,
              msg.side === 'right' ? styles.rightBubble : styles.leftBubble,
            ]}
          >
            <View
              style={[
                styles.skeletonBox,
                { width: msg.width },
              ]}
            />
          </View>
        ))}
      </View>
    </Shimmer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  messageBubble: {
    marginVertical: 8,
  },
  leftBubble: {
    alignItems: 'flex-start',
  },
  rightBubble: {
    alignItems: 'flex-end',
  },
  skeletonBox: {
    height: 44,
    backgroundColor: colors.gray200,
    borderRadius: 18,
  },
});
