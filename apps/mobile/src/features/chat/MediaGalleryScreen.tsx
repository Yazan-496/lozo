import { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useThemeColors } from '../../shared/hooks/useThemeColors';
import { getMediaByType } from '../../shared/db/media.db.ts';
import type { MediaItem } from '../../shared/types';
import { MediaGrid } from './components/MediaGrid';
import { MediaFullscreenViewer } from './components/MediaFullscreenViewer';
import { ForwardModal } from './components/ForwardModal';
import { api } from '../../shared/services/api';
import { useToast } from '../../shared/components/Toast';

type Tab = 'image' | 'voice' | 'file';

interface Props {
    navigation: NativeStackNavigationProp<any>;
    route: RouteProp<any>;
}

const PAGE_SIZE = 50;

export function MediaGalleryScreen({ navigation, route }: Props) {
    const { conversationId } = route.params as { conversationId: string };
    const colors = useThemeColors();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<Tab>('image');
    const [items, setItems] = useState<MediaItem[]>([]);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerIndex, setViewerIndex] = useState(0);
    const [forwardItem, setForwardItem] = useState<MediaItem | null>(null);

    async function loadItems(tab: Tab, currentOffset: number, reset = false) {
        if (loading) return;
        setLoading(true);
        const results = await getMediaByType(conversationId, tab, PAGE_SIZE, currentOffset);
        setLoading(false);
        if (reset) {
            setItems(results);
        } else {
            setItems((prev) => [...prev, ...results]);
        }
        setHasMore(results.length === PAGE_SIZE);
        setOffset(currentOffset + results.length);
    }

    useFocusEffect(
        useCallback(() => {
            setOffset(0);
            setHasMore(true);
            loadItems(activeTab, 0, true);
        }, [activeTab, conversationId]),
    );

    function switchTab(tab: Tab) {
        if (tab === activeTab) return;
        setActiveTab(tab);
        setItems([]);
        setOffset(0);
        setHasMore(true);
    }

    function onEndReached() {
        if (hasMore && !loading) {
            loadItems(activeTab, offset);
        }
    }

    function openFullscreen(item: MediaItem, index: number) {
        setViewerIndex(index);
        setViewerVisible(true);
    }

    function showActionSheet(item: MediaItem) {
        Alert.alert('', '', [
            {
                text: 'Forward',
                onPress: () => setForwardItem(item),
            },
            {
                text: 'Download',
                onPress: () => downloadItem(item),
            },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => deleteItem(item),
            },
            { text: 'Cancel', style: 'cancel' },
        ]);
    }

    async function downloadItem(item: MediaItem) {
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                showToast('error', 'Storage permission required to download');
                return;
            }
            const filename = item.mediaName ?? `media_${Date.now()}.jpg`;
            const dest = `${FileSystem.cacheDirectory}${filename}`;
            await FileSystem.downloadAsync(item.mediaUrl, dest);
            await MediaLibrary.saveToLibraryAsync(dest);
            showToast('success', 'Saved to gallery');
        } catch {
            showToast('error', 'Download failed');
        }
    }

    async function deleteItem(item: MediaItem) {
        try {
            await api.delete(`/chat/messages/${item.id}`);
            setItems((prev) => prev.filter((m) => m.id !== item.id));
        } catch {
            showToast('error', 'Delete failed');
        }
    }

    const tabs: { key: Tab; label: string }[] = [
        { key: 'image', label: 'Photos' },
        { key: 'voice', label: 'Videos' },
        { key: 'file', label: 'Files' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
            {/* Tab bar */}
            <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[
                            styles.tab,
                            activeTab === tab.key && {
                                borderBottomColor: colors.primary,
                                borderBottomWidth: 2,
                            },
                        ]}
                        onPress={() => switchTab(tab.key)}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[
                                styles.tabLabel,
                                { color: activeTab === tab.key ? colors.primary : colors.gray500 },
                            ]}
                        >
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content */}
            {activeTab === 'image' ? (
                <MediaGrid
                    items={items}
                    onPress={(item, index) => openFullscreen(item, index)}
                    onEndReached={onEndReached}
                    emptyText="No photos shared yet"
                />
            ) : activeTab === 'voice' ? (
                // Voice messages as a list
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id}
                    onEndReached={onEndReached}
                    onEndReachedThreshold={0.5}
                    contentContainerStyle={items.length === 0 ? styles.emptyContainer : undefined}
                    ListEmptyComponent={
                        !loading ? (
                            <View style={styles.empty}>
                                <Text style={[styles.emptyText, { color: colors.gray400 }]}>
                                    No voice messages
                                </Text>
                            </View>
                        ) : null
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.voiceRow, { borderBottomColor: colors.border }]}
                            onLongPress={() => showActionSheet(item)}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name="mic"
                                size={24}
                                color={colors.primary}
                                style={styles.voiceIcon}
                            />
                            <View style={styles.voiceInfo}>
                                <Text style={[styles.voiceLabel, { color: colors.dark }]}>
                                    Voice message
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            ) : activeTab === 'file' ? (
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id}
                    onEndReached={onEndReached}
                    onEndReachedThreshold={0.5}
                    ListEmptyComponent={
                        !loading ? (
                            <View style={styles.empty}>
                                <Text style={[styles.emptyText, { color: colors.gray400 }]}>
                                    No files shared yet
                                </Text>
                            </View>
                        ) : null
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.fileRow, { borderBottomColor: colors.border }]}
                            onLongPress={() => showActionSheet(item)}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name="document-outline"
                                size={28}
                                color={colors.primary}
                                style={styles.fileIcon}
                            />
                            <View style={styles.fileInfo}>
                                <Text
                                    style={[styles.fileName, { color: colors.dark }]}
                                    numberOfLines={1}
                                >
                                    {item.mediaName ?? 'File'}
                                </Text>
                                {item.mediaSize != null && (
                                    <Text style={[styles.fileSize, { color: colors.gray400 }]}>
                                        {formatBytes(item.mediaSize)}
                                    </Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    )}
                />
            ) : null}

            {loading && <ActivityIndicator style={styles.loader} color={colors.primary} />}

            <MediaFullscreenViewer
                items={items.filter((i) => i.type === 'image')}
                initialIndex={viewerIndex}
                visible={viewerVisible}
                onClose={() => setViewerVisible(false)}
            />

            {forwardItem && (
                <ForwardModal
                    visible={true}
                    message={{
                        id: forwardItem.id,
                        localId: forwardItem.id,
                        syncStatus: 'sent',
                        conversationId: forwardItem.conversationId,
                        senderId: forwardItem.senderId,
                        type: forwardItem.type,
                        content: null,
                        mediaUrl: forwardItem.mediaUrl,
                        mediaName: forwardItem.mediaName,
                        mediaSize: forwardItem.mediaSize,
                        mediaDuration: null,
                        replyToId: null,
                        forwardedFromId: null,
                        isForwarded: false,
                        editedAt: null,
                        deletedForEveryone: false,
                        createdAt: new Date(forwardItem.createdAt).toISOString(),
                        reactions: [],
                        replyTo: null,
                        status: null,
                    }}
                    onClose={() => setForwardItem(null)}
                    onForward={async (targetConversationId) => {
                        try {
                            await api.post(
                                `/chat/conversations/${targetConversationId}/messages/forward`,
                                {
                                    messageId: forwardItem.id,
                                },
                            );
                            showToast('success', 'Message forwarded');
                            setForwardItem(null);
                        } catch (err) {
                            showToast('error', 'Failed to forward');
                        }
                    }}
                    excludeConversationId={conversationId}
                />
            )}
        </View>
    );
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
    },
    tabLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    fileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    fileIcon: {
        marginRight: 12,
    },
    fileInfo: {
        flex: 1,
    },
    fileName: {
        fontSize: 14,
        fontWeight: '500',
    },
    fileSize: {
        fontSize: 12,
        marginTop: 2,
    },
    voiceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    voiceIcon: {
        marginRight: 12,
    },
    voiceInfo: {
        flex: 1,
    },
    voiceLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    voiceDuration: {
        fontSize: 12,
        marginTop: 2,
    },
    emptyContainer: {
        flex: 1,
    },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyText: {
        fontSize: 15,
    },
    loader: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
    },
});
