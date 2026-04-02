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
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../shared/components/Avatar';
import { MessageSkeleton } from '../../shared/components/MessageSkeleton';
import { OfflineBanner } from '../../shared/components/OfflineBanner';
import { api } from '../../shared/services/api';
import { useAuthStore } from '../../shared/stores/auth';
import { usePresenceStore } from '../../shared/stores/presence';
import { useNetworkStore } from '../../shared/stores/network';
import { useThemeColors } from '../../shared/hooks/useThemeColors';
import type { ThemeColors } from '../../shared/utils/theme';
import { getPresenceString } from '../../shared/utils/presence';
import { MessageActionMenu } from './components/MessageActionMenu';
import { ReplyPreviewBar } from './components/ReplyPreviewBar';
import { SearchBar } from './components/SearchBar';
import { SearchResults } from './components/SearchResults';
import { ForwardModal } from './components/ForwardModal';
import { EmojiPickerModal } from './components/EmojiPickerModal';
import { AttachmentSheet } from './components/AttachmentSheet';
import { ImagePreviewScreen } from './components/ImagePreviewScreen';
import { ImageViewerModal } from './components/ImageViewerModal';
import { VoiceMessageBubble } from './components/VoiceMessageBubble';
import { FileBubble } from './components/FileBubble';
import { StoryReplyBubble } from './components/StoryReplyBubble';
import { TypingIndicator } from './components/TypingIndicator';
import { LinkPreviewCard } from './components/LinkPreviewCard';
import { HeaderMenu } from './components/HeaderMenu';
import { SendButton } from './components/SendButton';
import { SchedulePickerModal } from './scheduling/SchedulePickerModal';
import { ScheduledMessageBubble } from './scheduling/ScheduledMessageBubble';
import { useScheduledMessages } from './scheduling/useScheduledMessages';
import { useChatMessages } from './hooks/useChatMessages';
import { useChatMedia } from './hooks/useChatMedia';
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
    const {
        conversationId,
        otherUser,
        user,
        relationshipType,
        contactId,
        nickname,
        highlightMessageId: initialHighlightId,
    } = route.params as {
        conversationId: string;
        otherUser?: User;
        user?: User;
        relationshipType?: 'friend' | 'lover';
        contactId?: string;
        nickname?: string;
        highlightMessageId?: string;
    };

    const [chatUser, setChatUser] = useState<User | undefined>(otherUser || user);
    const insets = useSafeAreaInsets();
    const headerHeight = useHeaderHeight();

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

    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [selectedMessageY, setSelectedMessageY] = useState(0);
    const [showActionMenu, setShowActionMenu] = useState(false);
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [expandedStatusId, setExpandedStatusId] = useState<string | null>(null);
    const [detailsMessage, setDetailsMessage] = useState<Message | null>(null);
    const [showScheduleModal, setShowScheduleModal] = useState(false);

    const inputRef = useRef<TextInput>(null);
    const swipeAnimMap = useRef<Record<string, Animated.Value>>({});

    const headerDisplayName = nickname || chatUser?.displayName || '';

    // If opened from a notification (no otherUser in params), resolve from conversation list
    useEffect(() => {
        if (chatUser) return;
        api.get<any[]>('/chat/conversations')
            .then(({ data }) => {
                const conv = data.find((c) => c.id === conversationId);
                if (conv?.otherUser) setChatUser(conv.otherUser);
            })
            .catch(() => {});
    }, [conversationId]);

    const scheduling = useScheduledMessages({
        conversationId,
    });

    const msg = useChatMessages({
        conversationId,
        chatUser,
        currentUser: currentUser!,
        isOnline,
        onConversationDeleted: () => navigation.goBack(),
        initialHighlightId,
        scheduledMessages: scheduling.scheduledMessages,
    });

    const media = useChatMedia({
        conversationId,
        currentUser: currentUser!,
        setMessages: msg.setMessages,
        setLocalStatusMap: msg.setLocalStatusMap,
    });

    // playerStatus → stop playingMessageId when audio finishes
    useEffect(() => {
        if (media.playerStatus.didJustFinish) {
            media.setPlayingMessageId(null);
        }
    }, [media.playerStatus.didJustFinish]);

    // Set navigation header
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
            headerRight: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                        onPress={() => msg.setIsSearchingInChat(true)}
                        hitSlop={8}
                        style={{ padding: 4, marginRight: 4 }}
                    >
                        <Ionicons name="search-outline" size={22} color={colors.gray500} />
                    </TouchableOpacity>
                </View>
            ),
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
                        isOnline={isOtherOnline}
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
                            {msg.isTyping
                                ? 'typing...'
                                : getPresenceString(isOtherOnline, otherLastSeen || '')}
                        </Text>
                    </View>
                </TouchableOpacity>
            ),
        });
    }, [
        chatUser,
        msg.isTyping,
        isOtherOnline,
        otherLastSeen,
        relationshipType,
        nickname,
        contactId,
    ]);

    // Messenger-style status icon
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

    function renderMessage({ item, index }: { item: any; index: number }) {
        // Handle scheduled messages
        if (item.type === 'scheduled') {
            return (
                <View
                    style={[
                        styles.messageRow,
                        styles.messageRowEnd, // Scheduled messages are always from current user
                    ]}
                >
                    <ScheduledMessageBubble 
                        message={item}
                        onPress={() => {
                            // TODO: Add scheduled message menu for editing/canceling
                        }}
                    />
                </View>
            );
        }
        
        const isMe = item.senderId === currentUser?.id;
        // Note: Using original messages array for prev/next logic since we can't easily
        // access the combined data here. This is acceptable for now.
        const prevMsg = msg.messages[index - 1];
        const nextMsg = msg.messages[index + 1];
        const isBottomOfSection = !prevMsg || !isSameSection(item, prevMsg);
        const isTopOfSection = !nextMsg || !isSameSection(item, nextMsg);
        const localStatus = msg.localStatusMap[item.id];

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
                    msg.setReplyingTo(item);
                    setTimeout(() => inputRef.current?.focus(), 50);
                }
                Animated.spring(swipeAnim, { toValue: 0, useNativeDriver: true }).start();
            },
        });

        const lastSentByMe = msg.messages.find(
            (m) => m.senderId === currentUser?.id && !m.deletedForEveryone,
        );
        const isLastSentByMe = isMe && lastSentByMe?.id === item.id;
        const isExpanded = expandedStatusId === item.id;
        const showStatusRow = isMe && item.status && (isLastSentByMe || isExpanded);
        const isImageMsg = item.type === 'image' && !!item.mediaUrl;

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
                    <Animated.View
                        style={{
                            backgroundColor:
                                msg.highlightedMessageId === item.id ||
                                msg.highlightedMessageId === item.localId
                                    ? msg.highlightAnim.interpolate({
                                          inputRange: [0, 1],
                                          outputRange: [
                                              'rgba(255,255,255,0)',
                                              'rgba(255,214,10,0.3)',
                                          ],
                                      })
                                    : 'transparent',
                            borderRadius: 20,
                            padding: 2,
                        }}
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
                                                onPress: () => msg.handleDiscard(item),
                                            },
                                            { text: 'Retry', onPress: () => msg.retrySend(item) },
                                        ],
                                    );
                                    return;
                                }
                                if (isImageMsg) {
                                    media.setViewingImageUrl(item.mediaUrl!);
                                    media.setViewingImageMeta({
                                        name: isMe ? 'You' : chatUser!.displayName,
                                        avatarUrl: isMe
                                            ? (currentUser?.avatarUrl ?? null)
                                            : chatUser!.avatarUrl,
                                        color: isMe
                                            ? (currentUser!.avatarColor ?? colors.primary)
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
                            style={{
                                alignItems: isMe ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                            }}
                        >
                            {item.isForwarded && (
                                <Text style={styles.forwardedLabel}>Forwarded</Text>
                            )}
                            {item.replyTo && !item.deletedForEveryone && (
                                <TouchableOpacity
                                    onPress={() => msg.scrollToMessage(item.replyToId)}
                                >
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
                            {!!item.storyReplyId && (
                                <StoryReplyBubble
                                    thumbnailUrl={item.storyThumbnailUrl ?? null}
                                    isExpired={!item.storyThumbnailUrl}
                                />
                            )}

                            {isImageMsg ? (
                                <View style={[styles.imageBubble, bubbleRadius]}>
                                    <Image
                                        source={{ uri: item.mediaUrl! }}
                                        style={styles.imageThumbnail}
                                        resizeMode="cover"
                                    />
                                    {media.uploadProgressMap[item.id] !== undefined && (
                                        <View style={styles.uploadOverlay}>
                                            <View
                                                style={[
                                                    styles.uploadBar,
                                                    {
                                                        width: `${media.uploadProgressMap[item.id]}%` as any,
                                                    },
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
                                <View
                                    style={[
                                        styles.messageBubble,
                                        isMe ? styles.bubbleMe : styles.bubbleOther,
                                        bubbleRadius,
                                        localStatus === 'failed' && styles.bubbleFailed,
                                    ]}
                                >
                                    {item.type === 'text' && (
                                        <>
                                            <Text
                                                style={[
                                                    styles.messageText,
                                                    isMe ? styles.textMe : styles.textOther,
                                                ]}
                                            >
                                                {item.content}
                                            </Text>
                                            {(() => {
                                                const match = item.content?.match(msg.URL_REGEX);
                                                if (!match) return null;
                                                const preview = msg.previewCache[match[0]];
                                                if (!preview) return null;
                                                return (
                                                    <LinkPreviewCard
                                                        preview={preview}
                                                        isOwn={isMe}
                                                    />
                                                );
                                            })()}
                                        </>
                                    )}
                                    {item.type === 'voice' && item.mediaUrl && (
                                        <VoiceMessageBubble
                                            messageId={item.id}
                                            audioUrl={item.mediaUrl}
                                            duration={item.mediaDuration ?? 0}
                                            isPlaying={media.playingMessageId === item.id}
                                            isMe={isMe}
                                            onPlay={() =>
                                                media.handlePlayVoice(item.id, item.mediaUrl!)
                                            }
                                            onPause={() =>
                                                media.handlePlayVoice(item.id, item.mediaUrl!)
                                            }
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

                            {localStatus === 'sending' && (
                                <Text style={styles.sendingText}>Sending...</Text>
                            )}
                            {localStatus === 'failed' && (
                                <Text style={styles.failedText}>Unable to send · Tap to retry</Text>
                            )}

                            {showStatusRow && !localStatus && (
                                <View
                                    style={[
                                        styles.statusRow,
                                        isMe
                                            ? { alignSelf: 'flex-end' }
                                            : { alignSelf: 'flex-start' },
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
                                        onPress={() => msg.handleReact(pill.emoji, item.id)}
                                    >
                                        <Text style={styles.reactionPillText}>
                                            {pill.emoji} {pill.count}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </Animated.View>
                </Animated.View>

                {isMe &&
                    (isBottomOfSection ? (
                        <View style={[styles.avatarCol, { marginRight: 0, marginLeft: 4 }]}>
                            <Avatar
                                uri={currentUser?.avatarUrl ?? null}
                                name={currentUser?.displayName ?? 'Me'}
                                color={currentUser!.avatarColor ?? colors.primary}
                                size={28}
                            />
                        </View>
                    ) : (
                        <View style={[styles.avatarCol, { marginRight: 0, marginLeft: 4 }]} />
                    ))}
            </View>
        );
    }

    const canSend = msg.text.trim().length > 0;

    if (!chatUser) return <MessageSkeleton />;

    if (msg.isFirstLoad && msg.messages.length === 0) {
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
            {msg.isSearchingInChat && (
                <>
                    <SearchBar
                        onSearch={msg.handleChatSearch}
                        onClose={() => {
                            msg.setIsSearchingInChat(false);
                            msg.setChatSearchQuery('');
                        }}
                    />
                    <SearchResults
                        results={msg.chatSearchResults}
                        query={msg.chatSearchQuery}
                        onSelect={msg.handleChatSearchResultSelect}
                    />
                </>
            )}
            {!msg.isSearchingInChat && (
                <>
                    <FlatList
                        ref={msg.flatListRef}
                        data={msg.messages}
                        keyExtractor={(item) => item.id}
                        renderItem={renderMessage}
                        inverted
                        contentContainerStyle={styles.messagesList}
                        keyboardShouldPersistTaps="never"
                        ListHeaderComponent={msg.isTyping ? <TypingIndicator /> : null}
                        onScroll={(e) => {
                            setShowScrollBtn(e.nativeEvent.contentOffset.y > 300);
                        }}
                        scrollEventThrottle={100}
                        onEndReached={() => void msg.loadOlderMessages()}
                        onEndReachedThreshold={0.2}
                        ListFooterComponent={
                            msg.loadingOlder ? (
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
                                msg.flatListRef.current?.scrollToOffset({
                                    offset: 0,
                                    animated: true,
                                })
                            }
                            activeOpacity={0.8}
                        >
                            <Text style={styles.scrollToBottomIcon}>↓</Text>
                        </TouchableOpacity>
                    )}
                    {msg.editingMessage && (
                        <View style={styles.editingBar}>
                            <Text style={styles.editingBarText}>Editing message</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    msg.setEditingMessage(null);
                                    msg.setText('');
                                }}
                            >
                                <Text style={styles.editingBarCancel}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    {msg.replyingTo && (
                        <ReplyPreviewBar
                            replyingTo={msg.replyingTo}
                            senderName={
                                msg.replyingTo.senderId === currentUser?.id
                                    ? 'You'
                                    : chatUser!.displayName
                            }
                            onCancel={() => msg.setReplyingTo(null)}
                        />
                    )}
                    {msg.inputLinkPreview && !msg.previewDismissed && (
                        <View style={{ paddingHorizontal: 8, paddingBottom: 4 }}>
                            <LinkPreviewCard
                                preview={msg.inputLinkPreview}
                                onDismiss={() => msg.setPreviewDismissed(true)}
                            />
                        </View>
                    )}
                    <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
                        {media.isRecording ? (
                            <>
                                <TouchableOpacity
                                    style={styles.cancelRecordBtn}
                                    onPress={media.cancelRecording}
                                >
                                    <Ionicons
                                        name="close-circle"
                                        size={28}
                                        color={colors.gray400}
                                    />
                                </TouchableOpacity>
                                <View style={styles.recordingIndicator}>
                                    <View style={styles.recordingDot} />
                                    <Text style={styles.recordingTimer}>
                                        {media.recordingLabel}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={media.stopAndSendRecording}
                                    style={[styles.sendButton, styles.sendActive]}
                                >
                                    <Text style={[styles.sendIcon, styles.sendIconActive]}>↑</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <TouchableOpacity
                                    style={[
                                        styles.attachBtn,
                                        media.isSendingMedia && styles.attachBtnDisabled,
                                    ]}
                                    onPress={() => media.setShowAttachmentSheet(true)}
                                    disabled={media.isSendingMedia}
                                >
                                    <Ionicons
                                        name="attach-outline"
                                        size={24}
                                        color={
                                            media.isSendingMedia ? colors.gray300 : colors.gray400
                                        }
                                    />
                                </TouchableOpacity>
                                <TextInput
                                    ref={inputRef}
                                    value={msg.text}
                                    onChangeText={msg.handleTextChange}
                                    placeholder="Message..."
                                    style={styles.textInput}
                                    placeholderTextColor={colors.gray400}
                                    multiline
                                    maxLength={5000}
                                />
                                <SendButton
                                    canSend={canSend}
                                    onPress={msg.handleSend}
                                    onLongPress={() => setShowScheduleModal(true)}
                                    onVoicePress={media.startRecording}
                                    disabled={media.isSendingMedia}
                                />
                            </>
                        )}
                    </View>
                </>
            )}
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
                        msg.handleReact(emoji, selectedMessage.id);
                        setShowActionMenu(false);
                        setSelectedMessage(null);
                    }}
                    onOpenEmojiPicker={() => {
                        setShowActionMenu(false);
                        setShowEmojiPicker(true);
                    }}
                    onReply={() => {
                        msg.setReplyingTo(selectedMessage);
                        setShowActionMenu(false);
                        setTimeout(() => inputRef.current?.focus(), 50);
                        setSelectedMessage(null);
                    }}
                    onCopy={() => {
                        msg.handleCopy(selectedMessage);
                        setShowActionMenu(false);
                        setSelectedMessage(null);
                    }}
                    onForward={() => {
                        setShowForwardModal(true);
                    }}
                    onEdit={() => {
                        msg.setEditingMessage(selectedMessage);
                        msg.setText(selectedMessage.content ?? '');
                        setShowActionMenu(false);
                        setSelectedMessage(null);
                        msg.setReplyingTo(null);
                    }}
                    onDeleteForMe={() => {
                        msg.handleDeleteForMe(selectedMessage);
                        setShowActionMenu(false);
                        setSelectedMessage(null);
                    }}
                    onDeleteForEveryone={() => {
                        msg.handleDeleteForEveryone(selectedMessage);
                        setShowActionMenu(false);
                        setSelectedMessage(null);
                    }}
                    onDetails={() => {
                        setShowActionMenu(false);
                        setDetailsMessage(selectedMessage);
                        setSelectedMessage(null);
                    }}
                />
            )}
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
                    msg.handleReact(emoji, selectedMessage!.id);
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
                onForward={(convId) => {
                    msg.handleForward(convId, selectedMessage);
                    setShowForwardModal(false);
                    setSelectedMessage(null);
                }}
                excludeConversationId={conversationId}
            />
            <SchedulePickerModal
                visible={showScheduleModal}
                onClose={() => setShowScheduleModal(false)}
                onConfirm={(scheduledAt) => {
                    if (msg.text.trim()) {
                        scheduling.scheduleNewMessage(msg.text.trim(), scheduledAt);
                        msg.handleTextChange(''); // Clear input after scheduling
                    }
                    setShowScheduleModal(false);
                }}
            />
            <AttachmentSheet
                visible={media.showAttachmentSheet}
                onClose={() => media.setShowAttachmentSheet(false)}
                onGallery={() => media.handlePickImage('gallery')}
                onCamera={() => media.handlePickImage('camera')}
                onFile={media.handlePickFile}
            />
            <ImagePreviewScreen
                visible={media.previewImageUri !== null}
                uri={media.previewImageUri}
                onSend={media.handleSendImage}
                onCancel={() => media.setPreviewImageUri(null)}
                isSending={media.isSendingMedia || media.isCompressing}
                sendLabel={media.isCompressing ? 'Compressing...' : undefined}
            />
            <ImageViewerModal
                visible={media.viewingImageUrl !== null}
                imageUrl={media.viewingImageUrl}
                onClose={() => {
                    media.setViewingImageUrl(null);
                    media.setViewingImageMeta(null);
                }}
                senderName={media.viewingImageMeta?.name}
                senderAvatarUrl={media.viewingImageMeta?.avatarUrl}
                senderColor={media.viewingImageMeta?.color}
                sentAt={media.viewingImageMeta?.sentAt}
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
        scrollToBottomIcon: { fontSize: 18, color: colors.gray400, lineHeight: 22 },
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
        imageBubble: { maxWidth: 240, borderRadius: 18, overflow: 'hidden' },
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
        recordingHint: { fontSize: 13, color: colors.gray400 },
    });
}
