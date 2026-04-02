import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, chatApi } from '../../shared/services/api';
import { useThemeColors } from '../../shared/hooks/useThemeColors';

interface Props {
  storyId: string;
  storyOwnerId: string;
  storyThumbnailUrl: string | null;
  onSent?: () => void;
}

export function StoryReplyInput({
  storyId,
  storyOwnerId,
  storyThumbnailUrl,
  onSent,
}: Props) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const colors = useThemeColors();

  const canSend = useMemo(() => text.trim().length > 0 && !sending, [sending, text]);

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    try {
      const { data: conversation } = await chatApi.getOrCreateConversation(storyOwnerId);
      await api.post(`/chat/conversations/${conversation.id}/messages`, {
        type: 'text',
        content: text.trim(),
        storyReplyId: storyId,
        storyThumbnailUrl,
      });
      setText('');
      onSent?.();
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Reply to story..."
        placeholderTextColor={colors.gray400}
        style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.dark }]}
      />
      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        style={[
          styles.sendButton,
          { backgroundColor: canSend ? colors.primary : colors.gray300 },
        ]}
      >
        <Ionicons name="arrow-up" size={18} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
