import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { Story, User, UserStories } from '../../shared/types';
import { StoryBubble } from './StoryBubble';

interface Props {
  userStories: UserStories[];
  myStories: Story[];
  currentUser: User | null;
  onStoryPress: (index: number) => void;
  onAddPress: () => void;
  onMyStoryPress: () => void;
}

export function StoriesRow({
  userStories,
  myStories,
  currentUser,
  onStoryPress,
  onAddPress,
  onMyStoryPress,
}: Props) {
  const ordered = useMemo(
    () => {
      const sorted = [...userStories].sort((a, b) => {
        if (a.hasUnviewed !== b.hasUnviewed) return a.hasUnviewed ? -1 : 1;
        return new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime();
      });
      return sorted;
    },
    [userStories],
  );

  if (!currentUser) return null;

  return (
    <View style={styles.wrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
        <StoryBubble
          user={{
            id: currentUser.id,
            displayName: currentUser.displayName,
            avatarUrl: currentUser.avatarUrl,
            avatarColor: currentUser.avatarColor,
          }}
          hasUnviewed={false}
          isOwn
          hasStory={myStories.length > 0}
          onPress={myStories.length > 0 ? onMyStoryPress : onAddPress}
        />

        {ordered.map((group, index) => (
          <StoryBubble
            key={group.user.id}
            user={group.user}
            hasUnviewed={group.hasUnviewed}
            isOwn={false}
            hasStory
            onPress={() => onStoryPress(index)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 12,
  },
  content: {
    paddingHorizontal: 16,
    gap: 12,
  },
});
