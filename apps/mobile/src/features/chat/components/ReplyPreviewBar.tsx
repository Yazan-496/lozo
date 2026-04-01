import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeColors } from '../../../shared/hooks/useThemeColors';
import type { ThemeColors } from '../../../shared/utils/theme';
import type { Message } from '../../../shared/types';

interface ReplyPreviewBarProps {
  replyingTo: Message;
  senderName: string;
  onCancel: () => void;
}

export function ReplyPreviewBar({ replyingTo, senderName, onCancel }: ReplyPreviewBarProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const preview = replyingTo.deletedForEveryone
    ? 'Message deleted'
    : (replyingTo.content ?? '').slice(0, 50) + ((replyingTo.content?.length ?? 0) > 50 ? '…' : '');

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.senderName}>{senderName}</Text>
        <Text style={styles.contentText} numberOfLines={1}>{preview}</Text>
      </View>
      <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
        <Text style={styles.closeIcon}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 52,
      backgroundColor: colors.bg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: 12,
    },
    content: {
      flex: 1,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      paddingLeft: 8,
    },
    senderName: { fontSize: 12, fontWeight: '600', color: colors.dark, marginBottom: 2 },
    contentText: { fontSize: 12, color: colors.gray500 },
    closeButton: { marginLeft: 8, padding: 4 },
    closeIcon: { fontSize: 24, color: colors.gray400 },
  });
}
