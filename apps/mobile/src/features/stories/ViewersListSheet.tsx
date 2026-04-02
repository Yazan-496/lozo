import React from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../../shared/components/Avatar';
import { useThemeColors } from '../../shared/hooks/useThemeColors';
import { useStoryViewers } from './hooks/useStoryViewers';

interface Props {
  storyId: string;
  visible: boolean;
  onClose: () => void;
}

function viewedAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.max(Math.floor(diff / 60000), 0);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ViewersListSheet({ storyId, visible, onClose }: Props) {
  const colors = useThemeColors();
  const { viewers, loading } = useStoryViewers(storyId);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.bg }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.dark }]}>Viewers</Text>
          <Text style={[styles.count, { color: colors.gray500 }]}>{viewers.length} views</Text>
        </View>

        {loading ? (
          <Text style={[styles.empty, { color: colors.gray500 }]}>Loading viewers...</Text>
        ) : viewers.length === 0 ? (
          <Text style={[styles.empty, { color: colors.gray500 }]}>No views yet</Text>
        ) : (
          <FlatList
            data={viewers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Avatar
                  uri={item.viewer.avatarUrl}
                  name={item.viewer.displayName}
                  color={item.viewer.avatarColor}
                  size={40}
                />
                <View style={styles.meta}>
                  <Text style={[styles.name, { color: colors.dark }]}>{item.viewer.displayName}</Text>
                  <Text style={[styles.when, { color: colors.gray500 }]}>{viewedAgo(item.viewedAt)}</Text>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '55%',
    paddingBottom: 18,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C7C7CC',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  count: {
    marginTop: 2,
    fontSize: 13,
  },
  list: {
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  meta: {
    marginLeft: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
  },
  when: {
    marginTop: 2,
    fontSize: 12,
  },
  empty: {
    paddingHorizontal: 16,
    fontSize: 14,
    paddingBottom: 10,
  },
});
