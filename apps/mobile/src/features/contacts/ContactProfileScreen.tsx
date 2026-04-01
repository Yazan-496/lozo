import { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Avatar } from '../../shared/components/Avatar';
import { useToast } from '../../shared/components/Toast';
import { contactsApi, chatApi } from '../../shared/services/api';
import { usePresenceStore } from '../../shared/stores/presence';
import { useConversationsStore } from '../../shared/stores/conversations';
import { useThemeColors } from '../../shared/hooks/useThemeColors';
import type { ThemeColors } from '../../shared/utils/theme';
import { getPresenceString } from '../../shared/utils/presence';
import type { RootStackParamList, Contact } from '../../shared/types';

interface Props {
    navigation: NativeStackNavigationProp<any>;
    route: RouteProp<RootStackParamList, 'ContactProfile'>;
}

export function ContactProfileScreen({ route, navigation }: any) {
    const { contactId, otherUser, relationshipType: initialRelationshipType } = route.params;
    const [contact, setContact] = useState<Contact | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [relationshipType, setRelationshipType] = useState<'friend' | 'lover'>(
        initialRelationshipType || 'friend',
    );
    // Nickname modal state
    const [nicknameModal, setNicknameModal] = useState<{
        visible: boolean;
        field: 'nickname' | 'myNickname';
        value: string;
    }>({ visible: false, field: 'nickname', value: '' });
    const { showToast } = useToast();
    const onlineUserIds = usePresenceStore((s) => s.onlineUserIds);
    const lastSeenMap = usePresenceStore((s) => s.lastSeenMap);
    const colors = useThemeColors();
    const styles = useMemo(() => makeStyles(colors), [colors]);

    async function loadContact() {
        try {
            setLoading(true);
            const { data } = await contactsApi.getContacts();
            const found = data.find((c: Contact) => c.contactId === contactId);
            if (found) {
                setContact(found);
                setRelationshipType(found.relationshipType);
            }
        } catch (err) {
            console.error('Failed to load contact:', err);
        } finally {
            setLoading(false);
        }
    }

    useFocusEffect(
        useCallback(() => {
            loadContact();
        }, [contactId]),
    );

    const handleSaveNickname = async (newNickname: string | null) => {
        if (!contact) return;
        try {
            setSaving(true);
            await contactsApi.setNickname(contactId, newNickname || null);
            setContact({
                ...contact,
                nickname: newNickname || null,
            });
            showToast('success', 'Nickname updated');
        } catch (err: any) {
            showToast('error', err.response?.data?.error || 'Failed to update nickname');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveMyNickname = async (newMyNickname: string | null) => {
        if (!contact) return;
        try {
            setSaving(true);
            await contactsApi.setMyNickname(contactId, newMyNickname || null);
            setContact({
                ...contact,
                myNickname: newMyNickname || null,
            });
            showToast('success', 'My nickname updated');
        } catch (err: any) {
            showToast('error', err.response?.data?.error || 'Failed to update my nickname');
        } finally {
            setSaving(false);
        }
    };

    const handleSetRelationshipType = async (type: 'friend' | 'lover') => {
        try {
            setSaving(true);
            await contactsApi.setRelationshipType(contactId, type);
            setRelationshipType(type);
            showToast('success', `Relationship updated to ${type}`);
        } catch (err: any) {
            showToast('error', err.response?.data?.error || 'Failed to update relationship');
        } finally {
            setSaving(false);
        }
    };

    const handleOpenChat = async () => {
        try {
            // Get or create conversation with this contact
            const { data: conv } = await chatApi.getOrCreateConversation(otherUser.id);

            navigation.navigate('Chat', {
                conversationId: conv.id,
                otherUser,
                relationshipType,
                contactId,
                nickname: contact?.nickname || undefined,
            });
        } catch (err: any) {
            showToast('error', err.response?.data?.error || 'Failed to open chat');
        }
    };

    const handleRemoveContact = () => {
        Alert.alert('Remove contact', 'Are you sure?', [
            { text: 'Cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: async () => {
                    try {
                        setSaving(true);
                        await contactsApi.removeContact(contactId);
                        showToast('success', 'Contact removed');
                        navigation.goBack();
                    } catch (err: any) {
                        showToast('error', err.response?.data?.error || 'Failed to remove contact');
                    } finally {
                        setSaving(false);
                    }
                },
            },
        ]);
    };

    const handleBlockContact = () => {
        Alert.alert(
            `Block ${otherUser.displayName}?`,
            "They won't be able to message you or send contact requests.",
            [
                { text: 'Cancel' },
                {
                    text: 'Block',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setSaving(true);
                            await contactsApi.blockContact(otherUser.id);
                            showToast('success', 'Contact blocked');
                            navigation.goBack();
                        } catch (err: any) {
                            showToast(
                                'error',
                                err.response?.data?.error || 'Failed to block contact',
                            );
                        } finally {
                            setSaving(false);
                        }
                    },
                },
            ],
        );
    };

    const handleDeleteConversationForMe = () => {
        if (!route.params.conversationId) {
            showToast('error', 'Conversation not found');
            return;
        }

        Alert.alert(
            'Delete conversation for me',
            "This clears your message history only. They won't be affected.",
            [
                { text: 'Cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setSaving(true);
                            await chatApi.deleteConversation(route.params.conversationId!, 'me');
                            useConversationsStore
                                .getState()
                                .addHiddenConversation(route.params.conversationId!);
                            showToast('success', 'Conversation deleted');
                        } catch (err: any) {
                            showToast(
                                'error',
                                err.response?.data?.error || 'Failed to delete conversation',
                            );
                        } finally {
                            setSaving(false);
                        }
                    },
                },
            ],
        );
    };

    const handleDeleteConversationForEveryone = () => {
        if (!route.params.conversationId) {
            showToast('error', 'Conversation not found');
            return;
        }

        Alert.alert(
            'Delete conversation for everyone',
            'This permanently deletes the conversation for both you and them. This cannot be undone.',
            [
                { text: 'Cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setSaving(true);
                            await chatApi.deleteConversation(
                                route.params.conversationId!,
                                'everyone',
                            );
                            useConversationsStore
                                .getState()
                                .addHiddenConversation(route.params.conversationId!);
                            showToast('success', 'Conversation deleted for everyone');
                        } catch (err: any) {
                            showToast(
                                'error',
                                err.response?.data?.error || 'Failed to delete conversation',
                            );
                        } finally {
                            setSaving(false);
                        }
                    },
                },
            ],
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!contact) {
        return (
            <View style={[styles.container, { justifyContent: 'center' }]}>
                <Text style={styles.errorText}>Contact not found</Text>
            </View>
        );
    }

    const profileUser = contact?.user ?? otherUser;
    const isOnline = onlineUserIds.has(profileUser.id);
    const lastSeenAt = lastSeenMap[profileUser.id] ?? profileUser.lastSeenAt;
    const presenceText = getPresenceString(isOnline, lastSeenAt);
    // nickname = what current user calls this contact; myNickname = current user's alias for themselves
    const displayName = contact.nickname || profileUser.displayName;
    const relationshipEmoji = relationshipType === 'friend' ? '💙' : '❤️';

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header Section */}
            <View style={styles.headerSection}>
                <Avatar
                    uri={profileUser.avatarUrl}
                    name={displayName}
                    color={profileUser.avatarColor}
                    size={80}
                    isOnline={isOnline}
                />
                <Text style={styles.displayName}>{displayName}</Text>
                <Text style={styles.username}>@{profileUser.username}</Text>
                <View style={styles.presenceRow}>
                    <View
                        style={[
                            styles.onlineDot,
                            { backgroundColor: isOnline ? colors.primary : colors.gray400 },
                        ]}
                    />
                    <Text style={styles.presenceText}>{presenceText}</Text>
                </View>

                {/* Relationship Badge */}
                <TouchableOpacity
                    style={[styles.relationshipBadge, { backgroundColor: colors.bgSecondary }]}
                    onPress={() => {
                        Alert.alert('Relationship Type', '', [
                            {
                                text: '💙 Friend',
                                onPress: () => handleSetRelationshipType('friend'),
                            },
                            {
                                text: '❤️ Lover',
                                onPress: () => handleSetRelationshipType('lover'),
                            },
                            { text: 'Cancel' },
                        ]);
                    }}
                    disabled={saving}
                >
                    <Text style={styles.relationshipText}>
                        {relationshipEmoji}{' '}
                        {relationshipType.charAt(0).toUpperCase() + relationshipType.slice(1)}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Nicknames Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Nicknames</Text>

                <TouchableOpacity
                    style={styles.row}
                    onPress={() =>
                        setNicknameModal({
                            visible: true,
                            field: 'nickname',
                            value: contact.nickname || '',
                        })
                    }
                    disabled={saving}
                >
                    <View style={styles.rowContent}>
                        <Text style={styles.rowLabel}>Contact's nickname</Text>
                        <Text style={styles.rowValue}>{contact.nickname || 'Add nickname'}</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.row}
                    onPress={() =>
                        setNicknameModal({
                            visible: true,
                            field: 'myNickname',
                            value: contact.myNickname || '',
                        })
                    }
                    disabled={saving}
                >
                    <View style={styles.rowContent}>
                        <Text style={styles.rowLabel}>My nickname</Text>
                        <Text style={styles.rowValue}>{contact.myNickname || 'Add nickname'}</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Actions Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Actions</Text>

                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={handleOpenChat}
                    disabled={saving}
                >
                    <Text style={styles.actionButtonText}>Open Chat</Text>
                </TouchableOpacity>

                {route.params.conversationId && (
                    <>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.gray200 }]}
                            onPress={handleDeleteConversationForMe}
                            disabled={saving}
                        >
                            <Text style={[styles.actionButtonText, { color: colors.dark }]}>
                                Delete conversation for me
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.gray200 }]}
                            onPress={handleDeleteConversationForEveryone}
                            disabled={saving}
                        >
                            <Text style={[styles.actionButtonText, { color: colors.dark }]}>
                                Delete conversation for everyone
                            </Text>
                        </TouchableOpacity>
                    </>
                )}

                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.gray200 }]}
                    onPress={handleRemoveContact}
                    disabled={saving}
                >
                    <Text style={[styles.actionButtonText, { color: colors.dark }]}>
                        Remove contact
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.red }]}
                    onPress={handleBlockContact}
                    disabled={saving}
                >
                    <Text style={styles.actionButtonText}>Block</Text>
                </TouchableOpacity>
            </View>
            {/* Nickname edit modal — cross-platform replacement for Alert.prompt */}
            <Modal
                visible={nicknameModal.visible}
                transparent
                animationType="fade"
                onRequestClose={() => setNicknameModal((s) => ({ ...s, visible: false }))}
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={[styles.modalBox, { backgroundColor: colors.bg }]}>
                        <Text style={[styles.modalTitle, { color: colors.dark }]}>
                            {nicknameModal.field === 'nickname'
                                ? 'Set nickname'
                                : 'Set my nickname'}
                        </Text>
                        <Text style={[styles.modalSubtitle, { color: colors.gray500 }]}>
                            {nicknameModal.field === 'nickname'
                                ? 'What do you call them?'
                                : 'What do you want them to call you?'}
                        </Text>
                        <TextInput
                            style={[
                                styles.modalInput,
                                {
                                    color: colors.dark,
                                    borderColor: colors.border,
                                    backgroundColor: colors.bgSecondary,
                                },
                            ]}
                            value={nicknameModal.value}
                            onChangeText={(text) =>
                                setNicknameModal((s) => ({ ...s, value: text }))
                            }
                            autoFocus
                            placeholder="Enter nickname..."
                            placeholderTextColor={colors.gray400}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancel}
                                onPress={() => setNicknameModal((s) => ({ ...s, visible: false }))}
                            >
                                <Text style={[styles.modalCancelText, { color: colors.gray500 }]}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalSave, { backgroundColor: colors.primary }]}
                                onPress={() => {
                                    const val = nicknameModal.value.trim() || null;
                                    setNicknameModal((s) => ({ ...s, visible: false }));
                                    if (nicknameModal.field === 'nickname') {
                                        handleSaveNickname(val);
                                    } else {
                                        handleSaveMyNickname(val);
                                    }
                                }}
                            >
                                <Text style={styles.modalSaveText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </ScrollView>
    );
}

function makeStyles(colors: ThemeColors) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.bg,
        },
        errorText: {
            fontSize: 16,
            color: colors.gray500,
            textAlign: 'center',
        },
        headerSection: {
            alignItems: 'center',
            paddingVertical: 24,
            paddingHorizontal: 16,
            borderBottomWidth: 0.5,
            borderBottomColor: colors.border,
        },
        displayName: {
            fontSize: 22,
            fontWeight: '700',
            color: colors.dark,
            marginTop: 16,
        },
        username: {
            fontSize: 14,
            color: colors.gray500,
            marginTop: 4,
        },
        presenceRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 8,
        },
        onlineDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            marginRight: 6,
        },
        presenceText: {
            fontSize: 14,
            color: colors.gray500,
        },
        relationshipBadge: {
            marginTop: 12,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
        },
        relationshipText: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.dark,
        },
        section: {
            paddingHorizontal: 16,
            paddingVertical: 16,
            borderBottomWidth: 0.5,
            borderBottomColor: colors.border,
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.dark,
            marginBottom: 12,
        },
        row: {
            paddingVertical: 12,
            borderBottomWidth: 0.5,
            borderBottomColor: colors.border,
        },
        rowContent: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        rowLabel: {
            fontSize: 14,
            color: colors.dark,
        },
        rowValue: {
            fontSize: 14,
            color: colors.primary,
        },
        actionButton: {
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 8,
            alignItems: 'center',
            marginBottom: 8,
        },
        actionButtonText: {
            fontSize: 16,
            fontWeight: '600',
            color: '#FFFFFF',
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            paddingHorizontal: 32,
        },
        modalBox: {
            borderRadius: 12,
            padding: 20,
        },
        modalTitle: {
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 4,
        },
        modalSubtitle: {
            fontSize: 14,
            marginBottom: 16,
        },
        modalInput: {
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 16,
            marginBottom: 16,
        },
        modalActions: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            gap: 12,
        },
        modalCancel: {
            paddingVertical: 8,
            paddingHorizontal: 16,
        },
        modalCancelText: {
            fontSize: 15,
            fontWeight: '500',
        },
        modalSave: {
            paddingVertical: 8,
            paddingHorizontal: 20,
            borderRadius: 8,
        },
        modalSaveText: {
            fontSize: 15,
            fontWeight: '600',
            color: '#FFFFFF',
        },
    });
}
