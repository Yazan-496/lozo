# Data Model: Media & UX Features (15-media-ux-features)

---

## Existing Tables (unchanged)

### messages
```sql
id TEXT PRIMARY KEY
conversation_id TEXT NOT NULL
sender_id TEXT NOT NULL
type TEXT NOT NULL  -- 'text' | 'image' | 'voice' | 'file'
content TEXT
media_url TEXT
media_name TEXT
media_size INTEGER
media_duration INTEGER
status TEXT          -- 'sent' | 'delivered' | 'seen'
reply_to_id TEXT
local_id TEXT
created_at INTEGER
updated_at INTEGER
```

---

## New Tables

### messages_fts (Feature 5 — FTS5 virtual table)
```sql
CREATE VIRTUAL TABLE messages_fts USING fts5(
  message_id UNINDEXED,
  conversation_id UNINDEXED,
  content,
  tokenize = 'unicode61'
);
```

- Populated by triggers on `messages` INSERT/DELETE
- `message_id` and `conversation_id` stored UNINDEXED (for lookup, not search)
- `content` is the full-text indexed column (covers message text + media captions)

**Triggers:**
```sql
-- INSERT trigger
CREATE TRIGGER messages_fts_insert AFTER INSERT ON messages
WHEN NEW.content IS NOT NULL
BEGIN
  INSERT INTO messages_fts(message_id, conversation_id, content)
  VALUES (NEW.id, NEW.conversation_id, NEW.content);
END;

-- DELETE trigger
CREATE TRIGGER messages_fts_delete AFTER DELETE ON messages
BEGIN
  DELETE FROM messages_fts WHERE message_id = OLD.id;
END;
```

### drafts (Feature 7)
```sql
CREATE TABLE IF NOT EXISTS drafts (
  conversation_id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
```

- One row per conversation
- Upserted on every debounced save
- Deleted on message send

---

## TypeScript Interfaces

```typescript
// Feature 5
interface SearchResult {
  messageId: string;
  conversationId: string;
  conversationName: string;
  conversationAvatar: string | null;
  content: string;
  highlight: string;       // snippet with matched text wrapped
  createdAt: number;
}

// Feature 6
interface MediaItem {
  id: string;
  conversationId: string;
  type: 'image' | 'voice' | 'file';
  mediaUrl: string;
  mediaName: string | null;
  mediaSize: number | null;
  createdAt: number;
  senderId: string;
}

// Feature 7
interface Draft {
  conversationId: string;
  text: string;
  updatedAt: number;
}
```

---

## DB Function Additions

### conversations.db.ts (existing file)
```typescript
// Feature 7 — Drafts
saveDraft(conversationId: string, text: string): void
getDraft(conversationId: string): string | null
clearDraft(conversationId: string): void
getAllDrafts(): Record<string, string>  // conversationId → text
```

### New file: search.db.ts
```typescript
// Feature 5 — FTS5 Search
searchMessages(query: string, limit?: number): SearchResult[]
initFts(): void  // create virtual table + triggers (called in db init)
```

### New file: media.db.ts
```typescript
// Feature 6 — Media Gallery
getMediaByType(
  conversationId: string,
  type: 'image' | 'voice' | 'file',
  limit: number,
  offset: number
): MediaItem[]
```
