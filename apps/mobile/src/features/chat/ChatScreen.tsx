import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Avatar } from '../../shared/components/Avatar';
import { MessageSkeleton } from '../../shared/components/MessageSkeleton';
import { useToast } from '../../shared/components/Toast';
import { api } from '../../shared/services/api';
import { getSocket } from '../../shared/services/socket';
import { useAuthStore } from '../../shared/stores/auth';
import { colors } from '../../shared/utils/theme';
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
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const currentUser = useAuthStore((s) => s.user);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();
  const { showToast } = useToast();

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerRow}>
          <Avatar
            uri={otherUser.avatarUrl}
            name={otherUser.displayName}
            color={otherUser.avatarColor}
            size={36}
            isOnline={otherUser.isOnline}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{otherUser.displayName}</Text>
            <Text style={styles.headerStatus}>
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
      if (isFirstLoad) setIsFirstLoad(false);
    } catch (err) {
      console.error('Failed to load messages:', err);
      if (isFirstLoad) setIsFirstLoad(false);
    }
  }

  useEffect(() => {
    loadMessages();

    api.post(`/chat/conversations/${conversationId}/read`).catch(() => {});

    const socket = getSocket();
    if (!socket) return;

    function onNewMessage(data: { message: Message; conversationId: string }) {
      if (data.conversationId === conversationId) {
        setMessages((prev) => [data.message, ...prev]);
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
          showToast('error', response.error);
        }
      },
    );

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
        <View style={[styles.messageRow, isMe ? styles.messageRowEnd : styles.messageRowStart]}>
          <View style={styles.deletedBubble}>
            <Text style={styles.deletedText}>Message deleted</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.messageRow, isMe ? styles.messageRowEnd : styles.messageRowStart]}>
        {item.isForwarded && (
          <Text style={styles.forwardedLabel}>Forwarded</Text>
        )}
        {item.replyTo && (
          <View style={[
            styles.replyContainer,
            isMe ? styles.replyContainerMe : styles.replyContainerOther,
          ]}>
            <Text style={styles.replyText} numberOfLines={1}>
              {item.replyTo.deletedForEveryone
                ? 'Message deleted'
                : item.replyTo.content || `[${item.replyTo.type}]`}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isMe ? styles.bubbleMe : styles.bubbleOther,
          ]}
        >
          {item.type === 'text' && (
            <Text style={[styles.messageText, isMe ? styles.textMe : styles.textOther]}>
              {item.content}
            </Text>
          )}
          {item.type === 'image' && (
            <Text style={[styles.messageText, isMe ? styles.textMe : styles.textOther]}>
              📷 {item.content || 'Photo'}
            </Text>
          )}
          {item.type === 'voice' && (
            <Text style={[styles.messageText, isMe ? styles.textMe : styles.textOther]}>
              🎤 Voice message
            </Text>
          )}
          {item.type === 'file' && (
            <Text style={[styles.messageText, isMe ? styles.textMe : styles.textOther]}>
              📎 {item.mediaName || 'File'}
            </Text>
          )}
          <View style={styles.messageFooter}>
            {item.editedAt && (
              <Text style={[styles.metaText, isMe ? styles.metaMe : styles.metaOther]}>
                edited
              </Text>
            )}
            <Text style={[styles.metaText, isMe ? styles.metaMe : styles.metaOther]}>
              {formatMessageTime(item.createdAt)}
            </Text>
            {isMe && item.status && (
              <Text
                style={[
                  styles.metaText,
                  item.status === 'read' ? styles.statusRead : styles.metaMe,
                ]}
              >
                {getStatusIcon(item.status)}
              </Text>
            )}
          </View>
        </View>
        {item.reactions.length > 0 && (
          <View style={styles.reactionsRow}>
            {item.reactions.map((r, i) => (
              <Text key={i} style={styles.reactionEmoji}>
                {r.emoji}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  }

  const canSend = text.trim().length > 0;

  if (isFirstLoad && messages.length === 0) {
    return <MessageSkeleton />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={styles.messagesList}
      />

      <View style={styles.inputBar}>
        <TextInput
          value={text}
          onChangeText={(t) => {
            setText(t);
            handleTyping();
          }}
          placeholder="Message..."
          style={styles.textInput}
          placeholderTextColor={colors.gray400}
          multiline
          maxLength={5000}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!canSend}
          style={[styles.sendButton, canSend ? styles.sendActive : styles.sendInactive]}
        >
          <Text style={[styles.sendIcon, canSend ? styles.sendIconActive : styles.sendIconInactive]}>
            ↑
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  messagesList: {
    paddingVertical: 8,
  },
  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfo: {
    marginLeft: 8,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
  },
  headerStatus: {
    fontSize: 12,
    color: colors.gray400,
  },
  // Messages
  messageRow: {
    marginHorizontal: 16,
    marginVertical: 2,
  },
  messageRowEnd: {
    alignItems: 'flex-end',
  },
  messageRowStart: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bubbleMe: {
    backgroundColor: colors.primary,
  },
  bubbleOther: {
    backgroundColor: colors.gray50,
  },
  messageText: {
    fontSize: 16,
  },
  textMe: {
    color: colors.white,
  },
  textOther: {
    color: colors.dark,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  metaText: {
    fontSize: 10,
  },
  metaMe: {
    color: 'rgba(255,255,255,0.6)',
  },
  metaOther: {
    color: colors.gray400,
  },
  statusRead: {
    color: 'rgba(255,255,255,0.8)',
  },
  // Deleted
  deletedBubble: {
    backgroundColor: colors.gray50,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  deletedText: {
    color: colors.gray400,
    fontStyle: 'italic',
    fontSize: 14,
  },
  // Forwarded
  forwardedLabel: {
    fontSize: 12,
    color: colors.gray400,
    fontStyle: 'italic',
    marginBottom: 2,
    marginHorizontal: 8,
  },
  // Reply
  replyContainer: {
    marginHorizontal: 8,
    marginBottom: 2,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderLeftWidth: 2,
  },
  replyContainerMe: {
    backgroundColor: 'rgba(0,132,255,0.1)',
    borderLeftColor: colors.primary,
  },
  replyContainerOther: {
    backgroundColor: colors.gray50,
    borderLeftColor: colors.gray300,
  },
  replyText: {
    fontSize: 12,
    color: colors.gray500,
  },
  // Reactions
  reactionsRow: {
    flexDirection: 'row',
    marginHorizontal: 8,
    marginTop: 2,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.gray50,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    fontSize: 16,
    marginRight: 8,
    color: colors.dark,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendActive: {
    backgroundColor: colors.primary,
  },
  sendInactive: {
    backgroundColor: colors.gray100,
  },
  sendIcon: {
    fontSize: 18,
    fontWeight: '700',
  },
  sendIconActive: {
    color: colors.white,
  },
  sendIconInactive: {
    color: colors.gray400,
  },
});
