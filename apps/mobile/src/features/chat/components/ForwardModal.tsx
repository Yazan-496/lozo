import { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Avatar } from '../../../shared/components/Avatar';
import { ConversationSkeleton } from '../../../shared/components/ConversationSkeleton';
import { api } from '../../../shared/services/api';
import { lightColors as colors } from '../../../shared/utils/theme';
import type { Message, Conversation } from '../../../shared/types';

interface ForwardModalProps {
  visible: boolean;
  message: Message | null;
  onClose: () => void;
  onForward: (conversationId: string) => void;
  excludeConversationId?: string;
}

export function ForwardModal({
  visible,
  message,
  onClose,
  onForward,
  excludeConversationId,
}: ForwardModalProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadConversations();
    }
  }, [visible]);

  async function loadConversations() {
    setLoading(true);
    try {
      const { data } = await api.get<Conversation[]>('/chat/conversations');
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  }

  function renderConversation({ item }: { item: Conversation }) {
    const lastMessagePreview = item.lastMessage
      ? item.lastMessage.deletedForEveryone
        ? 'Message deleted'
        : item.lastMessage.content || '[Message]'
      : 'No messages yet';

    const isCurrent = item.id === excludeConversationId;
    return (
      <TouchableOpacity
        style={[styles.conversationRow, isCurrent && { opacity: 0.4 }]}
        onPress={() => !isCurrent && onForward(item.id)}
        disabled={isCurrent}
      >
        <Avatar
          uri={item.otherUser.avatarUrl}
          name={item.otherUser.displayName}
          color={item.otherUser.avatarColor}
          size={44}
          isOnline={false}
        />
        <View style={styles.conversationInfo}>
          <Text style={styles.displayName} numberOfLines={1}>
            {item.otherUser.displayName}
            {isCurrent ? ' (current)' : ''}
          </Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {lastMessagePreview}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Forward to</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>×</Text>
          </TouchableOpacity>
        </View>

        {/* Body */}
        {loading ? (
          <ConversationSkeleton />
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={renderConversation}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.dark,
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 28,
    color: colors.gray400,
  },
  listContent: {
    paddingVertical: 8,
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
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: colors.gray500,
  },
});
