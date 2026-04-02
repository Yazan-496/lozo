import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { api } from '../../../shared/services/api';
import type { Story, UserStories } from '../../../shared/types';
import { STORY_DURATION_PHOTO } from '../constants';
import { markStoryViewed } from '../../../shared/db/stories.db.ts';

interface UseStoryViewerParams {
    userStories: UserStories[];
    startUserIndex?: number;
    onComplete?: () => void;
    onViewed?: (storyId: string) => void;
}

export function useStoryViewer({
    userStories,
    startUserIndex = 0,
    onComplete,
    onViewed,
}: UseStoryViewerParams) {
    const [currentUserIndex, setCurrentUserIndex] = useState(startUserIndex);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const progress = useRef(new Animated.Value(0)).current;
    const animationRef = useRef<Animated.CompositeAnimation | null>(null);
    const viewedSetRef = useRef(new Set<string>());

    const currentUser = userStories[currentUserIndex];
    const currentStory: Story | undefined = currentUser?.stories[currentStoryIndex];

    const isLastStory = useMemo(() => {
        if (!currentUser) return true;
        const isLastUser = currentUserIndex === userStories.length - 1;
        const isLastSegment = currentStoryIndex === currentUser.stories.length - 1;
        return isLastUser && isLastSegment;
    }, [currentStoryIndex, currentUser, currentUserIndex, userStories.length]);

    const recordViewed = useCallback(async () => {
        if (!currentStory) return;
        if (viewedSetRef.current.has(currentStory.id)) return;
        viewedSetRef.current.add(currentStory.id);
        onViewed?.(currentStory.id);
        try {
            await api.post(`/stories/${currentStory.id}/view`);
            await markStoryViewed(currentStory.id);
        } catch {}
    }, [currentStory, onViewed]);

    const goNext = useCallback(() => {
        if (!currentUser) return;
        const hasNextInUser = currentStoryIndex < currentUser.stories.length - 1;
        if (hasNextInUser) {
            setCurrentStoryIndex((prev) => prev + 1);
            return;
        }
        const hasNextUser = currentUserIndex < userStories.length - 1;
        if (hasNextUser) {
            setCurrentUserIndex((prev) => prev + 1);
            setCurrentStoryIndex(0);
            return;
        }
        onComplete?.();
    }, [currentStoryIndex, currentUser, currentUserIndex, onComplete, userStories.length]);

    const goPrev = useCallback(() => {
        if (currentStoryIndex > 0) {
            setCurrentStoryIndex((prev) => prev - 1);
            return;
        }
        if (currentUserIndex > 0) {
            const previousUserIndex = currentUserIndex - 1;
            setCurrentUserIndex(previousUserIndex);
            setCurrentStoryIndex(
                Math.max((userStories[previousUserIndex]?.stories.length ?? 1) - 1, 0),
            );
        }
    }, [currentStoryIndex, currentUserIndex, userStories]);

    const pause = useCallback(() => {
        setIsPaused(true);
        animationRef.current?.stop();
    }, []);

    const resume = useCallback(() => {
        setIsPaused(false);
    }, []);

    useEffect(() => {
        if (!currentStory || isPaused) return;
        void recordViewed();
        progress.setValue(0);
        const durationMs =
            currentStory.mediaType === 'video'
                ? Math.max((currentStory.mediaDuration ?? 1) * 1000, 1000)
                : STORY_DURATION_PHOTO;

        const animation = Animated.timing(progress, {
            toValue: 1,
            duration: durationMs,
            useNativeDriver: false,
        });
        animationRef.current = animation;
        animation.start(({ finished }) => {
            if (finished) goNext();
        });
        return () => {
            animation.stop();
        };
    }, [currentStory, goNext, isPaused, progress, recordViewed]);

    return {
        currentStory,
        currentUser,
        currentUserIndex,
        currentStoryIndex,
        progress,
        goNext,
        goPrev,
        pause,
        resume,
        isPaused,
        isLastStory,
    };
}
