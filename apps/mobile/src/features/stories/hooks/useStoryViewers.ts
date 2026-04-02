import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../shared/services/api';
import type { StoryView } from '../../../shared/types';

export function useStoryViewers(storyId: string) {
  const [viewers, setViewers] = useState<StoryView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadViewers = useCallback(async () => {
    if (!storyId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<StoryView[]>(`/stories/${storyId}/viewers`);
      setViewers(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load viewers');
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    void loadViewers();
  }, [loadViewers]);

  return {
    viewers,
    loading,
    error,
    loadViewers,
  };
}
