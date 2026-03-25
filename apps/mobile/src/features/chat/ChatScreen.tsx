import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Avatar } from '../../shared/components/Avatar';
import { api } from '../../shared/services/api';
import { getSocket } from '../../shared/services/socket';
import { useAuthStore } from '../../shared/stores/auth';
import type { Message, User } from '../../shared/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

function formatMessageTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ChatScreen({ navigation, route }: Props) {
  const { conversationId, user: otherUser } = route.params as {
    conversationId: string;
    user: User;
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const currentUser = useAuthStore((s) => s.user);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View className="flex-row items-center">
          <Avatar
            uri={otherUser.avatarUrl}
            name={otherUser.displayName}
            color={otherUser.avatarColor}
            size={36}
            isOnline={otherUser.isOnline}
          />
          <View className="ml-2">
            <Text className="text-base font-semibold">{otherUser.displayName}</Text>
            <Text className="text-xs text-gray-400">
              {isTyping ? 'typing...' : otherUser.isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
      ),
    });
  }, [otherUser, isTyping]);

  async function loadMessages() {
    try {
      const { data } = await api.get<Message[]>(
        `/chat/conversations/${conversationId}/messages`,
      );
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }

  useEffect(() => {
    loadMessages();

    // Mark as read
    api.post(`/chat/conversations/${conversationId}/read`).catch(() => {});

    const socket = getSocket();
    if (!socket) return;

    // Listen for new messages in this conversation
    function onNewMessage(data: { message: Message; conversationId: string }) {
      if (data.conversationId === conversationId) {
        setMessages((prev) => [data.message, ...prev]);
        // Mark as read immediately since we're viewing
        api.post(`/chat/conversations/${conversationId}/read`).catch(() => {});
        socket?.emit('messages:read', {
          conversationId,
          senderId: otherUser.id,
        });
      }
    }

    function onMessageEdited(data: { message: Message; conversationId: string }) {
      if (data.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === data.message.id ? { ...m, ...data.message } : m)),
        );
      }
    }

    function onMessageDeleted(data: { messageId: string; conversationId: string }) {
      if (data.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.messageId
              ? { ...m, deletedForEveryone: true, content: null, mediaUrl: null }
              : m,
          ),
        );
      }
    }

    function onReaction(data: {
      messageId: string;
      userId: string;
      emoji: string;
      action: string;
      conversationId: string;
    }) {
      if (data.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== data.messageId) return m;
            let reactions = [...m.reactions];
            if (data.action === 'removed') {
              reactions = reactions.filter((r) => r.userId !== data.userId);
            } else {
              const idx = reactions.findIndex((r) => r.userId === data.userId);
              if (idx >= 0) {
                reactions[idx] = { emoji: data.emoji, userId: data.userId };
              } else {
                reactions.push({ emoji: data.emoji, userId: data.userId });
              }
            }
            return { ...m, reactions };
          }),
        );
      }
    }

    function onTypingStart(data: { userId: string; conversationId: string }) {
      if (data.conversationId === conversationId && data.userId === otherUser.id) {
        setIsTyping(true);
      }
    }

    function onTypingStop(data: { userId: string; conversationId: string }) {
      if (data.conversationId === conversationId && data.userId === otherUser.id) {
        setIsTyping(false);
      }
    }

    function onMessageStatus(data: {
      conversationId: string;
      status: string;
      userId: string;
    }) {
      if (data.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === currentUser?.id ? { ...m, status: data.status as any } : m,
          ),
        );
      }
    }

    socket.on('message:new', onNewMessage);
    socket.on('message:edited', onMessageEdited);
    socket.on('message:deleted', onMessageDeleted);
    socket.on('message:reaction', onReaction);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);
    socket.on('messages:status', onMessageStatus);

    return () => {
      socket.off('message:new', onNewMessage);
      socket.off('message:edited', onMessageEdited);
      socket.off('message:deleted', onMessageDeleted);
      socket.off('message:reaction', onReaction);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
      socket.off('messages:status', onMessageStatus);
    };
  }, [conversationId]);

  function handleTyping() {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('typing:start', {
      conversationId,
      recipientId: otherUser.id,
    });

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('typing:stop', {
        conversationId,
        recipientId: otherUser.id,
      });
    }, 2000);
  }

  function handleSend() {
    if (!text.trim()) return;

    const socket = getSocket();
    if (!socket) return;

    socket.emit(
      'message:send',
      {
        conversationId,
        type: 'text',
        content: text.trim(),
      },
      (response: any) => {
        if (response.success) {
          setMessages((prev) => [
            { ...response.message, reactions: [], replyTo: null, status: 'sent' },
            ...prev,
          ]);
          setText('');
        } else {
          Alert.alert('Error', response.error);
        }
      },
    );

    // Stop typing
    socket.emit('typing:stop', {
      conversationId,
      recipientId: otherUser.id,
    });
  }

  function getStatusIcon(status: string | null): string {
    switch (status) {
      case 'sent': return '✓';
      case 'delivered': return '✓✓';
      case 'read': return '✓✓';
      default: return '';
    }
  }

  function renderMessage({ item }: { item: Message }) {
    const isMe = item.senderId === currentUser?.id;

    if (item.deletedForEveryone) {
      return (
        <View className={`mx-4 my-1 ${isMe ? 'items-end' : 'items-start'}`}>
          <View className="bg-gray-100 px-4 py-2 rounded-2xl">
            <Text className="text-gray-400 italic text-sm">Message deleted</Text>
          </View>
        </View>
      );
    }

    return (
      <View className={`mx-4 my-1 ${isMe ? 'items-end' : 'items-start'}`}>
        {item.isForwarded && (
          <Text className="text-xs text-gray-400 italic mb-0.5 mx-2">
            Forwarded
          </Text>
        )}
        {item.replyTo && (
          <View className={`mx-2 mb-0.5 px-3 py-1 rounded-lg border-l-2 ${
            isMe ? 'bg-blue-50 border-primary' : 'bg-gray-50 border-gray-300'
          }`}>
            <Text className="text-xs text-gray-500" numberOfLines={1}>
              {item.replyTo.deletedForEveryone
                ? 'Message deleted'
                : item.replyTo.content || `[${item.replyTo.type}]`}
            </Text>
          </View>
        )}
        <View
          className={`max-w-[80%] px-4 py-2 rounded-2xl ${
            isMe ? 'bg-primary' : 'bg-gray-100'
          }`}
        >
          {item.type === 'text' && (
            <Text className={`text-base ${isMe ? 'text-white' : 'text-dark'}`}>
              {item.content}
            </Text>
          )}
          {item.type === 'image' && (
            <Text className={`text-base ${isMe ? 'text-white' : 'text-dark'}`}>
              📷 {item.content || 'Photo'}
            </Text>
          )}
          {item.type === 'voice' && (
            <Text className={`text-base ${isMe ? 'text-white' : 'text-dark'}`}>
              🎤 Voice message
            </Text>
          )}
          {item.type === 'file' && (
            <Text className={`text-base ${isMe ? 'text-white' : 'text-dark'}`}>
              📎 {item.mediaName || 'File'}
            </Text>
          )}
          <View className="flex-row justify-end items-center mt-0.5 gap-1">
            {item.editedAt && (
              <Text className={`text-[10px] ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                edited
              </Text>
            )}
            <Text className={`text-[10px] ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
              {formatMessageTime(item.createdAt)}
            </Text>
            {isMe && item.status && (
              <Text
                className={`text-[10px] ${
                  item.status === 'read' ? 'text-blue-200' : isMe ? 'text-blue-300' : 'text-gray-400'
                }`}
              >
                {getStatusIcon(item.status)}
              </Text>
            )}
          </View>
        </View>
        {item.reactions.length > 0 && (
          <View className="flex-row mx-2 mt-0.5">
            {item.reactions.map((r, i) => (
              <Text key={i} className="text-sm">
                {r.emoji}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white"
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={{ paddingVertical: 8 }}
      />

      <View className="flex-row items-center px-3 py-2 border-t border-gray-100">
        <TextInput
          value={text}
          onChangeText={(t) => {
            setText(t);
            handleTyping();
          }}
          placeholder="Message..."
          className="flex-1 bg-gray-50 px-4 py-2.5 rounded-full text-base mr-2"
          placeholderTextColor="#8A8D91"
          multiline
          maxLength={5000}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!text.trim()}
          className={`w-10 h-10 rounded-full items-center justify-center ${
            text.trim() ? 'bg-primary' : 'bg-gray-100'
          }`}
        >
          <Text className={`text-lg ${text.trim() ? 'text-white' : 'text-gray-400'}`}>
            ↑
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
