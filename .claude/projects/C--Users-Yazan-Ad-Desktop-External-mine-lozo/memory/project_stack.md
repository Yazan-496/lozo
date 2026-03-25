---
name: LoZo Final Tech Stack
description: All service selections for the LoZo messenger clone — hosting, DB, storage, realtime, auth, push
type: project
---

Final stack decisions made during Module 1 (Service Selection):

- **Backend hosting**: Koyeb (free tier, French company, Syria-safe)
- **Database**: Supabase PostgreSQL (free tier, hosted 24/7)
- **File storage**: Supabase Storage (free tier, 1GB)
- **ORM**: Drizzle (lightweight, SQL-like, TypeScript-first)
- **Realtime**: Socket.IO (runs on Koyeb, single instance)
- **Auth**: Custom JWT (username + password, no email/phone verification)
- **Push notifications**: OneSignal (deferred, free tier, add after core messaging works)
- **Local DB**: SQLite (messages/conversations) + MMKV (tokens/preferences)
- **Frontend**: React Native with Expo
- **Optional**: Cloudflare DNS/CDN in front of Koyeb

**Why:** ~10 users max, all services must be free and accessible from Syria without VPN.
**How to apply:** No Firebase. No paid services. Prefer non-US companies where possible.
