import { useEffect, useMemo, useState, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Animated,
    PanResponder,
    Alert,
    Image,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
    useAudioRecorder,
    useAudioPlayer,
    useAudioPlayerStatus,
    AudioModule,
    RecordingPresets,
} from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../shared/components/Avatar';
import { MessageSkeleton } from '../../shared/components/MessageSkeleton';
import { OfflineBanner } from '../../shared/components/OfflineBanner';
import { useToast } from '../../shared/components/Toast';
import { api, BASE_URL } from '../../shared/services/api';
import { getSocket } from '../../shared/services/socket';
import {
    retry as outboxRetry,
    discard as outboxDiscard,
    setOnMessageSynced,
} from '../../shared/services/outbox';
import {
    getMessages as getDbMessages,
    insertMessage,
    upsertServerMessage,
    deleteMessage,
    localRowToMessage,
    updateMessageStatus,
    type LocalMessageRow,
} from '../../shared/db/messages.db.ts';
import { enqueueOutbox } from '../../shared/db/outbox.db.ts';
import { useAuthStore } from '../../shared/stores/auth';
import { usePresenceStore } from '../../shared/stores/presence';
import { useNetworkStore } from '../../shared/stores/network';
import { useThemeColors } from '../../shared/hooks/useThemeColors';
import type { ThemeColors } from '../../shared/utils/theme';
import { formatDuration } from '../../shared/utils/media';
import { getPresenceString } from '../../shared/utils/presence';
import { MessageActionMenu } from './components/MessageActionMenu';
import { ReplyPreviewBar } from './components/ReplyPreviewBar';
import { ForwardModal } from './components/ForwardModal';
import { EmojiPickerModal } from './components/EmojiPickerModal';
import { AttachmentSheet } from './components/AttachmentSheet';
import { ImagePreviewScreen } from './components/ImagePreviewScreen';
import { ImageViewerModal } from './components/ImageViewerModal';
import { VoiceMessageBubble } from './components/VoiceMessageBubble';
import { FileBubble } from './components/FileBubble';
import { TypingIndicator } from './components/TypingIndicator';
import type { Message, User, Reaction } from '../../shared/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

interface Props {
    navigation: NativeStackNavigationProp<any>;
    route: RouteProp<any>;
}

interface GroupedReaction {
    emoji: string;
    count: number;
    mine: boolean;
}

function formatMessageTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function groupReactions(reactions: Reaction[], currentUserId: string): GroupedReaction[] {
    const map: Record<string, number> = {};
    let myEmoji: string | null = null;
    for (const r of reactions) {
        map[r.emoji] = (map[r.emoji] ?? 0) + 1;
        if (r.userId === currentUserId) myEmoji = r.emoji;
    }
    return Object.entries(map)
        .map(([emoji, count]) => ({ emoji, count, mine: emoji === myEmoji }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
}

export function ChatScreen({ navigation, route }: Props) {
    const { conversationId, otherUser, user, relationshipType, contactId, nickname } =
        route.params as {
            conversationId: string;
            otherUser?: User;
            user?: User;
            relationshipType?: 'friend' | 'lover';
            contactId?: string;
            nickname?: string;
        };

    // Support both otherUser and user params; may be undefined when opened from a notification
    const [chatUser, setChatUser] = useState<User | undefined>(otherUser || user);
    const insets = useSafeAreaInsets();
    const headerHeight = useHeaderHeight();

    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [selectedMessageY, setSelectedMessageY] = useState(0);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [showActionMenu, setShowActionMenu] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    // T004 — Media state
    const [showAttachmentSheet, setShowAttachmentSheet] = useState(false);
    const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
    const [isSendingMedia, setIsSendingMedia] = useState(false);
    const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
    const [viewingImageMeta, setViewingImageMeta] = useState<{
        name: string;
        avatarUrl: string | null;
        color: string;
        sentAt: string;
        isMe: boolean;
    } | null>(null);
    const [expandedStatusId, setExpandedStatusId] = useState<string | null>(null);
    const [detailsMessage, setDetailsMessage] = useState<Message | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
    const [uploadProgressMap, setUploadProgressMap] = useState<Record<string, number>>({});
    const [localStatusMap, setLocalStatusMap] = useState<
        Record<string, 'pending' | 'sending' | 'failed'>
    >({});

    // T004 — Media refs
    const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const audioPlayer = useAudioPlayer(null);
    const playerStatus = useAudioPlayerStatus(audioPlayer);
    const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const recordingStartRef = useRef<number>(0);

    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [hasMoreOlder, setHasMoreOlder] = useState(true);

    const flatListRef = useRef<FlatList>(null);
    const inputRef = useRef<TextInput>(null);
    const currentUser = useAuthStore((s) => s.user);
    const isOnline = useNetworkStore((s) => s.isOnline);
    const isOtherOnline = usePresenceStore((s) =>
        chatUser ? s.onlineUserIds.has(chatUser.id) : false,
    );
    const otherLastSeen = usePresenceStore((s) =>
        chatUser ? (s.lastSeenMap[chatUser.id] ?? chatUser.lastSeenAt) : null,
    );
    const colors = useThemeColors();
    const styles = useMemo(() => makeStyles(colors), [colors]);
    const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const swipeAnimMap = useRef<Record<string, Animated.Value>>({});
    const pendingTimers = useRef<Record<string, ReturnType<typeof setTimeout>[]>>({});
    const { showToast } = useToast();

    // Nickname overrides the display name throughout this screen
    const headerDisplayName = nickname || chatUser?.displayName || '';

    // If opened from a notification (no otherUser in params), resolve it from the conversations list
    useEffect(() => {
        if (chatUser) return;
        api.get<any[]>('/chat/conversations')
            .then(({ data }) => {
                const conv = data.find((c) => c.id === conversationId);
                if (conv?.otherUser) setChatUser(conv.otherUser);
            })
            .catch(() => {});
    }, [conversationId]);

    useEffect(() => {
        if (!chatUser) return;
        const relationshipEmoji = relationshipType === 'lover' ? '❤️' : '💙';

        async function resolveContactId(): Promise<string | undefined> {
            if (contactId) return contactId;
            try {
                const { data } = await (
                    await import('../../shared/services/api')
                ).contactsApi.getContacts();
                const found = data.find((c: any) => c.user.id === chatUser!.id);
                return found?.contactId;
            } catch {
                return undefined;
            }
        }

        navigation.setOptions({
            headerTitle: () => (
                <TouchableOpacity
                    style={styles.headerRow}
                    activeOpacity={0.7}
                    onPress={async () => {
                        const resolvedContactId = await resolveContactId();
                        if (!resolvedContactId) return;
                        navigation.navigate('ContactProfile', {
                            contactId: resolvedContactId,
                            otherUser: chatUser!,
                            conversationId,
                            relationshipType,
                        });
                    }}
                >
                    <Avatar
                        uri={chatUser.avatarUrl}
                        name={headerDisplayName}
                        color={chatUser.avatarColor}
                        size={36}
                        isOnline={chatUser.isOnline}
                    />
                    <View style={styles.headerInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.headerName}>{headerDisplayName}</Text>
                            {relationshipType && (
                                <Text style={{ marginLeft: 4, fontSize: 14 }}>
                                    {relationshipEmoji}
                                </Text>
                            )}
                        </View>
                        <Text style={styles.headerStatus}>
                            {isTyping
                                ? 'typing...'
                                : getPresenceString(isOtherOnline, otherLastSeen || '')}
                        </Text>
                    </View>
                </TouchableOpacity>
            ),
        });
    }, [chatUser, isTyping, isOtherOnline, otherLastSeen, relationshipType, nickname, contactId]);

    useEffect(() => {
        if (playerStatus.didJustFinish) {
            setPlayingMessageId(null);
        }
    }, [playerStatus.didJustFinish]);

    async function loadMessages() {
        // 1. Load from SQLite cache immediately
        try {
            const cached = await getDbMessages(conversationId, 50);
            if (cached.length > 0) {
                setMessages(cached.map(localRowToMessage));
                if (isFirstLoad) setIsFirstLoad(false);
            }
        } catch (err) {
            console.error('SQLite load failed:', err);
        }

        // 2. Fetch from server when online
        if (!isOnline) {
            if (isFirstLoad) setIsFirstLoad(false);
            return;
        }
        try {
            const { data } = await api.get<Message[]>(
                `/chat/conversations/${conversationId}/messages`,
            );
            // Ensure server data is sorted newest-first to match local cache and inverted FlatList
            setMessages(
                data.sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                ),
            );
            // Persist server messages to SQLite
            for (const msg of data) {
                void upsertServerMessage(msg, currentUser?.id);
            }
            if (isFirstLoad) setIsFirstLoad(false);
        } catch (err) {
            console.error('Failed to load messages from server:', err);
            if (isFirstLoad) setIsFirstLoad(false);
        }
    }

    // Register outbox sync callback so UI updates when offline messages are delivered
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

    useEffect(() => {
        loadMessages();
        api.post(`/chat/conversations/${conversationId}/read`).catch(() => {});

        const socket = getSocket();
        if (!socket || !chatUser) return;

        // Notify sender that their messages are read on chat open
        socket.emit('messages:read', { conversationId, senderId: chatUser.id });

        // Load older messages when user scrolls to top (inverted FlatList triggers onEndReached)

        function onNewMessage(data: { message: Message; conversationId: string }) {
            if (data.conversationId === conversationId) {
                // Persist to SQLite
                void upsertServerMessage(data.message, currentUser?.id);
                setMessages((prev) => [
                    {
                        ...data.message,
                        reactions: data.message.reactions ?? [],
                        replyTo: data.message.replyTo ?? null,
                    },
                    ...prev,
                ]);
                api.post(`/chat/conversations/${conversationId}/read`).catch(() => {});
                socket?.emit('messages:read', { conversationId, senderId: chatUser!.id });
            }
        }

        function onMessageEdited(data: { message: Message; conversationId: string }) {
            if (data.conversationId === conversationId) {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === data.message.id
                            ? {
                                  ...m,
                                  ...data.message,
                                  reactions: data.message.reactions ?? m.reactions,
                              }
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
            if (data.conversationId === conversationId && data.userId === chatUser!.id)
                setIsTyping(true);
        }
        function onTypingStop(data: { userId: string; conversationId: string }) {
            if (data.conversationId === conversationId && data.userId === chatUser!.id)
                setIsTyping(false);
        }
        function onMessageStatus(data: { conversationId: string; status: string; userId: string }) {
            if (data.conversationId === conversationId) {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.senderId === currentUser?.id ? { ...m, status: data.status as any } : m,
                    ),
                );
            }
        }
        function onConversationDeleted(data: { conversationId: string }) {
            if (data.conversationId === conversationId) {
                navigation.goBack();
            }
        }

        socket.on('message:new', onNewMessage);
        socket.on('message:edited', onMessageEdited);
        socket.on('message:deleted', onMessageDeleted);
        socket.on('message:reaction', onReaction);
        socket.on('typing:start', onTypingStart);
        socket.on('typing:stop', onTypingStop);
        socket.on('messages:status', onMessageStatus);
        socket.on('conversation:deleted', onConversationDeleted);
        return () => {
            socket.off('message:new', onNewMessage);
            socket.off('message:edited', onMessageEdited);
            socket.off('message:deleted', onMessageDeleted);
            socket.off('message:reaction', onReaction);
            socket.off('typing:start', onTypingStart);
            socket.off('typing:stop', onTypingStop);
            socket.off('messages:status', onMessageStatus);
            socket.off('conversation:deleted', onConversationDeleted);
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
                // SQLite hit — deduplicate and append
                const existingIds = new Set(messages.map((m) => m.id));
                const newOnes = mapped.filter((m) => !existingIds.has(m.id));
                if (newOnes.length > 0) {
                    setMessages((prev) => [...prev, ...newOnes]);
                } else {
                    setHasMoreOlder(false);
                }
                return;
            }

            // SQLite miss — if offline, silently stop and keep hasMoreOlder = true so
            // the user can retry when they come back online
            if (!isOnline) return;

            // Online: fetch older messages from server using oldest message ID as cursor
            const { data } = await api.get<Message[]>(
                `/chat/conversations/${conversationId}/messages?cursor=${encodeURIComponent(messages[messages.length - 1].id)}&limit=50`,
            );

            if (data.length === 0) {
                setHasMoreOlder(false);
                return;
            }

            // Persist to SQLite for future offline access
            for (const msg of data) {
                void upsertServerMessage(msg, currentUser?.id);
            }

            // Deduplicate against current state (cursor boundary may overlap)
            const existingIds = new Set(messages.map((m) => m.id));
            const newFromServer = data.filter((m) => !existingIds.has(m.id));
            if (newFromServer.length > 0) {
                setMessages((prev) => [...prev, ...newFromServer]);
            } else {
                setHasMoreOlder(false);
            }
        } catch (err) {
            // T007: network errors must not permanently block further load attempts
            console.error('Failed to load older messages:', err);
        } finally {
            setLoadingOlder(false);
        }
    }

    function handleTyping() {
        const socket = getSocket();
        if (!socket) return;
        socket.emit('typing:start', { conversationId, recipientId: chatUser!.id });
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => {
            socket.emit('typing:stop', { conversationId, recipientId: chatUser!.id });
        }, 2000);
    }

    // T005 — Upload helper (fetch handles RN FormData file objects more reliably than axios)
    async function uploadMedia(uri: string, mimeType: string, fileName: string): Promise<string> {
        const formData = new FormData();
        formData.append('file', { uri, name: fileName, type: mimeType } as any);
        const token = useAuthStore.getState().accessToken;
        const response = await fetch(`${BASE_URL}/api/upload/chat`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Upload failed ${response.status}: ${text}`);
        }
        const data = await response.json();
        return data.url as string;
    }

    // T008 — Pick image
    async function handlePickImage(source: 'gallery' | 'camera') {
        setShowAttachmentSheet(false);
        if (source === 'gallery') {
            const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!granted) {
                showToast('error', 'Go to Settings > LoZo to allow photo access');
                return;
            }
        }
        const result =
            source === 'gallery'
                ? await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: ['images'],
                      quality: 0.85,
                  })
                : await ImagePicker.launchCameraAsync({ quality: 0.85 });
        if (!result.canceled && result.assets[0]) {
            setPreviewImageUri(result.assets[0].uri);
        }
    }

    // T010 — Send image
    async function handleSendImage() {
        if (!previewImageUri) return;
        setIsSendingMedia(true);
        const tempId = `temp_${Date.now()}`;
        const capturedUri = previewImageUri;
        const tempMsg: Message = {
            id: tempId,
            conversationId,
            senderId: currentUser!.id,
            type: 'image',
            content: null,
            mediaUrl: capturedUri,
            mediaName: null,
            mediaSize: null,
            mediaDuration: null,
            replyToId: null,
            forwardedFromId: null,
            isForwarded: false,
            editedAt: null,
            deletedForEveryone: false,
            createdAt: new Date().toISOString(),
            reactions: [],
            replyTo: null,
            status: 'sent',
        };
        setMessages((prev) => [tempMsg, ...prev]);
        setPreviewImageUri(null);
        try {
            const url = await uploadMedia(capturedUri, 'image/jpeg', `image_${Date.now()}.jpg`);
            const { data } = await api.post(`/chat/conversations/${conversationId}/messages`, {
                type: 'image',
                mediaUrl: url,
            });
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === tempId ? { ...data, reactions: data.reactions ?? [] } : m,
                ),
            );
            setUploadProgressMap((prev) => {
                const n = { ...prev };
                delete n[tempId];
                return n;
            });
        } catch (err: any) {
            console.error(
                'Upload image error:',
                err?.response?.status,
                err?.response?.data ?? err?.message,
            );
            showToast('error', 'Failed to send image');
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
        } finally {
            setIsSendingMedia(false);
        }
    }

    // T013 — Voice recording
    async function startRecording() {
        try {
            const { granted } = await AudioModule.requestRecordingPermissionsAsync();
            if (!granted) {
                showToast('error', 'Go to Settings > LoZo to allow microphone access');
                return;
            }
            await AudioModule.setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
            await audioRecorder.prepareToRecordAsync(RecordingPresets.HIGH_QUALITY);
            audioRecorder.record();
            recordingStartRef.current = Date.now();
            setIsRecording(true);
            setRecordingDuration(0);
            recordingTimerRef.current = setInterval(
                () => setRecordingDuration((d) => d + 100),
                100,
            );
        } catch {
            showToast('error', 'Could not start recording');
        }
    }

    async function stopAndSendRecording() {
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        setIsRecording(false);
        await audioRecorder.stop();
        const uri = audioRecorder.uri;
        const durationMs = Date.now() - recordingStartRef.current;
        if (durationMs < 1000 || !uri) return;
        const durationSecs = Math.round(durationMs / 1000);
        const tempId = `temp_${Date.now()}`;
        const tempMsg: Message = {
            id: tempId,
            conversationId,
            senderId: currentUser!.id,
            type: 'voice',
            content: null,
            mediaUrl: uri,
            mediaName: null,
            mediaSize: null,
            mediaDuration: durationSecs,
            replyToId: null,
            forwardedFromId: null,
            isForwarded: false,
            editedAt: null,
            deletedForEveryone: false,
            createdAt: new Date().toISOString(),
            reactions: [],
            replyTo: null,
            status: 'sent',
        };
        setMessages((prev) => [tempMsg, ...prev]);
        try {
            const url = await uploadMedia(uri, 'audio/m4a', `voice_${Date.now()}.m4a`);
            const { data } = await api.post(`/chat/conversations/${conversationId}/messages`, {
                type: 'voice',
                mediaUrl: url,
                mediaDuration: durationSecs,
            });
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === tempId ? { ...data, reactions: data.reactions ?? [] } : m,
                ),
            );
        } catch {
            showToast('error', 'Failed to send voice message');
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
        }
    }

    function cancelRecording() {
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        audioRecorder.stop().catch(() => {});
        setIsRecording(false);
        setRecordingDuration(0);
    }

    // T016 — Voice playback
    function handlePlayVoice(messageId: string, audioUrl: string) {
        if (playingMessageId === messageId) {
            audioPlayer.pause();
            setPlayingMessageId(null);
            return;
        }
        try {
            audioPlayer.replace({ uri: audioUrl });
            audioPlayer.play();
            setPlayingMessageId(messageId);
        } catch {
            showToast('error', 'Could not play voice message');
        }
    }

    // T018 — Pick and send file
    async function handlePickFile() {
        setShowAttachmentSheet(false);
        const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
        if (result.canceled || !result.assets[0]) return;
        const asset = result.assets[0];
        if (asset.size && asset.size > 50 * 1024 * 1024) {
            showToast('error', 'File too large (max 50 MB)');
            return;
        }
        const tempId = `temp_${Date.now()}`;
        const tempMsg: Message = {
            id: tempId,
            conversationId,
            senderId: currentUser!.id,
            type: 'file',
            content: null,
            mediaUrl: null,
            mediaName: asset.name,
            mediaSize: asset.size ?? 0,
            mediaDuration: null,
            replyToId: null,
            forwardedFromId: null,
            isForwarded: false,
            editedAt: null,
            deletedForEveryone: false,
            createdAt: new Date().toISOString(),
            reactions: [],
            replyTo: null,
            status: 'sent',
        };
        setMessages((prev) => [tempMsg, ...prev]);
        try {
            const url = await uploadMedia(
                asset.uri,
                asset.mimeType ?? 'application/octet-stream',
                asset.name,
            );
            const { data } = await api.post(`/chat/conversations/${conversationId}/messages`, {
                type: 'file',
                mediaUrl: url,
                mediaName: asset.name,
                mediaSize: asset.size ?? 0,
            });
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === tempId ? { ...data, reactions: data.reactions ?? [] } : m,
                ),
            );
        } catch {
            showToast('error', 'Failed to send file');
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
        }
    }

    async function handleEditStart() {
        setEditingMessage(selectedMessage);
        setText(selectedMessage?.content ?? '');
        setShowActionMenu(false);
        setSelectedMessage(null);
        setReplyingTo(null);
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

    function handleDeleteForMe() {
        setMessages((prev) => prev.filter((m) => m.id !== selectedMessage?.id));
        setShowActionMenu(false);
        setSelectedMessage(null);
    }

    function handleDeleteForEveryone() {
        Alert.alert('Delete for everyone?', 'This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/chat/messages/${selectedMessage!.id}/everyone`);
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === selectedMessage!.id
                                    ? {
                                          ...m,
                                          deletedForEveryone: true,
                                          content: null,
                                          mediaUrl: null,
                                      }
                                    : m,
                            ),
                        );
                    } catch (err: any) {
                        showToast('error', err.response?.data?.error ?? 'Failed to delete');
                    }
                    setShowActionMenu(false);
                    setSelectedMessage(null);
                },
            },
        ]);
    }

    async function handleCopy() {
        if (!selectedMessage?.content) return;
        await Clipboard.setStringAsync(selectedMessage.content);
        showToast('success', 'Copied to clipboard');
        setShowActionMenu(false);
        setSelectedMessage(null);
    }

    async function handleForward(convId: string) {
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
        setShowForwardModal(false);
        setSelectedMessage(null);
    }

    function handleReact(emoji: string, messageId: string) {
        const socket = getSocket();
        const message = messages.find((m) => m.id === messageId);
        if (!message) return;
        const myCurrentReaction = message.reactions.find((r) => r.userId === currentUser!.id);
        // Optimistic update
        setMessages((prev) =>
            prev.map((m) => {
                if (m.id !== messageId) return m;
                let reactions = m.reactions.filter((r) => r.userId !== currentUser!.id);
                if (myCurrentReaction?.emoji !== emoji)
                    reactions = [...reactions, { emoji, userId: currentUser!.id }];
                return { ...m, reactions };
            }),
        );
        if (socket) {
            socket.emit(
                'message:react',
                { messageId, emoji, recipientId: chatUser!.id, conversationId },
                (response: any) => {
                    if (!response?.success) {
                        // Rollback optimistic update
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

    function emitTextMessage(
        tempId: string,
        content: string,
        replyToId: string | null,
        capturedReplyTo: Message | null,
    ) {
        const socket = getSocket();
        if (!socket?.connected) {
            // Offline — message stays in outbox with pending status
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
        socket.emit('typing:stop', { conversationId, recipientId: chatUser!.id });
    }

    // After socket ack, update SQLite with server ID
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
            senderId: currentUser!.id,
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
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        setLocalStatusMap((prev) => ({ ...prev, [localId]: 'pending' }));
        startPendingTimers(localId);

        // Write to SQLite and enqueue outbox
        const row: LocalMessageRow = {
            local_id: localId,
            server_id: null,
            conversation_id: conversationId,
            sender_id: currentUser!.id,
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

        // Send immediately if online; outbox flush handles offline case on reconnect
        emitTextMessage(localId, content, capturedReply?.id ?? null, capturedReply);
    }

    function retrySend(message: Message) {
        if (!message.content) return;
        const localId = message.localId ?? message.id;
        setLocalStatusMap((prev) => ({ ...prev, [localId]: 'pending' }));
        startPendingTimers(localId);
        // If has localId it was queued through outbox — use outbox retry
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

    // Messenger-style status icon: sent=gray circle, delivered=blue circle, read=avatar
    function MsgStatusIcon({ status, size = 14 }: { status: string; size?: number }) {
        if (status === 'read') {
            return (
                <View
                    style={{
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        overflow: 'hidden',
                    }}
                >
                    <Avatar
                        uri={chatUser!.avatarUrl}
                        name={chatUser!.displayName}
                        color={chatUser!.avatarColor ?? colors.primary}
                        size={size}
                    />
                </View>
            );
        }
        const isDelivered = status === 'delivered';
        return (
            <View
                style={{
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: isDelivered ? colors.primary : colors.gray400,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Text
                    style={{
                        color: '#fff',
                        fontSize: size * 0.55,
                        fontWeight: '700',
                        lineHeight: size,
                    }}
                >
                    ✓
                </Text>
            </View>
        );
    }

    function isSameSection(a: Message, b: Message): boolean {
        if (a.senderId !== b.senderId) return false;
        const ta = new Date(a.createdAt);
        const tb = new Date(b.createdAt);
        return (
            ta.getFullYear() === tb.getFullYear() &&
            ta.getMonth() === tb.getMonth() &&
            ta.getDate() === tb.getDate() &&
            ta.getHours() === tb.getHours() &&
            ta.getMinutes() === tb.getMinutes()
        );
    }

    function renderMessage({ item, index }: { item: Message; index: number }) {
        const isMe = item.senderId === currentUser?.id;
        // In inverted FlatList: index 0 = newest (bottom), index+1 = older (above)
        const prevMsg = messages[index - 1]; // newer = shown below
        const nextMsg = messages[index + 1]; // older = shown above
        const isBottomOfSection = !prevMsg || !isSameSection(item, prevMsg); // show avatar here
        const isTopOfSection = !nextMsg || !isSameSection(item, nextMsg);

        const localStatus = localStatusMap[item.id];

        if (item.deletedForEveryone) {
            return (
                <View
                    style={[
                        styles.messageRow,
                        isMe ? styles.messageRowEnd : styles.messageRowStart,
                    ]}
                >
                    <View style={styles.deletedBubble}>
                        <Text style={styles.deletedText}>Message deleted</Text>
                    </View>
                </View>
            );
        }
        const swipeAnim =
            swipeAnimMap.current[item.id] ??
            (swipeAnimMap.current[item.id] = new Animated.Value(0));
        const swipePan = PanResponder.create({
            onMoveShouldSetPanResponder: (_, { dx, dy }) => Math.abs(dx) > Math.abs(dy) && dx > 5,
            onPanResponderMove: (_, { dx, dy }) => {
                if (dx > 0 && Math.abs(dy) < Math.abs(dx)) swipeAnim.setValue(Math.min(dx, 60));
            },
            onPanResponderRelease: (_, { dx, vx }) => {
                if (dx > 40 || vx > 0.5) {
                    setReplyingTo(item);
                    setTimeout(() => inputRef.current?.focus(), 50);
                }
                Animated.spring(swipeAnim, { toValue: 0, useNativeDriver: true }).start();
            },
        });

        // Last sent message by me → always show status below
        const lastSentByMe = messages.find(
            (m) => m.senderId === currentUser?.id && !m.deletedForEveryone,
        );
        const isLastSentByMe = isMe && lastSentByMe?.id === item.id;
        const isExpanded = expandedStatusId === item.id;
        const showStatusRow = isMe && item.status && (isLastSentByMe || isExpanded);
        const isImageMsg = item.type === 'image' && !!item.mediaUrl;

        // Bubble corner style — clip inner corners for grouped messages (Messenger-style)
        const bubbleRadius: any = {
            borderRadius: 18,
            ...(isMe
                ? {
                      borderTopRightRadius: isTopOfSection ? 4 : 18,
                      borderBottomRightRadius: isBottomOfSection ? 4 : 18,
                  }
                : {
                      borderTopLeftRadius: isTopOfSection ? 4 : 18,
                      borderBottomLeftRadius: isBottomOfSection ? 4 : 18,
                  }),
        };

        return (
            <View
                style={[
                    styles.messageRow,
                    isMe ? styles.messageRowEnd : styles.messageRowStart,
                    isBottomOfSection ? styles.sectionBottom : styles.sectionMiddle,
                ]}
            >
                {/* Avatar column for other user */}
                {!isMe &&
                    (isBottomOfSection ? (
                        <View style={styles.avatarCol}>
                            <Avatar
                                uri={chatUser!.avatarUrl}
                                name={chatUser!.displayName}
                                color={chatUser!.avatarColor ?? colors.primary}
                                size={28}
                            />
                        </View>
                    ) : (
                        <View style={styles.avatarCol} />
                    ))}

                <Animated.View
                    style={{
                        flex: 1,
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                        transform: [{ translateX: swipeAnim }],
                    }}
                    {...swipePan.panHandlers}
                >
                    <TouchableOpacity
                        activeOpacity={isImageMsg ? 0.95 : 0.85}
                        delayLongPress={400}
                        onPress={() => {
                            if (localStatus === 'failed') {
                                Alert.alert(
                                    'Message not sent',
                                    'This message could not be delivered.',
                                    [
                                        { text: 'Cancel', style: 'cancel' },
                                        {
                                            text: 'Discard',
                                            style: 'destructive',
                                            onPress: () => handleDiscard(item),
                                        },
                                        { text: 'Retry', onPress: () => retrySend(item) },
                                    ],
                                );
                                return;
                            }
                            if (isImageMsg) {
                                setViewingImageUrl(item.mediaUrl!);
                                setViewingImageMeta({
                                    name: isMe ? 'You' : chatUser!.displayName,
                                    avatarUrl: isMe
                                        ? (currentUser?.avatarUrl ?? null)
                                        : chatUser!.avatarUrl,
                                    color: isMe
                                        ? (currentUser.avatarColor ?? colors.primary)
                                        : (chatUser!.avatarColor ?? colors.primary),
                                    sentAt: item.createdAt,
                                    isMe,
                                });
                                return;
                            }
                            setExpandedStatusId((prev) => (prev === item.id ? null : item.id));
                        }}
                        onLongPress={(event) => {
                            if (item.deletedForEveryone) return;
                            setSelectedMessageY(event.nativeEvent.pageY);
                            setSelectedMessage(item);
                            setShowActionMenu(true);
                        }}
                        style={{ alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}
                    >
                        {item.isForwarded && <Text style={styles.forwardedLabel}>Forwarded</Text>}
                        {item.replyTo && !item.deletedForEveryone && (
                            <TouchableOpacity onPress={() => scrollToMessage(item.replyToId)}>
                                <View
                                    style={[
                                        styles.replyBubble,
                                        isMe ? styles.replyBubbleMe : styles.replyBubbleOther,
                                    ]}
                                >
                                    <Text style={styles.replyBubbleName}>
                                        {item.replyTo.senderId === currentUser?.id
                                            ? 'You'
                                            : chatUser!.displayName}
                                    </Text>
                                    <Text style={styles.replyBubbleContent} numberOfLines={1}>
                                        {item.replyTo.deletedForEveryone
                                            ? 'Message deleted'
                                            : item.replyTo.content}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}

                        {/* IMAGE: no bubble container */}
                        {isImageMsg ? (
                            <View style={[styles.imageBubble, bubbleRadius]}>
                                <Image
                                    source={{ uri: item.mediaUrl! }}
                                    style={styles.imageThumbnail}
                                    resizeMode="cover"
                                />
                                {uploadProgressMap[item.id] !== undefined && (
                                    <View style={styles.uploadOverlay}>
                                        <View
                                            style={[
                                                styles.uploadBar,
                                                { width: `${uploadProgressMap[item.id]}%` as any },
                                            ]}
                                        />
                                    </View>
                                )}
                                <View style={styles.imageTimeOverlay}>
                                    <Text style={styles.imageTimeText}>
                                        {formatMessageTime(item.createdAt)}
                                    </Text>
                                    {isMe && item.status === 'read' && (
                                        <View
                                            style={{
                                                width: 14,
                                                height: 14,
                                                borderRadius: 7,
                                                overflow: 'hidden',
                                                marginLeft: 3,
                                            }}
                                        >
                                            <Avatar
                                                uri={chatUser!.avatarUrl}
                                                name={chatUser!.displayName}
                                                color={chatUser!.avatarColor ?? colors.primary}
                                                size={14}
                                            />
                                        </View>
                                    )}
                                </View>
                            </View>
                        ) : (
                            /* TEXT / VOICE / FILE: bubble */
                            <View
                                style={[
                                    styles.messageBubble,
                                    isMe ? styles.bubbleMe : styles.bubbleOther,
                                    bubbleRadius,
                                    localStatus === 'failed' && styles.bubbleFailed,
                                ]}
                            >
                                {item.type === 'text' && (
                                    <Text
                                        style={[
                                            styles.messageText,
                                            isMe ? styles.textMe : styles.textOther,
                                        ]}
                                    >
                                        {item.content}
                                    </Text>
                                )}
                                {item.type === 'voice' && item.mediaUrl && (
                                    <VoiceMessageBubble
                                        messageId={item.id}
                                        audioUrl={item.mediaUrl}
                                        duration={item.mediaDuration ?? 0}
                                        isPlaying={playingMessageId === item.id}
                                        isMe={isMe}
                                        onPlay={() => handlePlayVoice(item.id, item.mediaUrl!)}
                                        onPause={() => handlePlayVoice(item.id, item.mediaUrl!)}
                                    />
                                )}
                                {item.type === 'file' && item.mediaUrl && (
                                    <FileBubble
                                        fileName={item.mediaName ?? 'File'}
                                        fileSize={item.mediaSize ?? 0}
                                        fileUrl={item.mediaUrl}
                                        isMe={isMe}
                                    />
                                )}
                                <View style={styles.messageFooter}>
                                    {item.editedAt && (
                                        <Text
                                            style={[
                                                styles.metaText,
                                                isMe ? styles.metaMe : styles.metaOther,
                                            ]}
                                        >
                                            edited
                                        </Text>
                                    )}
                                    <Text
                                        style={[
                                            styles.metaText,
                                            isMe ? styles.metaMe : styles.metaOther,
                                        ]}
                                    >
                                        {formatMessageTime(item.createdAt)}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Local send status (pending/sending/failed) */}
                        {localStatus === 'sending' && (
                            <Text style={styles.sendingText}>Sending...</Text>
                        )}
                        {localStatus === 'failed' && (
                            <Text style={styles.failedText}>Unable to send · Tap to retry</Text>
                        )}

                        {/* Messenger-style delivery status row */}
                        {showStatusRow && !localStatus && (
                            <View
                                style={[
                                    styles.statusRow,
                                    isMe ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' },
                                ]}
                            >
                                {isExpanded && (
                                    <Text style={styles.statusDate}>
                                        {new Date(item.createdAt).toLocaleString([], {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </Text>
                                )}
                                <MsgStatusIcon status={item.status!} size={14} />
                                {(isExpanded || isLastSentByMe) && (
                                    <Text style={styles.statusLabel}>
                                        {item.status === 'sent'
                                            ? 'Sent'
                                            : item.status === 'delivered'
                                              ? 'Delivered'
                                              : 'Seen'}
                                    </Text>
                                )}
                            </View>
                        )}
                    </TouchableOpacity>

                    {item.reactions.length > 0 && !item.deletedForEveryone && (
                        <View
                            style={[
                                styles.reactionsRow,
                                isMe
                                    ? { alignSelf: 'flex-end', marginRight: 8 }
                                    : { alignSelf: 'flex-start', marginLeft: 8 },
                            ]}
                        >
                            {groupReactions(item.reactions, currentUser!.id).map((pill) => (
                                <TouchableOpacity
                                    key={pill.emoji}
                                    style={[
                                        styles.reactionPill,
                                        pill.mine && styles.reactionPillMine,
                                    ]}
                                    onPress={() => handleReact(pill.emoji, item.id)}
                                >
                                    <Text style={styles.reactionPillText}>
                                        {pill.emoji} {pill.count}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </Animated.View>

                {/* Avatar column for me — right side */}
                {isMe &&
                    (isBottomOfSection ? (
                        <View style={[styles.avatarCol, { marginRight: 0, marginLeft: 4 }]}>
                            <Avatar
                                uri={currentUser?.avatarUrl ?? null}
                                name={currentUser?.displayName ?? 'Me'}
                                color={currentUser.avatarColor ?? colors.primary}
                                size={28}
                            />
                        </View>
                    ) : (
                        <View style={[styles.avatarCol, { marginRight: 0, marginLeft: 4 }]} />
                    ))}
            </View>
        );
    }

    const canSend = text.trim().length > 0;

    if (!chatUser) return <MessageSkeleton />;

    if (isFirstLoad && messages.length === 0) {
        if (isOnline) return <MessageSkeleton />;
        return (
            <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
                <OfflineBanner />
                <Text
                    style={[
                        styles.metaText,
                        {
                            color: styles.deletedText.color,
                            textAlign: 'center',
                            paddingHorizontal: 32,
                        },
                    ]}
                >
                    No messages loaded yet.{'\n'}Connect to load this conversation.
                </Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 100}
        >
            <OfflineBanner />
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                inverted
                contentContainerStyle={styles.messagesList}
                keyboardShouldPersistTaps="never"
                ListHeaderComponent={isTyping ? <TypingIndicator /> : null}
                onScroll={(e) => {
                    setShowScrollBtn(e.nativeEvent.contentOffset.y > 300);
                }}
                scrollEventThrottle={100}
                onEndReached={() => {
                    void loadOlderMessages();
                }}
                onEndReachedThreshold={0.2}
                ListFooterComponent={
                    loadingOlder ? (
                        <View style={{ padding: 8 }}>
                            <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                    ) : null
                }
            />
            {showScrollBtn && (
                <TouchableOpacity
                    style={styles.scrollToBottomBtn}
                    onPress={() =>
                        flatListRef.current?.scrollToOffset({ offset: 0, animated: true })
                    }
                    activeOpacity={0.8}
                >
                    <Text style={styles.scrollToBottomIcon}>↓</Text>
                </TouchableOpacity>
            )}
            {editingMessage && (
                <View style={styles.editingBar}>
                    <Text style={styles.editingBarText}>Editing message</Text>
                    <TouchableOpacity
                        onPress={() => {
                            setEditingMessage(null);
                            setText('');
                        }}
                    >
                        <Text style={styles.editingBarCancel}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            )}
            {replyingTo && (
                <ReplyPreviewBar
                    replyingTo={replyingTo}
                    senderName={
                        replyingTo.senderId === currentUser?.id ? 'You' : chatUser!.displayName
                    }
                    onCancel={() => setReplyingTo(null)}
                />
            )}
            <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
                {isRecording ? (
                    <>
                        <TouchableOpacity style={styles.cancelRecordBtn} onPress={cancelRecording}>
                            <Ionicons name="close-circle" size={28} color={colors.gray400} />
                        </TouchableOpacity>
                        <View style={styles.recordingIndicator}>
                            <View style={styles.recordingDot} />
                            <Text style={styles.recordingTimer}>
                                {formatDuration(recordingDuration / 1000)}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={stopAndSendRecording}
                            style={[styles.sendButton, styles.sendActive]}
                        >
                            <Text style={[styles.sendIcon, styles.sendIconActive]}>↑</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TouchableOpacity
                            style={[styles.attachBtn, isSendingMedia && styles.attachBtnDisabled]}
                            onPress={() => setShowAttachmentSheet(true)}
                            disabled={isSendingMedia}
                        >
                            <Ionicons
                                name="attach-outline"
                                size={24}
                                color={isSendingMedia ? colors.gray300 : colors.gray400}
                            />
                        </TouchableOpacity>
                        <TextInput
                            ref={inputRef}
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
                        {canSend ? (
                            <TouchableOpacity
                                onPress={handleSend}
                                style={[styles.sendButton, styles.sendActive]}
                            >
                                <Text style={[styles.sendIcon, styles.sendIconActive]}>↑</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.sendButton, styles.sendInactive]}
                                onPress={startRecording}
                            >
                                <Ionicons name="mic-outline" size={20} color={colors.gray400} />
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </View>
            {selectedMessage && (
                <MessageActionMenu
                    message={selectedMessage}
                    currentUserId={currentUser?.id ?? ''}
                    visible={showActionMenu}
                    messageY={selectedMessageY}
                    currentUserEmoji={
                        selectedMessage.reactions.find((r) => r.userId === currentUser?.id)
                            ?.emoji ?? null
                    }
                    onClose={() => {
                        setShowActionMenu(false);
                        setSelectedMessage(null);
                    }}
                    onReact={(emoji) => {
                        handleReact(emoji, selectedMessage.id);
                        setShowActionMenu(false);
                        setSelectedMessage(null);
                    }}
                    onOpenEmojiPicker={() => {
                        setShowActionMenu(false);
                        setShowEmojiPicker(true);
                    }}
                    onReply={() => {
                        setReplyingTo(selectedMessage);
                        setShowActionMenu(false);
                        setTimeout(() => inputRef.current?.focus(), 50);
                        setSelectedMessage(null);
                    }}
                    onCopy={handleCopy}
                    onForward={() => {
                        setShowForwardModal(true);
                    }}
                    onEdit={handleEditStart}
                    onDeleteForMe={handleDeleteForMe}
                    onDeleteForEveryone={handleDeleteForEveryone}
                    onDetails={() => {
                        setShowActionMenu(false);
                        setDetailsMessage(selectedMessage);
                        setSelectedMessage(null);
                    }}
                />
            )}
            {/* Message Details bottom sheet */}
            {detailsMessage &&
                (() => {
                    const dm = detailsMessage;
                    const isMyMsg = dm.senderId === currentUser?.id;
                    const statusLabel =
                        dm.status === 'read'
                            ? 'Seen'
                            : dm.status === 'delivered'
                              ? 'Delivered'
                              : dm.status === 'sent'
                                ? 'Sent'
                                : null;
                    return (
                        <Modal
                            visible
                            transparent
                            animationType="slide"
                            onRequestClose={() => setDetailsMessage(null)}
                        >
                            <TouchableOpacity
                                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
                                activeOpacity={1}
                                onPress={() => setDetailsMessage(null)}
                            />
                            <View style={styles.detailsSheet}>
                                <View style={styles.detailsHandle} />
                                <Text style={styles.detailsTitle}>Message Info</Text>
                                <View style={styles.detailsRow}>
                                    <Text style={styles.detailsLabel}>Sent at</Text>
                                    <Text style={styles.detailsValue}>
                                        {new Date(dm.createdAt).toLocaleString([], {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </Text>
                                </View>
                                {isMyMsg && statusLabel && (
                                    <View style={styles.detailsRow}>
                                        <Text style={styles.detailsLabel}>Status</Text>
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 8,
                                            }}
                                        >
                                            <MsgStatusIcon status={dm.status!} size={16} />
                                            <Text style={styles.detailsValue}>{statusLabel}</Text>
                                        </View>
                                    </View>
                                )}
                                {dm.type === 'image' && dm.mediaUrl && (
                                    <View style={styles.detailsRow}>
                                        <Text style={styles.detailsLabel}>Type</Text>
                                        <Text style={styles.detailsValue}>Image</Text>
                                    </View>
                                )}
                                {dm.type === 'file' && (
                                    <View style={styles.detailsRow}>
                                        <Text style={styles.detailsLabel}>File</Text>
                                        <Text style={styles.detailsValue} numberOfLines={1}>
                                            {dm.mediaName ?? 'Unknown'}
                                        </Text>
                                    </View>
                                )}
                                <TouchableOpacity
                                    style={styles.detailsClose}
                                    onPress={() => setDetailsMessage(null)}
                                >
                                    <Text style={styles.detailsCloseText}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </Modal>
                    );
                })()}
            <EmojiPickerModal
                visible={showEmojiPicker}
                currentUserEmoji={
                    selectedMessage?.reactions.find((r) => r.userId === currentUser?.id)?.emoji ??
                    null
                }
                onReact={(emoji) => {
                    handleReact(emoji, selectedMessage!.id);
                    setShowEmojiPicker(false);
                    setSelectedMessage(null);
                }}
                onClose={() => {
                    setShowEmojiPicker(false);
                    setSelectedMessage(null);
                }}
            />
            <ForwardModal
                visible={showForwardModal}
                message={selectedMessage}
                onClose={() => setShowForwardModal(false)}
                onForward={handleForward}
                excludeConversationId={conversationId}
            />
            <AttachmentSheet
                visible={showAttachmentSheet}
                onClose={() => setShowAttachmentSheet(false)}
                onGallery={() => handlePickImage('gallery')}
                onCamera={() => handlePickImage('camera')}
                onFile={handlePickFile}
            />
            <ImagePreviewScreen
                visible={previewImageUri !== null}
                uri={previewImageUri}
                onSend={handleSendImage}
                onCancel={() => setPreviewImageUri(null)}
                isSending={isSendingMedia}
            />
            <ImageViewerModal
                visible={viewingImageUrl !== null}
                imageUrl={viewingImageUrl}
                onClose={() => {
                    setViewingImageUrl(null);
                    setViewingImageMeta(null);
                }}
                senderName={viewingImageMeta?.name}
                senderAvatarUrl={viewingImageMeta?.avatarUrl}
                senderColor={viewingImageMeta?.color}
                sentAt={viewingImageMeta?.sentAt}
            />
        </KeyboardAvoidingView>
    );
}

function makeStyles(colors: ThemeColors) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.white },
        messagesList: { paddingVertical: 8 },
        scrollToBottomBtn: {
            position: 'absolute',
            bottom: 80,
            right: 16,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.white,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 4,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.gray100,
        },
        scrollToBottomIcon: {
            fontSize: 18,
            color: colors.gray400,
            lineHeight: 22,
        },
        headerRow: { flexDirection: 'row', alignItems: 'center' },
        headerInfo: { marginLeft: 8 },
        headerName: { fontSize: 16, fontWeight: '600', color: colors.dark },
        headerStatus: { fontSize: 12, color: colors.gray400 },
        messageRow: {
            marginHorizontal: 8,
            marginVertical: 1,
            flexDirection: 'row',
            alignItems: 'flex-end',
        },
        messageRowEnd: { justifyContent: 'flex-end' },
        messageRowStart: { justifyContent: 'flex-start' },
        sectionBottom: { marginBottom: 4 },
        sectionMiddle: { marginBottom: 1 },
        avatarCol: {
            width: 36,
            alignItems: 'center',
            justifyContent: 'flex-end',
            marginRight: 4,
            flexShrink: 0,
        },
        messageBubble: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
        bubbleMe: { backgroundColor: colors.primary },
        bubbleOther: { backgroundColor: colors.gray50 },
        messageText: { fontSize: 16 },
        textMe: { color: '#FFFFFF' },
        textOther: { color: colors.dark },
        messageFooter: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'center',
            marginTop: 2,
            gap: 4,
        },
        metaText: { fontSize: 10 },
        metaMe: { color: 'rgba(255,255,255,0.6)' },
        metaOther: { color: colors.gray400 },
        // Image bubble — no background container
        imageBubble: {
            maxWidth: 240,
            borderRadius: 18,
            overflow: 'hidden',
        },
        imageTimeOverlay: {
            position: 'absolute',
            bottom: 6,
            right: 8,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.35)',
            borderRadius: 10,
            paddingHorizontal: 6,
            paddingVertical: 2,
        },
        imageTimeText: { color: '#fff', fontSize: 10, fontWeight: '500' },
        bubbleFailed: { opacity: 0.7 },
        sendingText: { fontSize: 10, color: colors.gray400, marginTop: 2, alignSelf: 'flex-end' },
        failedText: { fontSize: 11, color: colors.red, marginTop: 2, alignSelf: 'flex-end' },
        // Messenger status row
        statusRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            marginTop: 2,
            marginHorizontal: 4,
            marginBottom: 2,
        },
        statusDate: { fontSize: 10, color: colors.gray400, marginRight: 2 },
        statusLabel: { fontSize: 11, color: colors.gray400 },
        // Details bottom sheet
        detailsSheet: {
            backgroundColor: colors.white,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 20,
            paddingBottom: 32,
            paddingTop: 12,
        },
        detailsHandle: {
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.gray200,
            alignSelf: 'center',
            marginBottom: 16,
        },
        detailsTitle: {
            fontSize: 17,
            fontWeight: '600',
            color: colors.dark,
            textAlign: 'center',
            marginBottom: 16,
        },
        detailsRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 12,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.gray100,
        },
        detailsLabel: { fontSize: 15, color: colors.gray500 },
        detailsValue: {
            fontSize: 15,
            color: colors.dark,
            fontWeight: '500',
            maxWidth: '60%',
            textAlign: 'right',
        },
        detailsClose: {
            marginTop: 20,
            alignSelf: 'center',
            paddingHorizontal: 32,
            paddingVertical: 12,
            backgroundColor: colors.gray50,
            borderRadius: 12,
        },
        detailsCloseText: { fontSize: 15, color: colors.primary, fontWeight: '600' },
        deletedBubble: {
            backgroundColor: colors.gray50,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
        },
        deletedText: { color: colors.gray400, fontStyle: 'italic', fontSize: 14 },
        forwardedLabel: {
            fontSize: 12,
            color: colors.gray400,
            fontStyle: 'italic',
            marginBottom: 2,
            marginHorizontal: 8,
        },
        replyBubble: {
            maxWidth: '80%',
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 8,
            borderLeftWidth: 2,
            marginBottom: 2,
            marginHorizontal: 8,
        },
        replyBubbleMe: { backgroundColor: 'rgba(0,132,255,0.1)', borderLeftColor: colors.primary },
        replyBubbleOther: { backgroundColor: colors.gray50, borderLeftColor: colors.gray300 },
        replyBubbleName: {
            fontSize: 11,
            fontWeight: '600',
            color: colors.primary,
            marginBottom: 1,
        },
        replyBubbleContent: { fontSize: 11, color: colors.gray500 },
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
        replyContainerOther: { backgroundColor: colors.gray50, borderLeftColor: colors.gray300 },
        replyText: { fontSize: 12, color: colors.gray500 },
        editingBar: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: colors.gray50,
            borderTopWidth: 1,
            borderTopColor: colors.gray100,
        },
        editingBarText: { fontSize: 13, color: colors.gray500, fontStyle: 'italic' },
        editingBarCancel: { fontSize: 13, color: colors.primary, fontWeight: '600' },
        reactionsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 },
        reactionPill: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.gray50,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 8,
            paddingVertical: 3,
            marginRight: 4,
            marginTop: 2,
        },
        reactionPillMine: { backgroundColor: colors.primary + '25', borderColor: colors.primary },
        reactionPillText: { fontSize: 13, color: colors.dark },
        inputBar: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: colors.gray100,
            backgroundColor: colors.white,
        },
        attachBtn: {
            width: 36,
            height: 36,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 4,
        },
        attachBtnDisabled: { opacity: 0.4 },
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
        sendActive: { backgroundColor: colors.primary },
        sendInactive: { backgroundColor: colors.gray100 },
        sendIcon: { fontSize: 18, fontWeight: '700' },
        sendIconActive: { color: '#FFFFFF' },
        sendIconInactive: { color: colors.gray400 },
        cancelRecordBtn: { padding: 4, marginRight: 8 },
        recordingIndicator: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
        recordingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#e53935' },
        recordingTimer: { fontSize: 16, color: colors.dark, fontWeight: '500', minWidth: 40 },
        recordingHint: { fontSize: 13, color: colors.gray400 },
        imageThumbnail: { width: 220, height: 220 },
        uploadOverlay: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
        },
        uploadBar: { height: 4, backgroundColor: colors.primary, borderBottomLeftRadius: 12 },
    });
}
