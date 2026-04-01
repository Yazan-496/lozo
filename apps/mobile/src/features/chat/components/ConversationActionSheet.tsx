import { useState } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    Alert,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { contactsApi, chatApi } from '../../../shared/services/api';
import { useToast } from '../../../shared/components/Toast';
import { useConversationsStore } from '../../../shared/stores/conversations';
import { hideCachedConversation } from '../../../shared/db/conversations.db.ts';
import { useThemeColors } from '../../../shared/hooks/useThemeColors';
import type { ThemeColors } from '../../../shared/utils/theme';
import type { Conversation } from '../../../shared/types';

interface Props {
    visible: boolean;
    conversation: Conversation | null;
    contactId: string | undefined;
    isMuted: boolean;
    onClose: () => void;
}

export function ConversationActionSheet({
    visible,
    conversation,
    contactId,
    isMuted,
    onClose,
}: Props) {
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();
    const colors = useThemeColors();
    const styles = makeStyles(colors);

    if (!conversation) return null;
    const conv = conversation; // narrowed non-null for closures

    async function hideConversation(id: string) {
        useConversationsStore.getState().addHiddenConversation(id);
        void hideCachedConversation(id);
    }

    async function handleMuteToggle() {
        if (!contactId) return;
        setLoading(true);
        try {
            await contactsApi.toggleMute(contactId);
            showToast('success', isMuted ? 'Notifications unmuted' : 'Notifications muted');
        } catch {
            showToast('error', 'Failed to update mute');
        } finally {
            setLoading(false);
            onClose();
        }
    }

    function handleDeleteForMe() {
        Alert.alert('Delete conversation', 'This will delete the conversation only for you.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    onClose();
                    setLoading(true);
                    try {
                        await chatApi.deleteConversation(conv.id, 'me');
                        await hideConversation(conv.id);
                    } catch {
                        showToast('error', 'Failed to delete conversation');
                    } finally {
                        setLoading(false);
                    }
                },
            },
        ]);
    }

    function handleDeleteForEveryone() {
        Alert.alert(
            'Delete for everyone',
            'This will permanently delete the conversation for both you and the other person.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete for everyone',
                    style: 'destructive',
                    onPress: async () => {
                        onClose();
                        setLoading(true);
                        try {
                            await chatApi.deleteConversation(conv.id, 'everyone');
                            await hideConversation(conv.id);
                        } catch (err: any) {
                            showToast(
                                'error',
                                err.response?.data?.error || 'Failed to delete conversation',
                            );
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ],
        );
    }

    function handleBlock() {
        Alert.alert(
            `Block ${conv.otherUser.displayName}?`,
            'They will no longer be able to message you or send you requests.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Block',
                    style: 'destructive',
                    onPress: async () => {
                        onClose();
                        setLoading(true);
                        try {
                            await contactsApi.blockContact(conv.otherUser.id);
                            await hideConversation(conv.id);
                            showToast('success', 'User blocked');
                        } catch {
                            showToast('error', 'Failed to block user');
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ],
        );
    }

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
            <View style={[styles.sheet, { backgroundColor: colors.bg }]}>
                <View style={styles.handle} />

                <Text style={[styles.title, { color: colors.dark }]} numberOfLines={1}>
                    {conv.otherUser.displayName}
                </Text>

                {loading && (
                    <ActivityIndicator style={{ marginBottom: 12 }} color={colors.primary} />
                )}

                <TouchableOpacity
                    style={styles.row}
                    onPress={handleMuteToggle}
                    disabled={!contactId || loading}
                >
                    <Text style={[styles.rowText, { color: colors.dark }]}>
                        {isMuted ? 'Unmute notifications' : 'Mute notifications'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.row} onPress={handleDeleteForMe} disabled={loading}>
                    <Text style={[styles.rowText, { color: colors.dark }]}>Delete for me</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.row}
                    onPress={handleDeleteForEveryone}
                    disabled={loading}
                >
                    <Text style={[styles.rowText, styles.destructive]}>Delete for everyone</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.row} onPress={handleBlock} disabled={loading}>
                    <Text style={[styles.rowText, styles.destructive]}>Block user</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.row, styles.cancelRow]} onPress={onClose}>
                    <Text style={[styles.rowText, { color: colors.primary, fontWeight: '600' }]}>
                        Cancel
                    </Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

function makeStyles(colors: ThemeColors) {
    return StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
        },
        sheet: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingBottom: 32,
            paddingTop: 8,
        },
        handle: {
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.gray300,
            alignSelf: 'center',
            marginBottom: 12,
        },
        title: {
            fontSize: 16,
            fontWeight: '600',
            textAlign: 'center',
            paddingHorizontal: 20,
            paddingBottom: 12,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
        },
        row: {
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
        },
        rowText: {
            fontSize: 16,
            textAlign: 'center',
        },
        destructive: {
            color: '#F44336',
        },
        cancelRow: {
            marginTop: 8,
            borderBottomWidth: 0,
        },
    });
}
