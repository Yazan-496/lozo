import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../shared/components/Avatar';
import { useThemeColors } from '../../shared/hooks/useThemeColors';
import type { StoryUser } from '../../shared/types';

interface Props {
  user: StoryUser;
  hasUnviewed: boolean;
  isOwn: boolean;
  hasStory?: boolean;
  onPress: () => void;
}

export function StoryBubble({ user, hasUnviewed, isOwn, hasStory = true, onPress }: Props) {
  const colors = useThemeColors();
  const ringColor = hasUnviewed ? colors.primary : '#8A8D91';
  const ringWidth = hasUnviewed ? 3 : 2;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.75}>
      <View
        style={[
          styles.ring,
          hasStory
            ? { borderColor: ringColor, borderWidth: ringWidth, borderStyle: 'solid' }
            : { borderColor: colors.gray300, borderWidth: 2, borderStyle: 'dashed' },
        ]}
      >
        <Avatar uri={user.avatarUrl} name={user.displayName} color={user.avatarColor} size={58} />
        {isOwn && !hasStory ? (
          <View style={[styles.plusBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={14} color={colors.white} />
          </View>
        ) : null}
      </View>
      <Text numberOfLines={1} style={[styles.name, { color: colors.dark }]}>
        {isOwn ? 'Your Story' : user.displayName}
      </Text>
      {isOwn && !hasStory ? (
        <Text style={[styles.addLabel, { color: colors.primary }]}>+ Add</Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 76,
  },
  ring: {
    borderRadius: 34,
    padding: 2,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  plusBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '500',
    maxWidth: 72,
  },
  addLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
  },
});
