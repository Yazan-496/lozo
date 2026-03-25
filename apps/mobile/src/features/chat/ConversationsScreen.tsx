import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Avatar } from '../../shared/components/Avatar';
import { api } from '../../shared/services/api';
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
        className="flex-row items-center px-4 py-3"
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
        <View className="flex-1 ml-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-base font-semibold text-dark" numberOfLines={1}>
              {otherUser.displayName}
            </Text>
            {item.lastMessage && (
              <Text className="text-xs text-gray-400">
                {formatTime(item.lastMessage.createdAt)}
              </Text>
            )}
          </View>
          <View className="flex-row justify-between items-center mt-1">
            <Text className="text-sm text-gray-400 flex-1 mr-2" numberOfLines={1}>
              {getLastMessagePreview(item)}
            </Text>
            {item.unreadCount > 0 && (
              <View className="bg-primary rounded-full min-w-[20px] h-5 items-center justify-center px-1.5">
                <Text className="text-white text-xs font-bold">
                  {item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center pt-20">
            <Text className="text-gray-400 text-base">No conversations yet</Text>
            <Text className="text-gray-300 text-sm mt-1">
              Add contacts to start chatting
            </Text>
          </View>
        }
      />
    </View>
  );
}
