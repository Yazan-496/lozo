import { getDb } from './sqlite';
import type { LinkPreview } from '../types';

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function getCachedPreview(url: string): Promise<LinkPreview | null> {
  const db = getDb();
  const row = await db.getFirstAsync<{
    url: string;
    title: string | null;
    description: string | null;
    image_url: string | null;
    fetched_at: string;
  }>('SELECT * FROM url_previews WHERE url = ?', [url]);

  if (!row) return null;

  // Expire after 24h
  const age = Date.now() - new Date(row.fetched_at).getTime();
  if (age > TTL_MS) {
    await db.runAsync('DELETE FROM url_previews WHERE url = ?', [url]);
    return null;
  }

  return {
    url: row.url,
    title: row.title,
    description: row.description,
    image: row.image_url,
  };
}

export async function savePreview(preview: LinkPreview): Promise<void> {
  const db = getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO url_previews (url, title, description, image_url, fetched_at)
     VALUES (?, ?, ?, ?, ?)`,
    [preview.url, preview.title, preview.description, preview.image, new Date().toISOString()],
  );
}
