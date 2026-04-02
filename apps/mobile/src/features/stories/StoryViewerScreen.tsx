import React from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../shared/hooks/useThemeColors';
import { StoryProgressBar } from './StoryProgressBar';
import { useStoryViewer } from './hooks/useStoryViewer';
import { StoryReplyInput } from './StoryReplyInput';
import { useAuthStore } from '../../shared/stores/auth';
import { useToast } from '../../shared/components/Toast';
import { ViewersListSheet } from './ViewersListSheet';
export function StoryViewerScreen({ route, navigation }: any) {
  const colors = useThemeColors();
  const authedUser = useAuthStore((s) => s.user);
  const { showToast } = useToast();
  const [showViewers, setShowViewers] = React.useState(false);
  const { userStories, startIndex } = route.params;
  const {
    currentStory,
    currentUser: viewerUserStories,
    currentStoryIndex,
    progress,
    goNext,
    goPrev,
    pause,
    resume,
  } = useStoryViewer({
    userStories,
    startUserIndex: startIndex,
    onComplete: () => navigation.goBack(),
  });

  if (!currentStory || !viewerUserStories) {
    return null;
  }

  const isOwnStory = authedUser?.id === viewerUserStories.user.id;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.top}>
        <StoryProgressBar
          totalSegments={viewerUserStories.stories.length}
          currentIndex={currentStoryIndex}
          progress={progress}
        />
        <View style={styles.userRow}>
          <Text style={[styles.name, { color: colors.white }]}>{viewerUserStories.user.displayName}</Text>
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={colors.white} />
          </Pressable>
        </View>
      </View>

      <Pressable
        style={styles.touchLayer}
        onPressIn={pause}
        onPressOut={resume}
        onPress={(e) => {
          const width = e.nativeEvent.locationX;
          const total = e.nativeEvent.pageX;
          if (width < total / 3) goPrev();
          else goNext();
        }}
      >
        <Image source={{ uri: currentStory.mediaUrl }} style={styles.media} resizeMode="contain" />
      </Pressable>

      {currentStory.caption ? (
        <View style={styles.captionWrap}>
          <Text style={[styles.caption, { color: colors.white }]}>{currentStory.caption}</Text>
        </View>
      ) : null}

      {isOwnStory ? (
        <Pressable style={styles.viewsPill} onPress={() => setShowViewers(true)}>
          <Ionicons name="eye-outline" size={16} color={colors.white} />
          <Text style={[styles.viewsText, { color: colors.white }]}>
            {currentStory.viewCount} views
          </Text>
        </Pressable>
      ) : null}

      {!isOwnStory ? (
        <StoryReplyInput
          storyId={currentStory.id}
          storyOwnerId={viewerUserStories.user.id}
          storyThumbnailUrl={currentStory.thumbnailUrl}
          onSent={() => showToast('success', 'Reply sent')}
        />
      ) : null}

      <ViewersListSheet
        storyId={currentStory.id}
        visible={showViewers}
        onClose={() => setShowViewers(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  top: {
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 12,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
  },
  touchLayer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  captionWrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 24,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
  },
  viewsPill: {
    position: 'absolute',
    left: 12,
    bottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  viewsText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
