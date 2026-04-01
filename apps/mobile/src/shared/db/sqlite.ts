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
  CREATE TABLE IF NOT EXISTS url_previews (
    url TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    image_url TEXT,
    fetched_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS drafts (
    conversation_id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
`;

/** Create FTS5 virtual table, triggers, and backfill existing messages (idempotent). */
async function initFts(database: SQLite.SQLiteDatabase): Promise<void> {
    await database.execAsync(`
    CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
      message_id UNINDEXED,
      conversation_id UNINDEXED,
      content,
      tokenize = 'unicode61'
    );
    CREATE TRIGGER IF NOT EXISTS messages_fts_insert
      AFTER INSERT ON messages
      WHEN NEW.content IS NOT NULL
      BEGIN
        INSERT INTO messages_fts(message_id, conversation_id, content)
        VALUES (NEW.local_id, NEW.conversation_id, NEW.content);
      END;
    CREATE TRIGGER IF NOT EXISTS messages_fts_delete
      AFTER DELETE ON messages
      BEGIN
        DELETE FROM messages_fts WHERE message_id = OLD.local_id;
      END;
    CREATE TRIGGER IF NOT EXISTS messages_fts_update
      AFTER UPDATE ON messages
      WHEN NEW.content IS NOT NULL AND NEW.content != OLD.content
      BEGIN
        DELETE FROM messages_fts WHERE message_id = OLD.local_id;
        INSERT INTO messages_fts(message_id, conversation_id, content)
        VALUES (NEW.local_id, NEW.conversation_id, NEW.content);
      END;
  `);

    // One-time backfill: populate FTS for messages inserted before this migration
    const row = await database.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM messages_fts',
    );
    if ((row?.count ?? 0) === 0) {
        await database.execAsync(`
      INSERT INTO messages_fts(message_id, conversation_id, content)
      SELECT local_id, conversation_id, content
      FROM messages
      WHERE content IS NOT NULL;
    `);
    }
}

export async function initDatabase(): Promise<void> {
    db = await SQLite.openDatabaseAsync('lozo.db');
    await db.execAsync(MIGRATION);
    await initFts(db);
    console.log('[SQLite] Database initialized with FTS5');
}

export function getDb(): SQLite.SQLiteDatabase {
    if (!db) throw new Error('SQLite not initialized — call initDatabase() first');
    return db;
}
