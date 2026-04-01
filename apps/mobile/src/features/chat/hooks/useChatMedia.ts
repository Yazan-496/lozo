import { useState, useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import {
    useAudioRecorder,
    useAudioPlayer,
    useAudioPlayerStatus,
    AudioModule,
    RecordingPresets,
} from 'expo-audio';
import { useToast } from '../../../shared/components/Toast';
import { api, BASE_URL } from '../../../shared/services/api';
import { useAuthStore } from '../../../shared/stores/auth';
import { formatDuration } from '../../../shared/utils/media';
import type { Message, User } from '../../../shared/types';

interface UseChatMediaOptions {
    conversationId: string;
    currentUser: User;
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    setLocalStatusMap: React.Dispatch<React.SetStateAction<Record<string, 'pending' | 'sending' | 'failed'>>>;
}

export function useChatMedia({ conversationId, currentUser, setMessages, setLocalStatusMap }: UseChatMediaOptions) {
    const { showToast } = useToast();

    const [showAttachmentSheet, setShowAttachmentSheet] = useState(false);
    const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
    const [isSendingMedia, setIsSendingMedia] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
    const [viewingImageMeta, setViewingImageMeta] = useState<{
        name: string;
        avatarUrl: string | null;
        color: string;
        sentAt: string;
        isMe: boolean;
    } | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
    const [uploadProgressMap, setUploadProgressMap] = useState<Record<string, number>>({});

    const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const audioPlayer = useAudioPlayer(null);
    const playerStatus = useAudioPlayerStatus(audioPlayer);
    const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const recordingStartRef = useRef<number>(0);

    // Upload helper — fetch handles RN FormData file objects more reliably than axios
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

    // Send image (with compression for >500KB non-GIF images)
    async function handleSendImage() {
        if (!previewImageUri) return;
        setIsSendingMedia(true);
        const tempId = `temp_${Date.now()}`;
        const capturedUri = previewImageUri;
        const tempMsg: Message = {
            id: tempId,
            conversationId,
            senderId: currentUser.id,
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
            let uploadUri = capturedUri;
            const isGif = capturedUri.toLowerCase().endsWith('.gif');

            if (!isGif) {
                try {
                    const info = await FileSystem.getInfoAsync(capturedUri, { size: true });
                    const fileSize = (info as any).size ?? 0;
                    if (fileSize > 500 * 1024) {
                        // EXIF orientation preserved by default (no rotate action applied)
                        setIsCompressing(true);
                        const compressed = await ImageManipulator.manipulateAsync(
                            capturedUri,
                            [{ resize: { width: 1920 } }],
                            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
                        );
                        const compressedInfo = await FileSystem.getInfoAsync(compressed.uri, {
                            size: true,
                        });
                        // Only use compressed if it's actually smaller
                        if ((compressedInfo as any).size < fileSize) {
                            uploadUri = compressed.uri;
                        }
                        setIsCompressing(false);
                    }
                } catch {
                    // Compression failed — upload original and notify user
                    setIsCompressing(false);
                    showToast('error', "Couldn't compress, uploading original");
                }
            }

            const url = await uploadMedia(uploadUri, 'image/jpeg', `image_${Date.now()}.jpg`);
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
        } catch {
            showToast('error', 'Failed to send image');
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
        } finally {
            setIsSendingMedia(false);
            setIsCompressing(false);
        }
    }

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
            localId: tempId,
            syncStatus: 'pending',
            conversationId,
            senderId: currentUser.id,
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
            status: null,
        };
        setMessages((prev) => [tempMsg, ...prev]);
        setLocalStatusMap((prev) => ({ ...prev, [tempId]: 'sending' }));
        
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
            setLocalStatusMap((prev) => {
                const n = { ...prev };
                delete n[tempId];
                return n;
            });
        } catch {
            showToast('error', 'Failed to send voice message');
            setLocalStatusMap((prev) => ({ ...prev, [tempId]: 'failed' }));
        }
    }

    function cancelRecording() {
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        audioRecorder.stop().catch(() => {});
        setIsRecording(false);
        setRecordingDuration(0);
    }

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
            senderId: currentUser.id,
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

    // Derived display value
    const recordingLabel = formatDuration(recordingDuration / 1000);

    return {
        // State
        showAttachmentSheet,
        setShowAttachmentSheet,
        previewImageUri,
        setPreviewImageUri,
        isSendingMedia,
        isCompressing,
        viewingImageUrl,
        setViewingImageUrl,
        viewingImageMeta,
        setViewingImageMeta,
        isRecording,
        recordingDuration,
        recordingLabel,
        playingMessageId,
        setPlayingMessageId,
        uploadProgressMap,
        playerStatus,
        // Handlers
        handlePickImage,
        handleSendImage,
        startRecording,
        stopAndSendRecording,
        cancelRecording,
        handlePlayVoice,
        handlePickFile,
        uploadMedia,
    };
}
