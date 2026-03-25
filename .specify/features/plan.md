# LoZo — Master Implementation Plan

**Created**: 2026-03-25
**Total Specs**: 12
**Approach**: One spec at a time, specify → clarify → plan → implement

---

## Feature Specs (in order)

| # | Feature | Status | Spec |
|---|---------|--------|------|
| 01 | UX Foundation — Icons, splash, toast, skeletons, error boundary, cleanup | Spec Ready | [spec.md](01-ux-foundation/spec.md) |
| 02 | Message Actions — Long-press menu, reply, edit, delete, forward, copy | Pending | [spec.md](02-message-actions/spec.md) |
| 03 | Message Reactions — Emoji picker, reaction display, remove | Pending | [spec.md](03-message-reactions/spec.md) |
| 04 | Media: Images — Gallery, camera, preview, send, viewer, download | Pending | [spec.md](04-media-images/spec.md) |
| 05 | Media: Voice — Record, waveform, playback, send | Pending | [spec.md](05-media-voice/spec.md) |
| 06 | Media: Files — Document picker, send, display, download | Pending | [spec.md](06-media-files/spec.md) |
| 07 | Presence & Status — Animated typing, last seen, read receipts | Pending | [spec.md](07-presence-status/spec.md) |
| 08 | Profile & Avatar — Upload avatar, change password, about | Pending | [spec.md](08-profile-avatar/spec.md) |
| 09 | Contacts Enhancement — Profile view, nickname, block, mute | Pending | [spec.md](09-contacts-enhancement/spec.md) |
| 10 | Offline-First — SQLite, message queue, sync, network detection | Pending | [spec.md](10-offline-first/spec.md) |
| 11 | Server Quality — Zod validation, retry logic, strict TypeScript | Pending | [spec.md](11-server-quality/spec.md) |
| 12 | Deployment — Koyeb, production URL, HTTPS, app assets | Pending | [spec.md](12-deployment/spec.md) |

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-25 | Tab icons match Messenger exactly | User preference |
| 2026-03-25 | Status: "Active now" / "Active Xm ago", never "Offline" | Messenger behavior |
| 2026-03-25 | Splash: Logo circle + "LoZo" text on white background | User confirmed |
| 2026-03-25 | Loading: Animated shimmer (Facebook-style) | User confirmed |
| 2026-03-25 | Toasts: Top of screen | User confirmed |

---

## Current State Summary

### Server (apps/server/) — Mostly Complete
- Auth: register, login, refresh, profile, password ✅
- Contacts: CRUD, search, block, mute, nickname ✅
- Chat: messages, conversations, reactions, edit, delete ✅
- Socket.IO: real-time events for all chat operations ✅
- Upload: chat media + avatar via Supabase Storage ✅
- Missing: Zod validation, tests, deployment

### Mobile (apps/mobile/) — UI Built, Features Incomplete
- Auth screens: login, register ✅
- Chat screen: send/receive text, typing, status ✅
- Contacts screen: search, add, accept/reject ✅
- Profile screen: view/edit name+bio, logout ✅
- Missing: message actions, media UI, offline storage, icons, skeletons, toasts, avatar upload, contact profile, animations
