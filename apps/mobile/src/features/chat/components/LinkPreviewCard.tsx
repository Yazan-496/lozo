import React from 'react';
import { View, Text, Image, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import type { LinkPreview } from '../../../shared/types';

interface Props {
  preview: LinkPreview;
  /** Pass onDismiss to show an × button (used in input bar preview) */
  onDismiss?: () => void;
  isOwn?: boolean;
}

export function LinkPreviewCard({ preview, onDismiss, isOwn = false }: Props) {
  const handlePress = () => {
    Linking.openURL(preview.url).catch(() => undefined);
  };

  const hasContent = preview.title || preview.description;
  if (!hasContent && !preview.image) return null;

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}
    >
      {preview.image ? (
        <Image
          source={{ uri: preview.image }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : null}
      <View style={styles.textBody}>
        {preview.title ? (
          <Text style={styles.title} numberOfLines={2}>
            {preview.title}
          </Text>
        ) : null}
        {preview.description ? (
          <Text style={styles.description} numberOfLines={3}>
            {preview.description}
          </Text>
        ) : null}
        <Text style={styles.domain} numberOfLines={1}>
          {new URL(preview.url).hostname}
        </Text>
      </View>
      {onDismiss ? (
        <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn} hitSlop={8}>
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
    marginVertical: 4,
  },
  ownContainer: {
    borderColor: '#c8dcf5',
    backgroundColor: '#eef5fd',
  },
  otherContainer: {
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  image: {
    width: '100%',
    height: 160,
  },
  textBody: {
    padding: 8,
    gap: 2,
  },
  title: {
    fontWeight: '600',
    fontSize: 13,
    color: '#111',
  },
  description: {
    fontSize: 12,
    color: '#555',
  },
  domain: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  dismissBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
