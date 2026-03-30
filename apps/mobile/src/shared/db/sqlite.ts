import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

const MIGRATION = `
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    other_user TEXT NOT NULL,
    last_message TEXT,
    unread_count INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS messages (
    local_id TEXT PRIMARY KEY,
    server_id TEXT UNIQUE,
    conversation_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text',
    content TEXT,
    media_url TEXT,
    media_name TEXT,
    media_size INTEGER,
    media_duration REAL,
    reply_to_id TEXT,
    is_forwarded INTEGER NOT NULL DEFAULT 0,
    forwarded_from_id TEXT,
    edited_at TEXT,
    deleted_for_everyone INTEGER NOT NULL DEFAULT 0,
    sync_status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,
    server_created_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_messages_conversation
    ON messages (conversation_id, created_at DESC);
  CREATE TABLE IF NOT EXISTS outbox (
    local_id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    payload TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TEXT,
    status TEXT NOT NULL DEFAULT 'queued',
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_outbox_conversation
    ON outbox (conversation_id, created_at ASC);
`;

export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync('lozo.db');
  await db.execAsync(MIGRATION);
}

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) throw new Error('SQLite not initialized — call initDatabase() first');
  return db;
}
