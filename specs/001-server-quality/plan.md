# Implementation Plan: Server Quality & Production Readiness

**Branch**: `001-server-quality` | **Date**: 2026-04-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-server-quality/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement production-ready server infrastructure for the LoZo backend including health check endpoints, graceful shutdown handling, structured error responses, request logging with correlation IDs, and rate limiting. This provides the operational foundation required for reliable deployment on Koyeb with zero-downtime deployments and effective monitoring.

## Technical Context

**Language/Version**: TypeScript (Node.js LTS, currently v20+)  
**Primary Dependencies**: Express, Drizzle (ORM), Socket.IO, Winston (logging library - NEEDS CLARIFICATION)  
**Storage**: PostgreSQL (Supabase free tier)  
**Testing**: NEEDS CLARIFICATION (Jest or Vitest)  
**Target Platform**: Linux server (Koyeb containerized deployment)
**Project Type**: Web service (REST API + WebSocket server)  
**Performance Goals**: Handle ~10 concurrent users, <500ms health check response, <5s database failure detection  
**Constraints**: Single server instance, 30s shutdown timeout, must work on Koyeb free tier  
**Scale/Scope**: Small user base (~10 users), monorepo backend structure

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Principle 1: Syria Accessibility
- **Status**: PASS
- **Verification**: All components (Express, Socket.IO, Supabase, Koyeb) are accessible from Syria. No new external services introduced that could be geo-blocked.

### ✅ Principle 2: Offline-First Messaging
- **Status**: PASS
- **Note**: This feature enhances server reliability which supports offline-first architecture. Graceful shutdown and health checks ensure messages aren't lost during deployments.

### ✅ Principle 3: TypeScript Everywhere
- **Status**: PASS
- **Verification**: All server-side code will be TypeScript with strict mode enabled.

### ✅ Principle 4: Feature-Based Architecture
- **Status**: PASS
- **Verification**: Infrastructure code will be organized under `apps/api/src/infrastructure/` with feature folders for health, logging, errors, shutdown, rate-limiting.

### ✅ Principle 5: Messenger-Identical UX
- **Status**: N/A (backend feature)
- **Note**: This is purely backend infrastructure with no UI impact.

### ✅ Principle 6: Incremental Module Delivery
- **Status**: PASS
- **Verification**: Feature is independently testable. P1 items (health checks, graceful shutdown) can be tested before P2/P3 items.

### Technology Constraints Compliance
- ✅ Backend: Node.js + Express (confirmed)
- ✅ Database: PostgreSQL via Supabase (confirmed)
- ✅ Realtime: Socket.IO (graceful shutdown will handle)
- ✅ Hosting: Koyeb deployment-ready (health checks enable)
- ✅ Auth: JWT (rate limiting integrates with existing auth)

**Overall Gate Status**: ✅ PASS - No violations, all principles satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/api/
├── src/
│   ├── infrastructure/
│   │   ├── health/
│   │   │   ├── health.controller.ts
│   │   │   ├── health.service.ts
│   │   │   └── checks/
│   │   │       ├── database.check.ts
│   │   │       └── socketio.check.ts
│   │   ├── shutdown/
│   │   │   ├── shutdown.service.ts
│   │   │   └── connection-tracker.ts
│   │   ├── errors/
│   │   │   ├── error-handler.middleware.ts
│   │   │   ├── error-formatter.ts
│   │   │   └── error-types.ts
│   │   ├── logging/
│   │   │   ├── logger.service.ts
│   │   │   ├── request-logger.middleware.ts
│   │   │   └── correlation-id.middleware.ts
│   │   └── rate-limiting/
│   │       ├── rate-limiter.middleware.ts
│   │       ├── ip-limiter.ts
│   │       └── user-limiter.ts
│   ├── shared/
│   │   └── types/
│   │       ├── health.types.ts
│   │       ├── error.types.ts
│   │       └── request.types.ts
│   └── index.ts (server bootstrap)
└── tests/
    ├── infrastructure/
    │   ├── health.test.ts
    │   ├── shutdown.test.ts
    │   ├── error-handler.test.ts
    │   ├── logging.test.ts
    │   └── rate-limiting.test.ts
    └── integration/
        └── health-endpoint.test.ts
```

**Structure Decision**: Using feature-based organization within `infrastructure/` folder since these are cross-cutting operational concerns. Each subfolder is self-contained with its services, middleware, and types. This aligns with Principle 4 (Feature-Based Architecture) while recognizing that infrastructure concerns are distinct from business features like auth, chat, etc.

## Complexity Tracking

No violations identified. All design decisions align with constitutional principles.
