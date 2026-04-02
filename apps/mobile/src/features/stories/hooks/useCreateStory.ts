import { useMemo, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { BASE_URL, api } from '../../../shared/services/api';
import { useAuthStore } from '../../../shared/stores/auth';
import { STORY_CAPTION_MAX_LENGTH, STORY_MAX_VIDEO_DURATION } from '../constants';
import type { StoryMediaType } from '../../../shared/types';

export function useCreateStory(onPosted?: () => void) {
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<StoryMediaType | null>(null);
  const [mediaDuration, setMediaDuration] = useState<number | null>(null);
  const [caption, setCaptionState] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canPost = useMemo(
    () => !!mediaUri && !!mediaType && !isUploading && caption.length <= STORY_CAPTION_MAX_LENGTH,
    [caption.length, isUploading, mediaType, mediaUri],
  );

  function validateVideoDuration(durationMs?: number | null): boolean {
    if (!durationMs) return true;
    return durationMs / 1000 <= STORY_MAX_VIDEO_DURATION;
  }

  function mapAsset(asset: ImagePicker.ImagePickerAsset) {
    const type: StoryMediaType = asset.type === 'video' ? 'video' : 'photo';
    const durationSec = type === 'video' && asset.duration ? Math.round(asset.duration / 1000) : null;
    setMediaUri(asset.uri);
    setMediaType(type);
    setMediaDuration(durationSec);
    setError(null);
  }

  async function selectFromGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Gallery permission is required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.9,
      videoMaxDuration: STORY_MAX_VIDEO_DURATION,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const durationMs = asset.duration ?? null;
    if (asset.type === 'video' && !validateVideoDuration(durationMs)) {
      setError('Video duration cannot exceed 30 seconds');
      return;
    }
    mapAsset(asset);
  }

  async function capturePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Camera permission is required');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;
    mapAsset(result.assets[0]);
  }

  async function captureVideo() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Camera permission is required');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      quality: 0.8,
      videoMaxDuration: STORY_MAX_VIDEO_DURATION,
    });
    if (result.canceled || !result.assets[0]) return;
    const durationMs = result.assets[0].duration ?? null;
    if (!validateVideoDuration(durationMs)) {
      setError('Video duration cannot exceed 30 seconds');
      return;
    }
    mapAsset(result.assets[0]);
  }

  function setCaption(text: string) {
    if (text.length <= STORY_CAPTION_MAX_LENGTH) {
      setCaptionState(text);
    }
  }

  async function uploadAndPost() {
    if (!mediaUri || !mediaType || !canPost) return;
    setIsUploading(true);
    setError(null);
    try {
      const token = useAuthStore.getState().accessToken;
      const formData = new FormData();
      formData.append('file', {
        uri: mediaUri,
        name: `${Date.now()}${mediaType === 'video' ? '.mp4' : '.jpg'}`,
        type: mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
      } as any);

      const uploadResponse = await fetch(`${BASE_URL}/api/stories/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!uploadResponse.ok) {
        const text = await uploadResponse.text();
        throw new Error(text || 'Upload failed');
      }
      const uploaded = await uploadResponse.json();
      await api.post('/stories', {
        mediaUrl: uploaded.mediaUrl,
        thumbnailUrl: uploaded.thumbnailUrl ?? null,
        mediaType,
        mediaDuration,
        caption: caption.trim() || null,
      });

      onPosted?.();
      setMediaUri(null);
      setMediaType(null);
      setMediaDuration(null);
      setCaptionState('');
    } catch (e: any) {
      setError(e?.message ?? 'Failed to post story');
      throw e;
    } finally {
      setIsUploading(false);
    }
  }

  return {
    mediaUri,
    mediaType,
    mediaDuration,
    caption,
    isUploading,
    error,
    canPost,
    selectFromGallery,
    capturePhoto,
    captureVideo,
    setCaption,
    uploadAndPost,
  };
}
