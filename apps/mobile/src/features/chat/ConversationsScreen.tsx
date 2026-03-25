import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Avatar } from '../../shared/components/Avatar';
import { api } from '../../shared/services/api';
import { colors } from '../../shared/utils/theme';
import type { Conversation } from '../../shared/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (days === 1) return 'Yesterday';
  if (days < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getLastMessagePreview(conv: Conversation): string {
  if (!conv.lastMessage) return 'No messages yet';
  if (conv.lastMessage.deletedForEveryone) return 'Message deleted';
  if (conv.lastMessage.type === 'image') return '📷 Photo';
  if (conv.lastMessage.type === 'voice') return '🎤 Voice message';
  if (conv.lastMessage.type === 'file') return '📎 File';
  return conv.lastMessage.content || '';
}

export function ConversationsScreen({ navigation }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function loadConversations() {
    try {
      const { data } = await api.get<Conversation[]>('/chat/conversations');
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, []),
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  }

  function renderConversation({ item }: { item: Conversation }) {
    const { otherUser } = item;

    return (
      <TouchableOpacity
        style={styles.conversationRow}
        activeOpacity={0.6}
        onPress={() =>
          navigation.navigate('Chat', {
            conversationId: item.id,
            user: otherUser,
          })
        }
      >
        <Avatar
          uri={otherUser.avatarUrl}
          name={otherUser.displayName}
          color={otherUser.avatarColor}
          size={56}
          isOnline={otherUser.isOnline}
        />
        <View style={styles.conversationInfo}>
          <View style={styles.conversationTop}>
            <Text style={styles.conversationName} numberOfLines={1}>
              {otherUser.displayName}
            </Text>
            {item.lastMessage && (
              <Text style={styles.conversationTime}>
                {formatTime(item.lastMessage.createdAt)}
              </Text>
            )}
          </View>
          <View style={styles.conversationBottom}>
            <Text style={styles.conversationPreview} numberOfLines={1}>
              {getLastMessagePreview(item)}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySubtitle}>
              Add contacts to start chatting
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  conversationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  conversationTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
    flex: 1,
  },
  conversationTime: {
    fontSize: 12,
    color: colors.gray400,
    marginLeft: 8,
  },
  conversationBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  conversationPreview: {
    fontSize: 14,
    color: colors.gray400,
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    color: colors.gray400,
    fontSize: 16,
  },
  emptySubtitle: {
    color: colors.gray300,
    fontSize: 14,
    marginTop: 4,
  },
});
