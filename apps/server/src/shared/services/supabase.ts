import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

// Bucket names
export const BUCKETS = {
  AVATARS: 'avatars',
  CHAT_MEDIA: 'chat-media',
  STORIES: 'stories',
} as const;

// Initialize storage buckets (run once on server start)
export async function initStorage() {
  for (const bucket of Object.values(BUCKETS)) {
    const { error } = await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: 50 * 1024 * 1024, // 50MB max
    });

    // Ignore "already exists" error
    if (error && !error.message.includes('already exists')) {
      console.error(`Failed to create bucket "${bucket}":`, error.message);
    }
  }
}
