import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../shared/hooks/useThemeColors';
import { useToast } from '../../shared/components/Toast';
import { useCreateStory } from './hooks/useCreateStory';
import { STORY_CAPTION_MAX_LENGTH } from './constants';

export function CreateStoryScreen({ navigation }: any) {
  const colors = useThemeColors();
  const { showToast } = useToast();
  const {
    mediaUri,
    caption,
    isUploading,
    error,
    canPost,
    selectFromGallery,
    capturePhoto,
    captureVideo,
    setCaption,
    uploadAndPost,
  } = useCreateStory(() => {
    showToast('success', 'Story posted');
    navigation.goBack();
  });

  async function onPost() {
    try {
      await uploadAndPost();
    } catch {
      showToast('error', 'Failed to post story');
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="close" size={24} color={colors.dark} />
        </Pressable>
        <Text style={[styles.title, { color: colors.dark }]}>Create Story</Text>
        <Pressable
          onPress={onPost}
          disabled={!canPost}
          style={[styles.postButton, { backgroundColor: canPost ? colors.primary : colors.gray300 }]}
        >
          <Text style={[styles.postText, { color: colors.white }]}>{isUploading ? 'Posting...' : 'Post'}</Text>
        </Pressable>
      </View>

      <View style={[styles.preview, { backgroundColor: colors.bgSecondary }]}>
        {mediaUri ? (
          <Image source={{ uri: mediaUri }} style={styles.previewImage} resizeMode="contain" />
        ) : (
          <View style={styles.actions}>
            <Pressable style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={capturePhoto}>
              <Text style={[styles.actionText, { color: colors.white }]}>Camera Photo</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, { backgroundColor: colors.gray600 }]} onPress={captureVideo}>
              <Text style={[styles.actionText, { color: colors.white }]}>Camera Video</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, { backgroundColor: colors.gray500 }]} onPress={selectFromGallery}>
              <Text style={[styles.actionText, { color: colors.white }]}>Gallery</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.captionBlock}>
        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder="Add a caption..."
          placeholderTextColor={colors.gray400}
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.dark, backgroundColor: colors.bgSecondary },
          ]}
          multiline
          maxLength={STORY_CAPTION_MAX_LENGTH}
        />
        <Text style={[styles.counter, { color: colors.gray400 }]}>
          {caption.length}/{STORY_CAPTION_MAX_LENGTH}
        </Text>
        {error ? <Text style={[styles.error, { color: colors.red }]}>{error}</Text> : null}
      </View>

      {isUploading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.white} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
  },
  iconButton: { padding: 4 },
  title: { fontSize: 18, fontWeight: '700' },
  postButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  postText: { fontSize: 14, fontWeight: '700' },
  preview: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: { width: '100%', height: '100%' },
  actions: { gap: 10, width: '70%' },
  actionBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  actionText: { fontSize: 14, fontWeight: '700' },
  captionBlock: { paddingHorizontal: 16, paddingBottom: 16 },
  input: {
    minHeight: 72,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  counter: { alignSelf: 'flex-end', marginTop: 6, fontSize: 12 },
  error: { marginTop: 6, fontSize: 13 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
