import { BUCKETS, supabase } from '../../shared/services/supabase';
import { cleanupExpiredStories, mapMediaUrlToStoragePath } from './stories.service';

let timer: NodeJS.Timeout | null = null;

export function startStoriesCleanupJob() {
  if (timer) return;
  timer = setInterval(async () => {
    try {
      const expired = await cleanupExpiredStories();
      for (const row of expired) {
        const path = await mapMediaUrlToStoragePath(row.mediaUrl);
        if (path) {
          await supabase.storage.from(BUCKETS.STORIES).remove([path]);
        }
      }
    } catch {
    }
  }, 60 * 60 * 1000);
}
