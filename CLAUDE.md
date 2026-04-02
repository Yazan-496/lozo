## Project: LoZo — Messenger Clone (React Native)

### Stack

- Frontend: React Native (Expo)
- Backend: Node.js + Express (hosted on Koyeb)
- Realtime: Socket.IO (single instance on Koyeb)
- DB: PostgreSQL (Supabase, free tier)
- ORM: Drizzle
- File storage: Supabase Storage
- Local DB: SQLite (messages) + MMKV (tokens/prefs)
- Auth: Custom JWT (username + password)
- Push: OneSignal (deferred until core messaging works)
- No Firebase — Syria-compatible services only, all free tier

### Architecture rules

- Offline-first: all messages stored locally first, synced when online
- Message states: sent → delivered → read (track all 3)
- Presence: online, last seen, typing indicator (real-time)
- Relationship system: users cannot chat without a connection

### My coding preferences

- TypeScript always
- Functional components + hooks (no class components)
- Folder structure: feature-based (not type-based)
- Always show file path in code blocks
- Prefer small composable functions
- Write comments only for non-obvious logic

### What I'm building session by session

Tell me which module we're working on each session. Always remind me of the
current module's dependencies before coding.
