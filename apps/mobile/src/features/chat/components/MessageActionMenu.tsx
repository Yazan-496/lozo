import { useEffect, useMemo, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useThemeColors } from '../../../shared/hooks/useThemeColors';
import type { ThemeColors } from '../../../shared/utils/theme';
import type { Message } from '../../../shared/types';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

export function canEdit(message: Message, currentUserId: string): boolean {
  return (
    message.senderId === currentUserId &&
    message.type === 'text' &&
    Date.now() - new Date(message.createdAt).getTime() < 15 * 60 * 1000
  );
}

export function canDeleteForEveryone(message: Message, currentUserId: string): boolean {
  return (
    message.senderId === currentUserId &&
    Date.now() - new Date(message.createdAt).getTime() < 60 * 60 * 1000
  );
}

interface MessageActionMenuProps {
  message: Message;
  currentUserId: string;
  visible: boolean;
  messageY: number;
  currentUserEmoji: string | null;
  onClose: () => void;
  onReact: (emoji: string) => void;
  onOpenEmojiPicker: () => void;
  onReply: () => void;
  onCopy: () => void;
  onForward: () => void;
  onEdit: () => void;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
  onDetails: () => void;
}

export function MessageActionMenu({
  message,
  currentUserId,
  visible,
  messageY,
  currentUserEmoji,
  onClose,
  onReact,
  onOpenEmojiPicker,
  onReply,
  onCopy,
  onForward,
  onEdit,
  onDeleteForMe,
  onDeleteForEveryone,
  onDetails,
}: MessageActionMenuProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const screenHeight = Dimensions.get('window').height;
  const isAbove = messageY > screenHeight / 2;
  const isMe = message.senderId === currentUserId;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  const canEditMsg = canEdit(message, currentUserId);
  const canDeleteForEveryoneMsg = canDeleteForEveryone(message, currentUserId);
  const canCopy = message.type === 'text' && message.content !== null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

      <Animated.View
        style={[
          styles.card,
          isMe ? styles.cardRight : styles.cardLeft,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
            ...(isAbove
              ? { bottom: screenHeight - messageY + 8 }
              : { top: messageY + 8 }),
          },
        ]}
      >
        {/* Emoji reaction row */}
        <View style={styles.emojiRow}>
          {QUICK_EMOJIS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={[styles.emojiBtn, currentUserEmoji === emoji && styles.emojiBtnActive]}
              onPress={() => onReact(emoji)}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.emojiBtn} onPress={onOpenEmojiPicker}>
            <Text style={styles.moreBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.actionRow} onPress={onReply}>
          <Text style={styles.actionLabel}>Reply</Text>
        </TouchableOpacity>

        {canCopy && (
          <TouchableOpacity style={styles.actionRow} onPress={onCopy}>
            <Text style={styles.actionLabel}>Copy</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.actionRow} onPress={onForward}>
          <Text style={styles.actionLabel}>Forward</Text>
        </TouchableOpacity>

        {canEditMsg && (
          <TouchableOpacity style={styles.actionRow} onPress={onEdit}>
            <Text style={styles.actionLabel}>Edit</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.actionRow} onPress={onDetails}>
          <Text style={styles.actionLabel}>Details</Text>
        </TouchableOpacity>

        {(isMe || canDeleteForEveryoneMsg) && <View style={styles.divider} />}

        {isMe && (
          <TouchableOpacity style={styles.actionRow} onPress={onDeleteForMe}>
            <Text style={[styles.actionLabel, styles.destructive]}>Delete for me</Text>
          </TouchableOpacity>
        )}

        {canDeleteForEveryoneMsg && (
          <TouchableOpacity style={styles.actionRow} onPress={onDeleteForEveryone}>
            <Text style={[styles.actionLabel, styles.destructive]}>Delete for everyone</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </Modal>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: {
    position: 'absolute',
    backgroundColor: colors.white,
    borderRadius: 12,
    minWidth: 200,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cardRight: {
    right: 16,
  },
  cardLeft: {
    left: 16,
  },
  // Emoji row
  emojiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  emojiBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    marginHorizontal: 1,
  },
  emojiBtnActive: {
    backgroundColor: colors.primary + '25',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  emojiText: {
    fontSize: 22,
  },
  moreBtnText: {
    fontSize: 18,
    color: colors.gray400,
    fontWeight: '600',
  },
  // Action rows
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray100,
    marginHorizontal: 12,
  },
  actionRow: {
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  actionLabel: {
    fontSize: 15,
    color: colors.dark,
  },
  destructive: {
    color: colors.red,
  },
  });
}
