import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../../shared/services/api';
import type { Story, UserStories } from '../../../shared/types';
import {
    cacheStory,
    clearExpiredCache,
    getCachedStories,
    getViewStatus,
    markStoryViewed,
} from '../../../shared/db/stories.db.ts';
import { getSocket } from '../../../shared/services/socket';

function mapCachedToUserStories(rows: Awaited<ReturnType<typeof getCachedStories>>): UserStories[] {
    const grouped = new Map<string, UserStories>();
    for (const row of rows) {
        const story: Story = {
            id: row.id,
            userId: row.user_id,
            user: {
                id: row.user_id,
                displayName: row.user_display_name,
                avatarUrl: row.user_avatar_url,
                avatarColor: row.user_avatar_color,
            },
            mediaUrl: row.media_local_path ?? row.media_url,
            mediaType: row.media_type,
            mediaDuration: row.media_duration,
            thumbnailUrl: null,
            caption: row.caption,
            createdAt: row.created_at,
            expiresAt: row.expires_at,
            viewCount: 0,
            isViewed: !!row.viewed_at,
        };

        const existing = grouped.get(row.user_id);
        if (!existing) {
            grouped.set(row.user_id, {
                user: story.user,
                stories: [story],
                hasUnviewed: !story.isViewed,
                latestAt: story.createdAt,
            });
        } else {
            existing.stories.push(story);
            existing.hasUnviewed = existing.hasUnviewed || !story.isViewed;
            if (new Date(existing.latestAt) < new Date(story.createdAt)) {
                existing.latestAt = story.createdAt;
            }
        }
    }
    return Array.from(grouped.values());
}

export function useStories() {
    const [userStories, setUserStories] = useState<UserStories[]>([]);
    const [myStories, setMyStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const hydrateFromCache = useCallback(async () => {
        const rows = await getCachedStories();
        setUserStories(mapCachedToUserStories(rows));
    }, []);

    const loadStories = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            await clearExpiredCache();
            const [contactsRes, mineRes] = await Promise.all([
                api.get<UserStories[]>('/stories'),
                api.get<Story[]>('/stories/mine'),
            ]);

            const normalized = await Promise.all(
                contactsRes.data.map(async (group) => {
                    const stories = await Promise.all(
                        group.stories.map(async (story) => {
                            const localViewed = await getViewStatus(story.id);
                            return { ...story, isViewed: story.isViewed || localViewed };
                        }),
                    );
                    return {
                        ...group,
                        stories,
                        hasUnviewed: stories.some((story) => !story.isViewed),
                    };
                }),
            );

            for (const group of normalized) {
                for (const story of group.stories) {
                    await cacheStory(story);
                }
            }

            setUserStories(normalized);
            setMyStories(mineRes.data);
        } catch (e: any) {
            setError(e?.message ?? 'Failed to load stories');
            await hydrateFromCache();
        } finally {
            setLoading(false);
        }
    }, [hydrateFromCache]);

    const markViewed = useCallback(async (storyId: string) => {
        await markStoryViewed(storyId);
        setUserStories((prev) =>
            prev.map((group) => {
                const stories = group.stories.map((story) =>
                    story.id === storyId ? { ...story, isViewed: true } : story,
                );
                return {
                    ...group,
                    stories,
                    hasUnviewed: stories.some((story) => !story.isViewed),
                };
            }),
        );
    }, []);

    const refreshStories = useCallback(async () => {
        await loadStories();
    }, [loadStories]);

    useEffect(() => {
        void hydrateFromCache();
        void loadStories();
    }, [hydrateFromCache, loadStories]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onStoryNew = () => {
      void loadStories();
    };
    const onStoryDeleted = () => {
      void loadStories();
    };
    socket.on('story:new', onStoryNew);
    socket.on('story:deleted', onStoryDeleted);
    return () => {
      socket.off('story:new', onStoryNew);
      socket.off('story:deleted', onStoryDeleted);
    };
  }, [loadStories]);

    const sortedStories = useMemo(
        () =>
            [...userStories].sort((a, b) => {
                if (a.hasUnviewed !== b.hasUnviewed) return a.hasUnviewed ? -1 : 1;
                return new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime();
            }),
        [userStories],
    );

    return {
        userStories: sortedStories,
        myStories,
        loading,
        error,
        loadStories,
        refreshStories,
        markViewed,
    };
}
