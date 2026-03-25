## Project: LoZo — Messenger Clone (React Native)

### Stack

- Frontend: React Native (Expo or bare)
- Backend: Node.js + Express
- Realtime: Socket.IO (WebSockets)
- DB: PostgreSQL or MongoDB
- Local DB: SQLite / MMKV (offline-first)
- Push: OneSignal
- No Firebase — Syria-compatible services only

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
