import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '../../../shared/hooks/useThemeColors';

interface Props {
  thumbnailUrl: string | null;
  isExpired: boolean;
}

export function StoryReplyBubble({ thumbnailUrl, isExpired }: Props) {
  const colors = useThemeColors();
  return (
    <View style={[styles.container, { borderColor: colors.border, backgroundColor: colors.bgSecondary }]}>
      {thumbnailUrl && !isExpired ? (
        <Image source={{ uri: thumbnailUrl }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.placeholder, { backgroundColor: colors.gray200 }]}>
          <Text style={[styles.placeholderText, { color: colors.gray500 }]}>Expired</Text>
        </View>
      )}
      <View style={styles.meta}>
        <Text style={[styles.label, { color: colors.gray500 }]}>Replied to story</Text>
        <Text style={[styles.value, { color: colors.dark }]} numberOfLines={1}>
          {thumbnailUrl && !isExpired ? 'Story preview' : 'Story expired'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 10,
    padding: 6,
    marginBottom: 6,
    maxWidth: 220,
    alignItems: 'center',
  },
  thumb: {
    width: 40,
    height: 56,
    borderRadius: 6,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 10,
    fontWeight: '600',
  },
  meta: {
    marginLeft: 8,
    flex: 1,
  },
  label: {
    fontSize: 11,
    marginBottom: 2,
  },
  value: {
    fontSize: 12,
    fontWeight: '600',
  },
});
