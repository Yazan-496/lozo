import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useToast } from '../../../shared/components/Toast';
import { contactsApi, chatApi } from '../../../shared/services/api';
import { searchMessages } from '../../../shared/db/search.db.ts';
import { usePresenceStore } from '../../../shared/stores/presence';
import { useConversationsStore } from '../../../shared/stores/conversations';
import { getPresenceString } from '../../../shared/utils/presence';
import type { RootStackParamList, Contact, SearchResult } from '../../../shared/types';

interface UseContactProfileOptions {
    route: RouteProp<RootStackParamList, 'ContactProfile'>;
    navigation: NativeStackNavigationProp<any>;
}

export function useContactProfile({ route, navigation }: UseContactProfileOptions) {
    const { contactId, otherUser, relationshipType: initialRelationshipType } = route.params;

    const [contact, setContact] = useState<Contact | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [relationshipType, setRelationshipType] = useState<'friend' | 'lover'>(
        initialRelationshipType || 'friend',
    );
    const [nicknameModal, setNicknameModal] = useState<{
        visible: boolean;
        field: 'nickname' | 'myNickname';
        value: string;
    }>({ visible: false, field: 'nickname', value: '' });
    const [resolvedConversationId, setResolvedConversationId] = useState<string | null>(
        route.params.conversationId ?? null,
    );
    const [chatSearchVisible, setChatSearchVisible] = useState(false);
    const [chatSearchQuery, setChatSearchQuery] = useState('');
    const [chatSearchResults, setChatSearchResults] = useState<SearchResult[]>([]);
    const [searchingChat, setSearchingChat] = useState(false);

    const { showToast } = useToast();
    const onlineUserIds = usePresenceStore((s) => s.onlineUserIds);
    const lastSeenMap = usePresenceStore((s) => s.lastSeenMap);

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

    async function ensureConversationId(): Promise<string | null> {
        if (resolvedConversationId) return resolvedConversationId;
        if (route.params.conversationId) {
            setResolvedConversationId(route.params.conversationId);
            return route.params.conversationId;
        }
        try {
            const { data: conv } = await chatApi.getOrCreateConversation(otherUser.id);
            setResolvedConversationId(conv.id);
            return conv.id;
        } catch (err: any) {
            showToast('error', err.response?.data?.error || 'Failed to open conversation');
            return null;
        }
    }

    const handleSaveNickname = async (newNickname: string | null) => {
        if (!contact) return;
        try {
            setSaving(true);
            await contactsApi.setNickname(contactId, newNickname || null);
            setContact({ ...contact, nickname: newNickname || null });
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
            setContact({ ...contact, myNickname: newMyNickname || null });
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
        const conversationId = await ensureConversationId();
        if (!conversationId) return;
        navigation.navigate('Chat', {
            conversationId,
            otherUser,
            relationshipType,
            contactId,
            nickname: contact?.nickname || undefined,
        });
    };

    const handleOpenMediaGallery = async () => {
        const conversationId = await ensureConversationId();
        if (!conversationId) return;
        navigation.navigate('MediaGallery', {
            conversationId,
            conversationName: contact?.nickname || otherUser.displayName,
        });
    };

    const handleOpenChatSearch = async () => {
        const conversationId = await ensureConversationId();
        if (!conversationId) return;
        setChatSearchVisible(true);
        setChatSearchQuery('');
        setChatSearchResults([]);
    };

    async function handleSearchInChat(query: string) {
        setChatSearchQuery(query);
        if (query.trim().length < 3) {
            setChatSearchResults([]);
            return;
        }
        const conversationId = await ensureConversationId();
        if (!conversationId) return;
        setSearchingChat(true);
        try {
            const results = await searchMessages(query);
            setChatSearchResults(results.filter((r) => r.conversationId === conversationId));
        } finally {
            setSearchingChat(false);
        }
    }

    function handleChatSearchSelect(result: SearchResult) {
        setChatSearchVisible(false);
        setChatSearchQuery('');
        setChatSearchResults([]);
        navigation.navigate('Chat', {
            conversationId: result.conversationId,
            otherUser,
            relationshipType,
            contactId,
            nickname: contact?.nickname || undefined,
            highlightMessageId: result.messageId,
        });
    }

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

    const handleDeleteConversationForMe = async () => {
        const conversationId = await ensureConversationId();
        if (!conversationId) return;
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
                            await chatApi.deleteConversation(conversationId, 'me');
                            useConversationsStore.getState().addHiddenConversation(conversationId);
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

    const handleDeleteConversationForEveryone = async () => {
        const conversationId = await ensureConversationId();
        if (!conversationId) return;
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
                            await chatApi.deleteConversation(conversationId, 'everyone');
                            useConversationsStore.getState().addHiddenConversation(conversationId);
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

    // Computed display values
    const profileUser = contact?.user ?? otherUser;
    const isOnline = onlineUserIds.has(profileUser.id);
    const lastSeenAt = lastSeenMap[profileUser.id] ?? profileUser.lastSeenAt;
    const presenceText = getPresenceString(isOnline, lastSeenAt);
    const displayName = contact?.nickname || profileUser.displayName;
    const relationshipEmoji = relationshipType === 'friend' ? '' : '';

    return {
        // State
        contact,
        loading,
        saving,
        relationshipType,
        nicknameModal,
        setNicknameModal,
        chatSearchVisible,
        setChatSearchVisible,
        chatSearchQuery,
        setChatSearchQuery,
        chatSearchResults,
        searchingChat,
        // Computed
        profileUser,
        isOnline,
        presenceText,
        displayName,
        relationshipEmoji,
        // Handlers
        handleSaveNickname,
        handleSaveMyNickname,
        handleSetRelationshipType,
        handleOpenChat,
        handleOpenMediaGallery,
        handleOpenChatSearch,
        handleSearchInChat,
        handleChatSearchSelect,
        handleRemoveContact,
        handleBlockContact,
        handleDeleteConversationForMe,
        handleDeleteConversationForEveryone,
    };
}
