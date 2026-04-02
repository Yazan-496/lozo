import { useState, useRef, useEffect, useCallback } from 'react';
import { FlatList, Alert, Animated } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useToast } from '../../../shared/components/Toast';
import { api } from '../../../shared/services/api';
import { getSocket } from '../../../shared/services/socket';
import {
    retry as outboxRetry,
    discard as outboxDiscard,
    setOnMessageSynced,
} from '../../../shared/services/outbox';
import {
    getMessages as getDbMessages,
    insertMessage,
    upsertServerMessage,
    deleteMessage,
    localRowToMessage,
    updateMessageStatus,
    type LocalMessageRow,
} from '../../../shared/db/messages.db.ts';
import { enqueueOutbox } from '../../../shared/db/outbox.db.ts';
import { saveDraft, getDraft, clearDraft } from '../../../shared/db/conversations.db.ts';
import { searchInConversation } from '../../../shared/db/search.db.ts';
import { getCachedPreview, savePreview } from '../../../shared/db/link-previews.db.ts';
import type { Message, User, LinkPreview, SearchResult } from '../../../shared/types';

const URL_REGEX =
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/;

interface UseChatMessagesOptions {
    conversationId: string;
    chatUser: User | undefined;
    currentUser: User;
    isOnline: boolean;
    onConversationDeleted: () => void;
    initialHighlightId?: string;
    scheduledMessages?: any[]; // Optional scheduled messages to merge
}

export function useChatMessages({
    conversationId,
    chatUser,
    currentUser,
    isOnline,
    onConversationDeleted,
    initialHighlightId,
    scheduledMessages = [],
}: UseChatMessagesOptions) {
    const { showToast } = useToast();

    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [hasMoreOlder, setHasMoreOlder] = useState(true);
    const [localStatusMap, setLocalStatusMap] = useState<
        Record<string, 'pending' | 'sending' | 'failed'>
    >({});
    const [inputLinkPreview, setInputLinkPreview] = useState<LinkPreview | null>(null);
    const [previewDismissed, setPreviewDismissed] = useState(false);
    const [previewCache, setPreviewCache] = useState<Record<string, LinkPreview | null>>({});
    const [isSearchingInChat, setIsSearchingInChat] = useState(false);
    const [chatSearchQuery, setChatSearchQuery] = useState('');
    const [chatSearchResults, setChatSearchResults] = useState<SearchResult[]>([]);
    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(
        initialHighlightId ?? null,
    );
    const highlightAnim = useRef(new Animated.Value(0)).current;

    const flatListRef = useRef<FlatList>(null);
    const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingTimers = useRef<Record<string, ReturnType<typeof setTimeout>[]>>({});
    const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const previewDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fetchingUrlsRef = useRef<Set<string>>(new Set());
    const lastDetectedUrlRef = useRef<string | null>(null);
    const chatSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    async function fetchLinkPreview(url: string): Promise<LinkPreview | null> {
        const cached = await getCachedPreview(url);
        if (cached) return cached;
        try {
            const { data } = await api.get<LinkPreview>(
                `/link-preview?url=${encodeURIComponent(url)}`,
            );
            if (data.title || data.description || data.image) {
                await savePreview(data);
            }
            return data;
        } catch {
            return null;
        }
    }

    // Scan newly loaded messages for URLs and populate preview cache
    useEffect(() => {
        for (const msg of messages) {
            if (msg.type !== 'text' || !msg.content) continue;
            const match = msg.content.match(URL_REGEX);
            if (!match) continue;
            const url = match[0];
            if (url in previewCache || fetchingUrlsRef.current.has(url)) continue;
            fetchingUrlsRef.current.add(url);
            fetchLinkPreview(url).then((preview) => {
                fetchingUrlsRef.current.delete(url);
                setPreviewCache((prev) => ({ ...prev, [url]: preview }));
            });
        }
    }, [messages]);

    async function loadMessages() {
        try {
            const cached = await getDbMessages(conversationId, 50);
            if (cached.length > 0) {
                setMessages(cached.map(localRowToMessage));
                if (isFirstLoad) setIsFirstLoad(false);
            }
        } catch (err) {
            console.error('SQLite load failed:', err);
        }

        if (!isOnline) {
            if (isFirstLoad) setIsFirstLoad(false);
            return;
        }
        try {
            const { data } = await api.get<Message[]>(
                `/chat/conversations/${conversationId}/messages`,
            );
            setMessages(
                data.sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                ),
            );
            for (const msg of data) {
                void upsertServerMessage(msg, currentUser.id);
            }
            if (isFirstLoad) setIsFirstLoad(false);
        } catch {
            if (isFirstLoad) setIsFirstLoad(false);
        }
    }

    // Scroll to and highlight a message from search navigation
    useEffect(() => {
        if (!highlightedMessageId || messages.length === 0) return;
        const idx = messages.findIndex(
            (m) => m.id === highlightedMessageId || m.localId === highlightedMessageId,
        );
        if (idx === -1) return;
        const t = setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
            highlightAnim.setValue(1);
            Animated.timing(highlightAnim, {
                toValue: 0,
                duration: 1500,
                useNativeDriver: false,
            }).start(() => setHighlightedMessageId(null));
        }, 300);
        return () => clearTimeout(t);
    }, [highlightedMessageId, messages.length]);

    // Register outbox sync callback
    useEffect(() => {
        setOnMessageSynced((localId, serverId) => {
            setMessages((prev) =>
                prev.map((m) =>
                    m.localId === localId || m.id === localId
                        ? { ...m, id: serverId, syncStatus: 'sent', status: null }
                        : m,
                ),
            );
            setLocalStatusMap((prev) => {
                const n = { ...prev };
                delete n[localId];
                return n;
            });
        });
        return () => setOnMessageSynced(null);
    }, []);

    // Socket events + initial load
    useEffect(() => {
        loadMessages();
        api.post(`/chat/conversations/${conversationId}/read`).catch(() => {});

        getDraft(conversationId).then((draft) => {
            if (draft) setText(draft);
        });

        const socket = getSocket();
        if (!socket || !chatUser) return;

        socket.emit('messages:read', { conversationId, senderId: chatUser.id });

        function onNewMessage(data: { message: Message; conversationId: string }) {
            if (data.conversationId === conversationId) {
                void upsertServerMessage(data.message, currentUser.id);
                setMessages((prev) => [
                    {
                        ...data.message,
                        reactions: data.message.reactions ?? [],
                        replyTo: data.message.replyTo ?? null,
                    },
                    ...prev,
                ]);
                api.post(`/chat/conversations/${conversationId}/read`).catch(() => {});
                socket?.emit('messages:read', { conversationId, senderId: chatUser.id });
            }
        }

        function onMessageEdited(data: { message: Message; conversationId: string }) {
            if (data.conversationId === conversationId) {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === data.message.id
                            ? { ...m, ...data.message, reactions: data.message.reactions ?? m.reactions }
                            : m,
                    ),
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
                            if (idx >= 0)
                                reactions[idx] = { emoji: data.emoji, userId: data.userId };
                            else reactions.push({ emoji: data.emoji, userId: data.userId });
                        }
                        return { ...m, reactions };
                    }),
                );
            }
        }

        function onTypingStart(data: { userId: string; conversationId: string }) {
            if (data.conversationId === conversationId && data.userId === chatUser.id)
                setIsTyping(true);
        }

        function onTypingStop(data: { userId: string; conversationId: string }) {
            if (data.conversationId === conversationId && data.userId === chatUser.id)
                setIsTyping(false);
        }

        function onMessageStatus(data: { conversationId: string; status: string; userId: string }) {
            if (data.conversationId === conversationId) {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.senderId === currentUser.id ? { ...m, status: data.status as any } : m,
                    ),
                );
            }
        }

        function onConversationDeletedEvt(data: { conversationId: string }) {
            if (data.conversationId === conversationId) {
                onConversationDeleted();
            }
        }

        socket.on('message:new', onNewMessage);
        socket.on('message:edited', onMessageEdited);
        socket.on('message:deleted', onMessageDeleted);
        socket.on('message:reaction', onReaction);
        socket.on('typing:start', onTypingStart);
        socket.on('typing:stop', onTypingStop);
        socket.on('messages:status', onMessageStatus);
        socket.on('conversation:deleted', onConversationDeletedEvt);

        return () => {
            socket.off('message:new', onNewMessage);
            socket.off('message:edited', onMessageEdited);
            socket.off('message:deleted', onMessageDeleted);
            socket.off('message:reaction', onReaction);
            socket.off('typing:start', onTypingStart);
            socket.off('typing:stop', onTypingStop);
            socket.off('messages:status', onMessageStatus);
            socket.off('conversation:deleted', onConversationDeletedEvt);
            if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
        };
    }, [conversationId, chatUser?.id]);

    async function loadOlderMessages() {
        if (loadingOlder || !hasMoreOlder) return;
        if (messages.length === 0) return;

        const oldest = messages[messages.length - 1].createdAt;
        try {
            setLoadingOlder(true);
            const rows = await getDbMessages(conversationId, 50, oldest);
            const mapped = rows.map(localRowToMessage);

            if (mapped.length > 0) {
                const existingIds = new Set(messages.map((m) => m.id));
                const newOnes = mapped.filter((m) => !existingIds.has(m.id));
                if (newOnes.length > 0) {
                    setMessages((prev) => [...prev, ...newOnes]);
                } else {
                    setHasMoreOlder(false);
                }
                return;
            }

            if (!isOnline) return;

            const { data } = await api.get<Message[]>(
                `/chat/conversations/${conversationId}/messages?cursor=${encodeURIComponent(messages[messages.length - 1].id)}&limit=50`,
            );

            if (data.length === 0) {
                setHasMoreOlder(false);
                return;
            }

            for (const msg of data) {
                void upsertServerMessage(msg, currentUser.id);
            }

            const existingIds = new Set(messages.map((m) => m.id));
            const newFromServer = data.filter((m) => !existingIds.has(m.id));
            if (newFromServer.length > 0) {
                setMessages((prev) => [...prev, ...newFromServer]);
            } else {
                setHasMoreOlder(false);
            }
        } catch (err) {
            console.error('Failed to load older messages:', err);
        } finally {
            setLoadingOlder(false);
        }
    }

    function handleTyping() {
        const socket = getSocket();
        if (!socket || !chatUser) return;
        socket.emit('typing:start', { conversationId, recipientId: chatUser.id });
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => {
            socket.emit('typing:stop', { conversationId, recipientId: chatUser.id });
        }, 2000);
    }

    function startPendingTimers(tempId: string) {
        const t1 = setTimeout(() => {
            setLocalStatusMap((prev) =>
                prev[tempId] === 'pending' ? { ...prev, [tempId]: 'sending' } : prev,
            );
        }, 2000);
        const t2 = setTimeout(() => {
            setLocalStatusMap((prev) => (prev[tempId] ? { ...prev, [tempId]: 'failed' } : prev));
        }, 20000);
        pendingTimers.current[tempId] = [t1, t2];
    }

    function clearPendingTimers(tempId: string) {
        pendingTimers.current[tempId]?.forEach(clearTimeout);
        delete pendingTimers.current[tempId];
    }

    async function updateSentMessage(localId: string, serverId?: string, serverCreatedAt?: string) {
        if (!serverId) return;
        try {
            await updateMessageStatus(localId, {
                server_id: serverId,
                sync_status: 'sent',
                server_created_at: serverCreatedAt,
            });
        } catch (err) {
            console.error('Failed to update sent message in SQLite:', err);
        }
    }

    function emitTextMessage(
        tempId: string,
        content: string,
        replyToId: string | null,
        capturedReplyTo: Message | null,
    ) {
        const socket = getSocket();
        if (!socket?.connected) {
            clearPendingTimers(tempId);
            return;
        }
        socket.emit(
            'message:send',
            { conversationId, type: 'text', content, replyToId, localId: tempId },
            (response: any) => {
                clearPendingTimers(tempId);
                if (response?.success) {
                    void updateSentMessage(
                        tempId,
                        response.message?.id,
                        response.message?.createdAt,
                    );
                    setLocalStatusMap((prev) => {
                        const n = { ...prev };
                        delete n[tempId];
                        return n;
                    });
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === tempId
                                ? {
                                      ...response.message,
                                      reactions: [],
                                      replyTo: capturedReplyTo
                                          ? {
                                                id: capturedReplyTo.id,
                                                senderId: capturedReplyTo.senderId,
                                                type: capturedReplyTo.type,
                                                content: capturedReplyTo.content,
                                                deletedForEveryone:
                                                    capturedReplyTo.deletedForEveryone,
                                            }
                                          : null,
                                      status: 'sent',
                                  }
                                : m,
                        ),
                    );
                } else {
                    setLocalStatusMap((prev) => ({ ...prev, [tempId]: 'failed' }));
                }
            },
        );
        if (chatUser) {
            socket.emit('typing:stop', { conversationId, recipientId: chatUser.id });
        }
    }

    function handleSend() {
        if (editingMessage) {
            void handleEditSave();
            return;
        }
        if (!text.trim()) return;

        const localId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const content = text.trim();
        const capturedReply = replyingTo;
        const now = new Date().toISOString();

        const tempMsg: Message = {
            id: localId,
            localId,
            syncStatus: 'pending',
            conversationId,
            senderId: currentUser.id,
            type: 'text',
            content,
            mediaUrl: null,
            mediaName: null,
            mediaSize: null,
            mediaDuration: null,
            replyToId: capturedReply?.id ?? null,
            replyTo: capturedReply
                ? {
                      id: capturedReply.id,
                      senderId: capturedReply.senderId,
                      type: capturedReply.type,
                      content: capturedReply.content,
                      deletedForEveryone: capturedReply.deletedForEveryone,
                  }
                : null,
            forwardedFromId: null,
            isForwarded: false,
            editedAt: null,
            deletedForEveryone: false,
            createdAt: now,
            reactions: [],
            status: null,
        };

        setMessages((prev) => [tempMsg, ...prev]);
        setText('');
        setReplyingTo(null);
        setInputLinkPreview(null);
        setPreviewDismissed(false);
        lastDetectedUrlRef.current = null;
        void clearDraft(conversationId);
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        setLocalStatusMap((prev) => ({ ...prev, [localId]: 'pending' }));
        startPendingTimers(localId);

        const row: LocalMessageRow = {
            local_id: localId,
            server_id: null,
            conversation_id: conversationId,
            sender_id: currentUser.id,
            type: 'text',
            content,
            media_url: null,
            media_name: null,
            media_size: null,
            media_duration: null,
            reply_to_id: capturedReply?.id ?? null,
            is_forwarded: 0,
            forwarded_from_id: null,
            edited_at: null,
            deleted_for_everyone: 0,
            sync_status: 'pending',
            created_at: now,
            server_created_at: null,
        };
        void insertMessage(row);
        void enqueueOutbox(localId, conversationId, {
            conversationId,
            type: 'text',
            content,
            localId,
            replyToId: capturedReply?.id ?? null,
        });

        emitTextMessage(localId, content, capturedReply?.id ?? null, capturedReply);
    }

    function retrySend(message: Message) {
        if (!message.content) return;
        const localId = message.localId ?? message.id;
        setLocalStatusMap((prev) => ({ ...prev, [localId]: 'pending' }));
        startPendingTimers(localId);
        if (message.localId) {
            void outboxRetry(message.localId);
        } else {
            emitTextMessage(localId, message.content, message.replyToId ?? null, null);
        }
    }

    function handleDiscard(message: Message) {
        const localId = message.localId ?? message.id;
        void outboxDiscard(localId);
        void deleteMessage(localId);
        setMessages((prev) => prev.filter((m) => m.id !== message.id && m.localId !== localId));
        setLocalStatusMap((prev) => {
            const n = { ...prev };
            delete n[localId];
            return n;
        });
    }

    async function handleEditSave() {
        if (!editingMessage || !text.trim()) return;
        try {
            await api.put(`/chat/messages/${editingMessage.id}`, { content: text.trim() });
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === editingMessage.id
                        ? { ...m, content: text.trim(), editedAt: new Date().toISOString() }
                        : m,
                ),
            );
            setEditingMessage(null);
            setText('');
        } catch (err: any) {
            showToast('error', err.response?.data?.error ?? 'Failed to edit message');
        }
    }

    function handleDeleteForMe(selectedMessage: Message) {
        setMessages((prev) => prev.filter((m) => m.id !== selectedMessage.id));
    }

    function handleDeleteForEveryone(selectedMessage: Message) {
        Alert.alert('Delete for everyone?', 'This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/chat/messages/${selectedMessage.id}/everyone`);
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === selectedMessage.id
                                    ? { ...m, deletedForEveryone: true, content: null, mediaUrl: null }
                                    : m,
                            ),
                        );
                    } catch (err: any) {
                        showToast('error', err.response?.data?.error ?? 'Failed to delete');
                    }
                },
            },
        ]);
    }

    async function handleCopy(selectedMessage: Message) {
        if (!selectedMessage.content) return;
        await Clipboard.setStringAsync(selectedMessage.content);
        showToast('success', 'Copied to clipboard');
    }

    async function handleForward(convId: string, selectedMessage: Message | null) {
        if (!selectedMessage?.content) return;
        if (convId === conversationId) {
            Alert.alert('Cannot forward', 'You cannot forward a message to the same conversation.');
            return;
        }
        try {
            const socket = getSocket();
            socket?.emit(
                'message:send',
                {
                    conversationId: convId,
                    type: 'text',
                    content: selectedMessage.content,
                    forwardedFromId: selectedMessage.id,
                },
                () => {},
            );
            showToast('success', 'Message forwarded');
        } catch {
            showToast('error', 'Failed to forward message');
        }
    }

    function handleReact(emoji: string, messageId: string) {
        const socket = getSocket();
        const message = messages.find((m) => m.id === messageId);
        if (!message) return;
        const myCurrentReaction = message.reactions.find((r) => r.userId === currentUser.id);
        // Optimistic update
        setMessages((prev) =>
            prev.map((m) => {
                if (m.id !== messageId) return m;
                let reactions = m.reactions.filter((r) => r.userId !== currentUser.id);
                if (myCurrentReaction?.emoji !== emoji)
                    reactions = [...reactions, { emoji, userId: currentUser.id }];
                return { ...m, reactions };
            }),
        );
        if (socket && chatUser) {
            socket.emit(
                'message:react',
                { messageId, emoji, recipientId: chatUser.id, conversationId },
                (response: any) => {
                    if (!response?.success) {
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === messageId ? { ...m, reactions: message.reactions } : m,
                            ),
                        );
                        showToast('error', 'Failed to update reaction');
                    }
                },
            );
        }
    }

    function scrollToMessage(messageId: string | null | undefined) {
        if (!messageId) return;
        const target = messages.find((m) => m.id === messageId);
        if (!target || !flatListRef.current) return;
        flatListRef.current.scrollToItem({ item: target, animated: true });
    }

    function handleChatSearch(query: string) {
        setChatSearchQuery(query);
        if (chatSearchDebounceRef.current) clearTimeout(chatSearchDebounceRef.current);
        if (query.trim().length < 2) {
            setChatSearchResults([]);
            return;
        }
        chatSearchDebounceRef.current = setTimeout(async () => {
            const results = await searchInConversation(conversationId, query);
            setChatSearchResults(results);
        }, 300);
    }

    function handleChatSearchResultSelect(result: SearchResult) {
        setIsSearchingInChat(false);
        setChatSearchQuery('');
        setChatSearchResults([]);
        setHighlightedMessageId(result.messageId);
    }

    function handleTextChange(t: string) {
        setText(t);
        handleTyping();
        // Draft auto-save (500ms debounce)
        if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
        draftTimerRef.current = setTimeout(() => {
            if (t.trim()) void saveDraft(conversationId, t);
            else void clearDraft(conversationId);
        }, 500);
        // URL detection for input preview
        if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
        const match = t.match(URL_REGEX);
        if (!match) {
            setInputLinkPreview(null);
            lastDetectedUrlRef.current = null;
            return;
        }
        const url = match[0];
        if (url !== lastDetectedUrlRef.current) {
            setPreviewDismissed(false);
            lastDetectedUrlRef.current = url;
        }
        previewDebounceRef.current = setTimeout(() => {
            fetchLinkPreview(url).then(setInputLinkPreview);
        }, 800);
    }

    // Combine regular messages with scheduled messages
    const combinedMessages = scheduledMessages.length > 0 
        ? (() => {
            const scheduledItems = scheduledMessages.map(scheduled => ({
                ...scheduled,
                id: `scheduled-${scheduled.id}`,
                type: 'scheduled' as const,
                senderId: currentUser.id,
                createdAt: scheduled.scheduledAt,
                content: scheduled.content,
                deletedForEveryone: false,
                reactions: [],
                status: 'scheduled' as const,
            }));
            
            return [...messages, ...scheduledItems].sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        })()
        : messages;

    return {
        // State
        messages: combinedMessages,
        setMessages,
        text,
        setText,
        isTyping,
        isFirstLoad,
        replyingTo,
        setReplyingTo,
        editingMessage,
        setEditingMessage,
        loadingOlder,
        hasMoreOlder,
        localStatusMap,
        setLocalStatusMap,
        inputLinkPreview,
        setInputLinkPreview,
        previewDismissed,
        setPreviewDismissed,
        previewCache,
        isSearchingInChat,
        setIsSearchingInChat,
        chatSearchQuery,
        setChatSearchQuery,
        chatSearchResults,
        highlightedMessageId,
        highlightAnim,
        flatListRef,
        URL_REGEX,
        // Handlers
        loadOlderMessages,
        handleSend,
        retrySend,
        handleDiscard,
        handleEditSave,
        handleDeleteForMe,
        handleDeleteForEveryone,
        handleCopy,
        handleForward,
        handleReact,
        scrollToMessage,
        handleChatSearch,
        handleChatSearchResultSelect,
        handleTextChange,
    };
}
