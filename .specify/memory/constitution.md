<!--
Sync Impact Report
===================
Version change: N/A → 1.0.0 (initial ratification)
Modified principles: N/A (initial)
Added sections: Mission, 6 Principles, Technology Constraints, Governance
Removed sections: N/A
Templates requiring updates:
  - .specify/templates/constitution-template.md ✅ created
  - .specify/templates/plan-template.md ⚠ pending (not yet created)
  - .specify/templates/spec-template.md ⚠ pending (not yet created)
  - .specify/templates/tasks-template.md ⚠ pending (not yet created)
Follow-up TODOs: Create plan, spec, and tasks templates when needed.
-->

# LoZo Constitution

**Version**: 1.0.0
**Ratified**: 2026-03-25
**Last Amended**: 2026-03-25

---

## Mission

Build a Facebook Messenger clone mobile application (LoZo) using
React Native (Expo) and Node.js that is fully accessible from Syria
without VPN, runs entirely on free-tier services, and delivers a
polished real-time messaging experience for a small user base (~10
users).

---

## Principles

### 1. Syria Accessibility

Every external service, API endpoint, and CDN domain MUST be
reachable from Syria without a VPN. Firebase and any US-sanctioned
service that geo-blocks Syria are prohibited. All selected services
MUST offer a free tier sufficient for ~10 concurrent users.

**Rationale**: The primary user base is in Syria; any blocked service
renders the app unusable.

### 2. Offline-First Messaging

All messages MUST be stored locally before being synced to the
server. The app MUST function for reading cached data when the
device is offline. Message state transitions (sent → delivered →
read) MUST be tracked and reflected in the UI.

**Rationale**: Network reliability in the target region is
inconsistent; the app must remain usable during connectivity gaps.

### 3. TypeScript Everywhere

All code — mobile and server — MUST be written in TypeScript with
strict mode. No `any` types except at API boundaries where external
data is coerced. Functional components and hooks only; no class
components.

**Rationale**: Type safety reduces runtime bugs and enables
confident refactoring across the monorepo.

### 4. Feature-Based Architecture

Code MUST be organized by feature (auth, chat, contacts, profile),
not by type (controllers, models, views). Shared utilities live
under `shared/`. Each feature folder is self-contained with its
routes, services, screens, and types.

**Rationale**: Feature folders scale better, reduce cross-cutting
imports, and make it clear where new code belongs.

### 5. Messenger-Identical UX

The mobile app MUST visually replicate Facebook Messenger's design
language: color palette (#0084FF primary), bubble shapes, avatar
placement, tab bar layout, and interaction patterns. React Native
`StyleSheet` MUST be used for all styling (no NativeWind/Tailwind
in runtime).

**Rationale**: The user expects pixel-level fidelity to Messenger;
deviations are treated as bugs.

### 6. Incremental Module Delivery

Development proceeds session-by-session, one module at a time.
Each module MUST be testable in isolation before moving to the next.
Dependencies between modules MUST be stated at the start of each
session. No feature is shipped half-implemented — complete or defer.

**Rationale**: Session-based development with a single developer
requires clear scope boundaries to avoid sprawl.

---

## Technology Constraints

| Layer            | Choice                        | Constraint                        |
|------------------|-------------------------------|-----------------------------------|
| Frontend         | React Native (Expo, SDK 54)   | MUST run in Expo Go               |
| Backend          | Node.js + Express             | Single server process             |
| Database         | PostgreSQL (Supabase)         | Free tier, connection pooler only |
| ORM              | Drizzle                       | Migrations via drizzle-kit        |
| Realtime         | Socket.IO                     | Single instance, JWT auth         |
| File Storage     | Supabase Storage              | Free tier buckets                 |
| Local Storage    | expo-secure-store (tokens)    | No MMKV (Expo Go incompatible)    |
| Auth             | Custom JWT                    | Username + password only          |
| Hosting          | Koyeb                         | French company, free tier         |
| Push             | OneSignal                     | Deferred until core works         |
| Styling          | React Native StyleSheet       | No NativeWind/Tailwind            |

---

## Governance

### Amendment Process

1. Any principle change MUST be discussed before implementation.
2. Changes to Technology Constraints require testing the replacement
   service for Syria accessibility and free-tier availability.
3. Amendments are recorded in the Sync Impact Report at the top of
   this file.

### Versioning Policy

- **MAJOR** (X.0.0): Principle removed, redefined, or a technology
  constraint that breaks backward compatibility.
- **MINOR** (0.X.0): New principle added, existing principle
  materially expanded, or new technology constraint added.
- **PATCH** (0.0.X): Clarifications, wording fixes, non-semantic
  refinements.

### Compliance Review

Before each module session, verify:
- Selected services remain accessible from Syria.
- New dependencies run on free tier.
- Code follows feature-based folder structure.
- Styling uses StyleSheet, not className.
- TypeScript strict mode has no suppressions.
