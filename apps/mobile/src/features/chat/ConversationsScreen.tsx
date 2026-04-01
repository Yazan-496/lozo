import { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../shared/components/Avatar';
import { ConversationSkeleton } from '../../shared/components/ConversationSkeleton';
import { OfflineBanner } from '../../shared/components/OfflineBanner';
import { ConversationActionSheet } from './components/ConversationActionSheet';
import { SearchBar } from './components/SearchBar';
import { SearchResults } from './components/SearchResults';
import { api } from '../../shared/services/api';
import { getSocket } from '../../shared/services/socket';
import { searchMessages } from '../../shared/db/search.db.ts';
import { checkFtsHealth, rebuildFtsIndex } from '../../shared/db/fts-repair';
import { useAuthStore } from '../../shared/stores/auth';
import { usePresenceStore } from '../../shared/stores/presence';
import { useNotificationsStore } from '../../shared/stores/notifications';
import { useConversationsStore } from '../../shared/stores/conversations';
import { useNetworkStore } from '../../shared/stores/network';
import { useThemeColors } from '../../shared/hooks/useThemeColors';
import {
    getCachedConversations,
    syncConversations,
    hideCachedConversation,
    getAllDrafts,
} from '../../shared/db/conversations.db.ts';
import type { ThemeColors } from '../../shared/utils/theme';
import type { Conversation, SearchResult } from '../../shared/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface Props {
    navigation: NativeStackNavigationProp<any>;
}

function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
    const [contactNicknameMap, setContactNicknameMap] = useState<Record<string, string>>({});
    const [contactRelationshipMap, setContactRelationshipMap] = useState<
        Record<string, 'friend' | 'lover'>
    >({});
    const [contactIdMap, setContactIdMap] = useState<Record<string, string>>({});
    const [mutedMap, setMutedMap] = useState<Record<string, boolean>>({});
    const [refreshing, setRefreshing] = useState(false);
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [actionSheetConv, setActionSheetConv] = useState<Conversation | null>(null);
    const [drafts, setDrafts] = useState<Record<string, string>>({});
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

    const currentUser = useAuthStore((s) => s.user);
    const onlineUserIds = usePresenceStore((s) => s.onlineUserIds);
    const setTotalUnread = useNotificationsStore((s) => s.setTotalUnreadMessages);
    const hiddenConversationIds = useConversationsStore((s) => s.hiddenConversationIds);
    const isOnline = useNetworkStore((s) => s.isOnline);
    const colors = useThemeColors();
    const styles = useMemo(() => makeStyles(colors), [colors]);

    async function loadConversations() {
        // 1. Show cached data immediately
        try {
            const cached = await getCachedConversations();
            if (cached.length > 0) {
                setConversations(cached);
                if (isFirstLoad) setIsFirstLoad(false);
            }
        } catch {}

        if (!isOnline) {
            if (isFirstLoad) setIsFirstLoad(false);
            return;
        }

        try {
            const [conversationsRes, contactsRes] = await Promise.all([
                api.get<Conversation[]>('/chat/conversations'),
                api.get<any[]>('/contacts'),
            ]);

            const data = conversationsRes.data;
            setConversations(data);
            setTotalUnread(data.reduce((sum, c) => sum + c.unreadCount, 0));
            void syncConversations(data);

            const nicknameMap: Record<string, string> = {};
            const relationshipMap: Record<string, 'friend' | 'lover'> = {};
            const idMap: Record<string, string> = {};
            const muted: Record<string, boolean> = {};
            contactsRes.data.forEach((contact: any) => {
                nicknameMap[contact.user.id] = contact.nickname || contact.user.displayName;
                relationshipMap[contact.user.id] = contact.relationshipType;
                idMap[contact.user.id] = contact.contactId;
                muted[contact.user.id] = contact.isMuted;
            });
            setContactNicknameMap(nicknameMap);
            setContactRelationshipMap(relationshipMap);
            setContactIdMap(idMap);
            setMutedMap(muted);

            if (isFirstLoad) setIsFirstLoad(false);
        } catch (err) {
            console.error('Failed to load conversations:', err);
            if (isFirstLoad) setIsFirstLoad(false);
        }
    }

    useFocusEffect(
        useCallback(() => {
            loadConversations();
            // Reload drafts whenever screen comes into focus
            getAllDrafts()
                .then(setDrafts)
                .catch(() => {});
            // Close search on back-navigation
            setIsSearching(false);
            setSearchQuery('');
            setSearchResults([]);

            const socket = getSocket();
            if (!socket) return;

            function onNewMessage() {
                loadConversations();
            }

            function onMessageStatus(data: { conversationId: string; status: string }) {
                setConversations((prev) =>
                    prev.map((conv) =>
                        conv.id === data.conversationId && conv.lastMessage
                            ? {
                                  ...conv,
                                  lastMessage: { ...conv.lastMessage, status: data.status as any },
                              }
                            : conv,
                    ),
                );
            }

            function onConversationDeleted(data: { conversationId: string }) {
                useConversationsStore.getState().addHiddenConversation(data.conversationId);
                void hideCachedConversation(data.conversationId);
            }

            function onConnect() {
                loadConversations();
            }

            socket.on('message:new', onNewMessage);
            socket.on('messages:status', onMessageStatus);
            socket.on('conversation:deleted', onConversationDeleted);
            socket.on('connect', onConnect);
            return () => {
                socket.off('message:new', onNewMessage);
                socket.off('messages:status', onMessageStatus);
                socket.off('conversation:deleted', onConversationDeleted);
                socket.off('connect', onConnect);
            };
        }, [isOnline]),
    );

    async function onRefresh() {
        setRefreshing(true);
        await loadConversations();
        setRefreshing(false);
    }

    async function handleSearch(query: string) {
        setSearchQuery(query);
        if (query.trim().length < 3) {
            setSearchResults([]);
            return;
        }
        
        // Auto-check FTS health before searching
        const health = await checkFtsHealth();
        if (health.needsRebuild) {
            Alert.alert(
                'Search Index Needs Repair',
                `Found ${health.messagesCount} messages but FTS index is empty. Rebuild now?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Rebuild',
                        onPress: async () => {
                            try {
                                await rebuildFtsIndex();
                                Alert.alert('Success', 'Search index rebuilt successfully');
                                const results = await searchMessages(query);
                                setSearchResults(results);
                            } catch (err) {
                                Alert.alert('Error', 'Failed to rebuild search index');
                            }
                        },
                    },
                ],
            );
            return;
        }
        
        const results = await searchMessages(query);
        setSearchResults(results);
    }

    function handleSearchResultSelect(result: SearchResult) {
        setIsSearching(false);
        setSearchQuery('');
        setSearchResults([]);
        navigation.navigate('Chat', {
            conversationId: result.conversationId,
            highlightMessageId: result.messageId,
        });
    }

    function renderConversation({ item }: { item: Conversation }) {
        const { otherUser } = item;
        const displayName = contactNicknameMap[otherUser.id] || otherUser.displayName;
        const relationshipType = contactRelationshipMap[otherUser.id] || 'friend';

        return (
            <TouchableOpacity
                style={styles.conversationRow}
                activeOpacity={0.6}
                onPress={() =>
                    navigation.navigate('Chat', {
                        conversationId: item.id,
                        otherUser,
                        relationshipType,
                        contactId: contactIdMap[otherUser.id],
                        nickname: contactNicknameMap[otherUser.id] || undefined,
                    })
                }
                onLongPress={() => setActionSheetConv(item)}
            >
                <Avatar
                    uri={otherUser.avatarUrl}
                    name={displayName}
                    color={otherUser.avatarColor}
                    size={56}
                    isOnline={onlineUserIds.has(otherUser.id)}
                />
                <View style={styles.conversationInfo}>
                    <View style={styles.conversationTop}>
                        <Text style={styles.conversationName} numberOfLines={1}>
                            {displayName}
                        </Text>
                        {item.lastMessage && (
                            <Text style={styles.conversationTime}>
                                {formatTime(item.lastMessage.createdAt)}
                            </Text>
                        )}
                    </View>
                    <View style={styles.conversationBottom}>
                        {drafts[item.id] ? (
                            <Text
                                style={[styles.conversationPreview, styles.draftPreview]}
                                numberOfLines={1}
                            >
                                {'Draft: ' + drafts[item.id]}
                            </Text>
                        ) : (
                            <Text style={styles.conversationPreview} numberOfLines={1}>
                                {getLastMessagePreview(item)}
                            </Text>
                        )}
                        {item.lastMessage?.senderId === currentUser?.id &&
                        item.lastMessage?.status === 'read' ? (
                            <Avatar
                                uri={otherUser.avatarUrl}
                                name={otherUser.displayName}
                                color={otherUser.avatarColor}
                                size={14}
                            />
                        ) : item.unreadCount > 0 ? (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadText}>{item.unreadCount}</Text>
                            </View>
                        ) : null}
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    if (isFirstLoad && conversations.length === 0) {
        return isOnline ? (
            <ConversationSkeleton />
        ) : (
            <View style={styles.container}>
                <OfflineBanner />
                <View style={styles.offlineEmpty}>
                    <Text style={styles.offlineEmptyText}>
                        No conversations loaded yet.{'\n'}Connect to get started.
                    </Text>
                </View>
            </View>
        );
    }

    const filteredConversations = conversations.filter(
        (conv) => !hiddenConversationIds.has(conv.id),
    );

    return (
        <View style={styles.container}>
            <OfflineBanner />
            {isSearching ? (
                <>
                    <SearchBar
                        onSearch={handleSearch}
                        onClose={() => {
                            setIsSearching(false);
                            setSearchQuery('');
                            setSearchResults([]);
                        }}
                    />
                    <SearchResults
                        results={searchResults}
                        query={searchQuery}
                        onSelect={handleSearchResultSelect}
                    />
                </>
            ) : (
                <>
                    <TouchableOpacity
                        style={styles.searchRow}
                        onPress={() => setIsSearching(true)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="search"
                            size={16}
                            color={colors.gray400}
                            style={{ marginRight: 8 }}
                        />
                        <Text style={[styles.searchPlaceholder, { color: colors.gray400 }]}>
                            Search messages...
                        </Text>
                    </TouchableOpacity>
                    <FlatList
                        data={filteredConversations}
                        keyExtractor={(item) => item.id}
                        renderItem={renderConversation}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                        ListEmptyComponent={
                            !isOnline ? (
                                <View style={styles.offlineEmpty}>
                                    <Text style={styles.offlineEmptyText}>
                                        You're offline. Connect to load your conversations.
                                    </Text>
                                </View>
                            ) : (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyTitle}>No conversations yet</Text>
                                    <Text style={styles.emptySubtitle}>
                                        Add contacts to start chatting
                                    </Text>
                                </View>
                            )
                        }
                    />
                </>
            )}
            <ConversationActionSheet
                visible={!!actionSheetConv}
                conversation={actionSheetConv}
                contactId={actionSheetConv ? contactIdMap[actionSheetConv.otherUser.id] : undefined}
                isMuted={
                    actionSheetConv ? (mutedMap[actionSheetConv.otherUser.id] ?? false) : false
                }
                onClose={() => setActionSheetConv(null)}
            />
        </View>
    );
}

function makeStyles(colors: ThemeColors) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        conversationRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
        },
        conversationInfo: { flex: 1, marginLeft: 12 },
        conversationTop: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        conversationName: { fontSize: 16, fontWeight: '600', color: colors.dark, flex: 1 },
        conversationTime: { fontSize: 12, color: colors.gray400, marginLeft: 8 },
        conversationBottom: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 4,
        },
        conversationPreview: { fontSize: 14, color: colors.gray400, flex: 1, marginRight: 8 },
        draftPreview: { color: '#E74C3C', fontStyle: 'italic' },
        searchRow: {
            flexDirection: 'row',
            alignItems: 'center',
            margin: 10,
            marginBottom: 4,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: colors.gray100,
        },
        searchPlaceholder: {
            fontSize: 14,
        },
        unreadBadge: {
            backgroundColor: colors.primary,
            borderRadius: 10,
            minWidth: 20,
            height: 20,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 6,
        },
        unreadText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
        emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
        emptyTitle: { color: colors.gray400, fontSize: 16 },
        emptySubtitle: { color: colors.gray300, fontSize: 14, marginTop: 4 },
        offlineEmpty: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 80,
            paddingHorizontal: 32,
        },
        offlineEmptyText: {
            color: colors.gray400,
            fontSize: 15,
            textAlign: 'center',
            lineHeight: 22,
        },
    });
}
