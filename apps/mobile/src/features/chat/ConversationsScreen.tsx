import { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Avatar } from '../../shared/components/Avatar';
import { ConversationSkeleton } from '../../shared/components/ConversationSkeleton';
import { OfflineBanner } from '../../shared/components/OfflineBanner';
import { api } from '../../shared/services/api';
import { getSocket } from '../../shared/services/socket';
import { useAuthStore } from '../../shared/stores/auth';
import { usePresenceStore } from '../../shared/stores/presence';
import { useNotificationsStore } from '../../shared/stores/notifications';
import { useConversationsStore } from '../../shared/stores/conversations';
import { useNetworkStore } from '../../shared/stores/network';
import { useThemeColors } from '../../shared/hooks/useThemeColors';
import { getCachedConversations, upsertConversations, hideCachedConversation } from '../../shared/db/conversations.db.ts';
import type { ThemeColors } from '../../shared/utils/theme';
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

  if (days === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
  const [contactNicknameMap, setContactNicknameMap] = useState<Record<string, string>>({});
  const [contactRelationshipMap, setContactRelationshipMap] = useState<Record<string, 'friend' | 'lover'>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const currentUser = useAuthStore((s) => s.user);
  const onlineUserIds = usePresenceStore((s) => s.onlineUserIds);
  const setTotalUnread = useNotificationsStore((s) => s.setTotalUnreadMessages);
  const hiddenConversationIds = useConversationsStore((s) => s.hiddenConversationIds);
  const isOnline = useNetworkStore((s) => s.isOnline);
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Load from SQLite cache immediately, then sync from server when online
  async function loadConversations() {
    // 1. Show cached data right away
    try {
      const cached = await getCachedConversations();
      if (cached.length > 0) {
        setConversations(cached);
        if (isFirstLoad) setIsFirstLoad(false);
      }
    } catch (err) {
      console.error('Cache load failed:', err);
    }

    // 2. Fetch from server when online
    if (!isOnline) {
      if (isFirstLoad) setIsFirstLoad(false);
      return;
    }

    try {
      const [conversationsRes, contactsRes] = await Promise.all([
        api.get<Conversation[]>('/chat/conversations'),
        api.get<any[]>('/contacts'),
      ]);

      const data = conversationsRes.data;
      setConversations(data);
      setTotalUnread(data.reduce((sum, c) => sum + c.unreadCount, 0));
      void upsertConversations(data);

      const nicknameMap: Record<string, string> = {};
      const relationshipMap: Record<string, 'friend' | 'lover'> = {};
      contactsRes.data.forEach((contact: any) => {
        nicknameMap[contact.user.id] = contact.nickname || contact.user.displayName;
        relationshipMap[contact.user.id] = contact.relationshipType;
      });
      setContactNicknameMap(nicknameMap);
      setContactRelationshipMap(relationshipMap);

      if (isFirstLoad) setIsFirstLoad(false);
    } catch (err) {
      console.error('Failed to load conversations from server:', err);
      if (isFirstLoad) setIsFirstLoad(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadConversations();

      const socket = getSocket();
      if (!socket) return;

      function onNewMessage() {
        loadConversations();
      }

      function onMessageStatus(data: { conversationId: string; status: string }) {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === data.conversationId && conv.lastMessage
              ? { ...conv, lastMessage: { ...conv.lastMessage, status: data.status as any } }
              : conv,
          ),
        );
      }

      function onConversationDeleted(data: { conversationId: string }) {
        useConversationsStore.getState().addHiddenConversation(data.conversationId);
        void hideCachedConversation(data.conversationId);
      }

      function onConnect() {
        loadConversations();
      }

      socket.on('message:new', onNewMessage);
      socket.on('messages:status', onMessageStatus);
      socket.on('conversation:deleted', onConversationDeleted);
      socket.on('connect', onConnect);
      return () => {
        socket.off('message:new', onNewMessage);
        socket.off('messages:status', onMessageStatus);
        socket.off('conversation:deleted', onConversationDeleted);
        socket.off('connect', onConnect);
      };
    }, [isOnline]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  }

  function renderConversation({ item }: { item: Conversation }) {
    const { otherUser } = item;
    const displayName = contactNicknameMap[otherUser.id] || otherUser.displayName;
    const relationshipType = contactRelationshipMap[otherUser.id] || 'friend';

    return (
      <TouchableOpacity
        style={styles.conversationRow}
        activeOpacity={0.6}
        onPress={() => navigation.navigate('Chat', { conversationId: item.id, otherUser, relationshipType })}
      >
        <Avatar
          uri={otherUser.avatarUrl}
          name={displayName}
          color={otherUser.avatarColor}
          size={56}
          isOnline={onlineUserIds.has(otherUser.id)}
        />
        <View style={styles.conversationInfo}>
          <View style={styles.conversationTop}>
            <Text style={styles.conversationName} numberOfLines={1}>
              {displayName}
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
            {item.lastMessage?.senderId === currentUser?.id && item.lastMessage?.status === 'read' ? (
              <Avatar
                uri={otherUser.avatarUrl}
                name={otherUser.displayName}
                color={otherUser.avatarColor}
                size={14}
              />
            ) : item.unreadCount > 0 ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (isFirstLoad && conversations.length === 0) {
    return isOnline ? <ConversationSkeleton /> : (
      <View style={styles.container}>
        <OfflineBanner />
        <View style={styles.offlineEmpty}>
          <Text style={styles.offlineEmptyText}>No conversations loaded yet.{'\n'}Connect to get started.</Text>
        </View>
      </View>
    );
  }

  const filteredConversations = conversations.filter(
    (conv) => !hiddenConversationIds.has(conv.id),
  );

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          !isOnline ? (
            <View style={styles.offlineEmpty}>
              <Text style={styles.offlineEmptyText}>You're offline. Connect to load your conversations.</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptySubtitle}>Add contacts to start chatting</Text>
            </View>
          )
        }
      />
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
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
      color: '#FFFFFF',
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
    offlineEmpty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 80,
      paddingHorizontal: 32,
    },
    offlineEmptyText: {
      color: colors.gray400,
      fontSize: 15,
      textAlign: 'center',
      lineHeight: 22,
    },
  });
}
