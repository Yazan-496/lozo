# Tasks: Server Quality & Production Readiness

**Input**: Design documents from `/specs/001-server-quality/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: NOT included (not requested in specification)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Project uses monorepo structure: `apps/api/` for backend code

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and create folder structure

- [ ] T001 Install Winston logging library by running `npm install winston` in project root
- [ ] T002 Install express-rate-limit by running `npm install express-rate-limit` in project root
- [ ] T003 [P] Install http-terminator for graceful shutdown by running `npm install http-terminator` in project root
- [ ] T004 [P] Create infrastructure folder structure: create folders `apps/api/src/infrastructure/health/`, `apps/api/src/infrastructure/shutdown/`, `apps/api/src/infrastructure/errors/`, `apps/api/src/infrastructure/logging/`, `apps/api/src/infrastructure/rate-limiting/`
- [ ] T005 [P] Create shared types folder: create folder `apps/api/src/shared/types/`
- [ ] T006 [P] Create health checks subfolder: create folder `apps/api/src/infrastructure/health/checks/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core type definitions and utilities needed by all user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 [P] Define health types in `apps/api/src/shared/types/health.types.ts` - Create file with these EXACT interfaces: `HealthStatus` (fields: status as 'healthy'|'degraded'|'unhealthy', timestamp as string, uptime as number, checks as HealthChecks), `HealthChecks` (fields: database as HealthCheckResult, socketio as optional HealthCheckResult), `HealthCheckResult` (fields: status as 'healthy'|'unhealthy', responseTime as optional number, error as optional string, metadata as optional Record<string, any>)
- [ ] T008 [P] Define error types in `apps/api/src/shared/types/error.types.ts` - Create file with these EXACT interfaces: `ErrorResponse` (field: error as ErrorDetail), `ErrorDetail` (fields: code as ErrorCode, message as string, statusCode as number, details as optional ErrorDetailItem[], timestamp as string, requestId as string), `ErrorDetailItem` (fields: field as string, message as string, value as optional any), `ErrorCode` as type union of these EXACT strings: 'VALIDATION_ERROR' | 'BAD_REQUEST' | 'UNAUTHORIZED' | 'TOKEN_EXPIRED' | 'FORBIDDEN' | 'NOT_FOUND' | 'RATE_LIMIT_EXCEEDED' | 'INTERNAL_ERROR' | 'SERVICE_UNAVAILABLE'
- [ ] T009 [P] Define request types in `apps/api/src/shared/types/request.types.ts` - Create file with this EXACT interface: `RequestLogEntry` (fields: requestId as string, timestamp as string, method as string, path as string, statusCode as number, duration as number, userId as optional string, ip as string, userAgent as optional string, error as optional string). Also extend Express Request type by adding: declare global { namespace Express { interface Request { id: string; startTime: number; } } }

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Health Monitoring (Priority: P1) 🎯 MVP

**Goal**: Implement `/health`, `/health/live`, and `/health/ready` endpoints that check database and Socket.IO connectivity

**Independent Test**: Run `curl http://localhost:3000/health` and verify JSON response with status, timestamp, uptime, and checks object containing database and socketio status

### Implementation for User Story 1

- [ ] T010 [P] [US1] Create database health check in `apps/api/src/infrastructure/health/checks/database.check.ts` - Export async function `checkDatabase()` that returns `Promise<HealthCheckResult>`. Inside: (1) Import your Drizzle db instance, (2) Record start time with `Date.now()`, (3) Try to execute `db.execute(sql\`SELECT 1\`)` (import sql from drizzle-orm), (4) If successful return object with status 'healthy' and responseTime as Date.now() minus start time, (5) If error caught return object with status 'unhealthy', error message, and responseTime
- [ ] T011 [P] [US1] Create Socket.IO health check in `apps/api/src/infrastructure/health/checks/socketio.check.ts` - Export async function `checkSocketIO(io: Server | null)` that returns `Promise<HealthCheckResult>`. Inside: (1) If io is null return {status: 'unhealthy', error: 'Socket.IO not initialized'}, (2) Otherwise return {status: 'healthy', metadata: {connections: io.engine.clientsCount}}. Import Server type from 'socket.io'
- [ ] T012 [US1] Create health service in `apps/api/src/infrastructure/health/health.service.ts` - Export class `HealthService` with: (1) private startTime property initialized to Date.now(), (2) async method `checkHealth(io: Server | null): Promise<HealthStatus>` that calls both database and socketio checks, determines overall status (healthy if all checks healthy, degraded if socketio fails but db ok, unhealthy if db fails), and returns HealthStatus object with current timestamp, uptime in seconds, and all check results, (3) method `checkLiveness(): HealthStatus` that returns simple status object with only status 'healthy', timestamp, and uptime (no checks)
- [ ] T013 [US1] Create health controller in `apps/api/src/infrastructure/health/health.controller.ts` - Export Express Router with: (1) Create HealthService instance at top, (2) GET `/health` route that calls healthService.checkHealth, if status is 'unhealthy' respond with 503 else respond with 200, send HealthStatus JSON, (3) GET `/health/live` route that calls healthService.checkLiveness and responds with 200 and JSON, (4) GET `/health/ready` route that behaves exactly like `/health` route (same implementation). Import Router from 'express' and mount this router in your main app file at `/health` path
- [ ] T014 [US1] Integrate health routes in `apps/api/src/index.ts` - Import the health controller router and add `app.use('/health', healthRouter)` BEFORE other routes. Pass Socket.IO instance to health check by storing it in a variable accessible to health service (modify health.controller.ts to accept io parameter or use dependency injection pattern)

**Checkpoint**: At this point, User Story 1 should be fully functional. Test by running server and curling all three health endpoints

---

## Phase 4: User Story 2 - Graceful Shutdown (Priority: P1)

**Goal**: Handle SIGTERM and SIGINT signals to complete in-flight requests, notify WebSocket clients, close database and exit within 30 seconds

**Independent Test**: Start server, make a long request in one terminal, send SIGTERM in another terminal, verify: (1) server stops accepting new connections, (2) long request completes successfully, (3) shutdown completes within 30s, (4) process exits cleanly

### Implementation for User Story 2

- [ ] T015 [P] [US2] Create connection tracker in `apps/api/src/infrastructure/shutdown/connection-tracker.ts` - Export class `ConnectionTracker` with: (1) private Set<Response> to store active responses, (2) method `add(res: Response)` that adds response to set and attaches 'finish' listener to remove it from set, (3) method `getActiveCount(): number` returning set size, (4) method `waitForCompletion(timeoutMs: number): Promise<void>` that polls every 100ms checking if set is empty or timeout exceeded. Import Response from 'express'
- [ ] T016 [US2] Create shutdown service in `apps/api/src/infrastructure/shutdown/shutdown.service.ts` - Export class `ShutdownService` with constructor accepting (httpServer: http.Server, io: Server, db: dbConnection, connectionTracker: ConnectionTracker). Add method `async gracefulShutdown()` that: (1) Logs 'Starting graceful shutdown', (2) Emits 'server:shutdown' event to all Socket.IO clients with message {message: 'Server is restarting, please reconnect'}, (3) Calls httpServer.close() to stop accepting new connections, (4) Awaits connectionTracker.waitForCompletion(30000), (5) Calls io.close(), (6) Calls await db.$client.end() or equivalent Drizzle/Postgres pool shutdown, (7) Logs 'Shutdown complete', (8) Calls process.exit(0). Import http from 'http', Server from 'socket.io'
- [ ] T017 [US2] Register shutdown handlers in `apps/api/src/index.ts` - After server starts: (1) Create ConnectionTracker instance, (2) Add middleware BEFORE all routes: `app.use((req, res, next) => { connectionTracker.add(res); next(); })`, (3) Create ShutdownService instance passing httpServer, io, db, connectionTracker, (4) Add signal handlers: `process.on('SIGTERM', () => shutdownService.gracefulShutdown())` and `process.on('SIGINT', () => shutdownService.gracefulShutdown())`, (5) Add uncaughtException and unhandledRejection handlers that also call gracefulShutdown

**Checkpoint**: Test graceful shutdown works. Server should complete requests and exit cleanly on SIGTERM

---

## Phase 5: User Story 3 - Structured Error Handling (Priority: P2)

**Goal**: Return consistent error format across all endpoints with appropriate status codes and sanitized messages

**Independent Test**: Trigger errors (404, 500, validation) and verify all return ErrorResponse format with code, message, statusCode, timestamp, requestId. Verify NO stack traces in responses

### Implementation for User Story 3

- [ ] T018 [P] [US3] Create error formatter in `apps/api/src/infrastructure/errors/error-formatter.ts` - Export function `formatError(error: any, requestId: string): ErrorResponse` that: (1) Determines error code and status code from error type (if error.name === 'ValidationError' use VALIDATION_ERROR/400, if error.statusCode exists use that, else INTERNAL_ERROR/500), (2) Sanitizes message (NEVER include stack traces, file paths, or internal details in message), (3) Returns ErrorResponse object with error.code, sanitized message, statusCode, timestamp as new Date().toISOString(), requestId, and details if validation error with array of field errors. Import ErrorResponse, ErrorCode from shared types
- [ ] T019 [P] [US3] Create error types utility in `apps/api/src/infrastructure/errors/error-types.ts` - Export custom error classes: `class ValidationError extends Error` with constructor(message, details), `class NotFoundError extends Error`, `class UnauthorizedError extends Error`, `class ForbiddenError extends Error`, `class RateLimitError extends Error`. Each sets this.name to match class name and has statusCode property (ValidationError: 400, NotFound: 404, Unauthorized: 401, Forbidden: 403, RateLimit: 429)
- [ ] T020 [US3] Create error handler middleware in `apps/api/src/infrastructure/errors/error-handler.middleware.ts` - Export Express error middleware function `errorHandler(err: any, req: Request, res: Response, next: NextFunction)` that: (1) Imports formatError function, (2) Logs FULL error details including stack trace to console/logger (server-side only), (3) Calls formatError(err, req.id) to get sanitized ErrorResponse, (4) Sets status code from error.statusCode || 500, (5) Sends JSON response with ErrorResponse format. Import Request, Response, NextFunction from 'express'. THIS MIDDLEWARE MUST BE ADDED LAST IN apps/api/src/index.ts AFTER ALL ROUTES
- [ ] T021 [US3] Add 404 handler in `apps/api/src/index.ts` - BEFORE the error handler middleware but AFTER all valid routes, add: `app.use((req, res) => { throw new NotFoundError(\`Route ${req.method} ${req.path} not found\`); })`. This catches all undefined routes
- [ ] T022 [US3] Integrate error handling in `apps/api/src/index.ts` - Add the error handler middleware as LAST middleware: `app.use(errorHandler)`. Ensure this comes after the 404 handler and all other routes

**Checkpoint**: Test error handling by requesting invalid route (should get 404 with proper format), throwing error in a route (should get 500 with proper format), no stack traces in responses

---

## Phase 6: User Story 4 - Request Logging & Metrics (Priority: P2)

**Goal**: Log every HTTP request with method, path, status, duration, and unique correlation ID. Include correlation ID in all logs

**Independent Test**: Make several requests and check server logs. Verify each request has: timestamp, requestId, method, path, statusCode, duration in ms, IP address. Verify same requestId appears in all logs for that request

### Implementation for User Story 4

- [ ] T023 [P] [US4] Create logger service in `apps/api/src/infrastructure/logging/logger.service.ts` - Export configured Winston logger: (1) Import winston from 'winston', (2) Create winston.createLogger with format as winston.format.combine(winston.format.timestamp(), winston.format.json()), (3) Add Console transport with level 'info' for development, (4) Export as `logger` const. This logger will be used throughout the application. Log format MUST be JSON with timestamp
- [ ] T024 [P] [US4] Create correlation ID middleware in `apps/api/src/infrastructure/logging/correlation-id.middleware.ts` - Export Express middleware function `correlationIdMiddleware(req: Request, res: Response, next: NextFunction)` that: (1) Generates unique ID using `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}` or uses req.headers['x-request-id'] if present, (2) Sets req.id = generated ID, (3) Sets res.setHeader('X-Request-ID', req.id), (4) Sets req.startTime = Date.now(), (5) Calls next(). This gives every request a unique tracking ID
- [ ] T025 [US4] Create request logger middleware in `apps/api/src/infrastructure/logging/request-logger.middleware.ts` - Export Express middleware function `requestLoggerMiddleware(req: Request, res: Response, next: NextFunction)` that: (1) Imports logger from logger.service, (2) Logs incoming request: `logger.info('Request received', {requestId: req.id, method: req.method, path: req.path, ip: req.ip})`, (3) Attaches 'finish' event listener to res that logs: `logger.info('Request completed', {requestId: req.id, method: req.method, path: req.path, statusCode: res.statusCode, duration: Date.now() - req.startTime, ip: req.ip, userAgent: req.get('user-agent'), userId: req.user?.id})`, (4) Calls next()
- [ ] T026 [US4] Integrate logging in `apps/api/src/index.ts` - Add logging middleware EARLY in middleware chain (after body parsers but before routes): (1) First add correlationIdMiddleware, (2) Then add requestLoggerMiddleware. Also update error handler to use logger.error instead of console.error for logging errors
- [ ] T027 [US4] Update error handler to include requestId - Modify `apps/api/src/infrastructure/errors/error-handler.middleware.ts` to log errors using logger with requestId: `logger.error('Request failed', {requestId: req.id, error: err.message, stack: err.stack, method: req.method, path: req.path})`

**Checkpoint**: Make requests and check logs. Each request should have unique requestId in all log entries, duration should be calculated, logs should be in JSON format

---

## Phase 7: User Story 5 - Rate Limiting Protection (Priority: P3)

**Goal**: Limit unauthenticated requests by IP (10 req/min) and authenticated requests by user ID (100 req/min). Return 429 with retry-after header when exceeded

**Independent Test**: Send 15 requests to an unauthenticated endpoint from same IP within 1 minute. First 10 should succeed, requests 11-15 should return 429 with Retry-After header and proper error format

### Implementation for User Story 5

- [ ] T028 [P] [US5] Create IP rate limiter in `apps/api/src/infrastructure/rate-limiting/ip-limiter.ts` - Export Express middleware using express-rate-limit: (1) Import rateLimit from 'express-rate-limit', (2) Export `ipRateLimiter = rateLimit({windowMs: 60000, max: 10, keyGenerator: (req) => req.ip, handler: (req, res) => { res.status(429).json(formatError(new RateLimitError('Too many requests'), req.id)); }, standardHeaders: true, legacyHeaders: false})`. Import formatError and RateLimitError. This limits by IP address
- [ ] T029 [P] [US5] Create user rate limiter in `apps/api/src/infrastructure/rate-limiting/user-limiter.ts` - Export Express middleware using express-rate-limit: (1) Import rateLimit from 'express-rate-limit', (2) Export `userRateLimiter = rateLimit({windowMs: 60000, max: 100, keyGenerator: (req) => req.user?.id || req.ip, skip: (req) => !req.user, handler: (req, res) => { res.status(429).json(formatError(new RateLimitError('Too many requests'), req.id)); }, standardHeaders: true, legacyHeaders: false})`. This limits authenticated users by user ID, falls back to IP if not authenticated, and skips if no user
- [ ] T030 [US5] Create rate limiter middleware selector in `apps/api/src/infrastructure/rate-limiting/rate-limiter.middleware.ts` - Export function `getRateLimiter(authenticated: boolean)` that returns ipRateLimiter if authenticated is false, otherwise returns userRateLimiter. This allows route-specific rate limit selection
- [ ] T031 [US5] Apply IP rate limiter to auth routes in `apps/api/src/index.ts` - Import ipRateLimiter and apply it to authentication/registration routes: `app.use('/api/auth', ipRateLimiter, authRouter)`. This protects login/register from brute force
- [ ] T032 [US5] Apply user rate limiter to authenticated routes - For routes that require authentication, apply userRateLimiter AFTER authentication middleware: `app.use('/api/messages', authMiddleware, userRateLimiter, messagesRouter)`. This allows higher limits for authenticated users
- [ ] T033 [US5] Update rate limit error format - Ensure RateLimitError in error-types.ts includes retry-after information. Modify handler in rate limiters to set Retry-After header: `res.setHeader('Retry-After', Math.ceil(req.rateLimit.resetTime / 1000))`

**Checkpoint**: Test rate limiting by rapidly sending requests. Verify 429 responses include Retry-After header, proper error format, and X-RateLimit-* headers

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, configuration, and documentation

- [ ] T034 [P] Create environment configuration in `.env.example` - Add these variables with example values: PORT=3000, NODE_ENV=production, LOG_LEVEL=info, RATE_LIMIT_WINDOW_MS=60000, RATE_LIMIT_MAX_IP=10, RATE_LIMIT_MAX_USER=100, SHUTDOWN_TIMEOUT_MS=30000, DATABASE_URL=postgresql://..., Add comment explaining each variable
- [ ] T035 [P] Update package.json scripts - Add scripts: `"dev": "tsx watch src/index.ts"`, `"build": "tsc"`, `"start": "node dist/index.js"`. Ensure TypeScript is configured with strict mode in tsconfig.json
- [ ] T036 Add environment variable validation - In `apps/api/src/index.ts` at the very top, validate required environment variables exist (DATABASE_URL, PORT) and throw clear error if missing. Use process.env.SHUTDOWN_TIMEOUT_MS with default 30000 in shutdown service
- [ ] T037 Update main server file for production - In `apps/api/src/index.ts` ensure: (1) Correlation ID middleware is first, (2) Request logger is second, (3) Health routes are mounted, (4) Rate limiters are applied appropriately, (5) All routes are registered, (6) 404 handler before error handler, (7) Error handler is last, (8) Shutdown handlers are registered after server starts. Add startup log with `logger.info('Server started', {port: PORT, nodeEnv: process.env.NODE_ENV})`
- [ ] T038 Test complete integration - Follow quickstart.md testing scenarios: (1) Test health endpoints respond correctly, (2) Test graceful shutdown with active requests, (3) Test error responses are consistent, (4) Test request logging captures all fields, (5) Test rate limiting triggers at correct thresholds. Document any issues found
- [ ] T039 [P] Add code comments to complex sections - Add JSDoc comments to: ShutdownService.gracefulShutdown explaining each step, ConnectionTracker.waitForCompletion explaining timeout logic, formatError function explaining sanitization. Keep comments concise

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 (Health Monitoring): Independent, can start after Phase 2
  - US2 (Graceful Shutdown): Requires US1 complete (needs HealthService, io, db instances)
  - US3 (Error Handling): Independent, can start after Phase 2 (parallel with US1)
  - US4 (Request Logging): Independent, can start after Phase 2 (parallel with US1)
  - US5 (Rate Limiting): Requires US3 complete (needs error formatting)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 2 (Foundation) 
    ↓
    ├→ US1 (Health) → US2 (Shutdown)
    ├→ US3 (Errors) → US5 (Rate Limiting)
    └→ US4 (Logging) → (parallel, no blockers)
         ↓
    Phase 8 (Polish)
```

- **User Story 1 (P1)**: Can start immediately after Phase 2
- **User Story 2 (P1)**: Depends on US1 (needs health checks and Socket.IO instance)
- **User Story 3 (P2)**: Can start after Phase 2, parallel with US1
- **User Story 4 (P2)**: Can start after Phase 2, parallel with US1  
- **User Story 5 (P3)**: Depends on US3 (needs error formatting)

### Within Each User Story

- Tasks marked [P] within same phase can run in parallel
- Non-[P] tasks must run sequentially
- All tasks for a story must complete before story is considered done

### Parallel Opportunities

#### Phase 1 (Setup):
- T003, T004, T005, T006 can all run in parallel after T001, T002 complete

#### Phase 2 (Foundation):
- T007, T008, T009 can all run in parallel

#### Phase 3 (US1):
- T010, T011 can run in parallel
- T012 must wait for T010, T011
- T013 must wait for T012
- T014 must wait for T013

#### Phase 4 (US2):
- T015 can run in parallel with T016 (different files)
- T017 must wait for T015, T016

#### Phase 5 (US3):
- T018, T019 can run in parallel
- T020 must wait for T018, T019
- T021, T022 must run after T020

#### Phase 6 (US4):
- T023, T024 can run in parallel
- T025 can start after T023, T024
- T026, T027 must run after T025

#### Phase 7 (US5):
- T028, T029 can run in parallel
- T030, T031, T032, T033 can run after T028, T029

#### Phase 8 (Polish):
- T034, T035, T039 can run in parallel
- T036, T037, T038 must run sequentially

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup → Dependencies installed, folders created
2. Complete Phase 2: Foundational → Type definitions ready
3. Complete Phase 3: User Story 1 → Health checks working
4. Complete Phase 4: User Story 2 → Graceful shutdown working
5. **STOP and VALIDATE**: Test health endpoints and graceful shutdown independently
6. Deploy to Koyeb with health checks configured

This gives you production-ready server with monitoring and zero-downtime deployments.

### Incremental Delivery

1. MVP (US1 + US2) → Can deploy to production with confidence
2. Add US3 (Errors) → Better debugging, still production-ready
3. Add US4 (Logging) → Full observability, can trace all requests
4. Add US5 (Rate Limiting) → Production-hardened against abuse
5. Polish → Fully documented and configured

### Parallel Team Strategy

With 2 developers after Phase 2:

- **Developer A**: US1 → US2 (critical path)
- **Developer B**: US3 → US4 → US5 (enhancement path)

Then merge both branches for complete feature.

---

## Testing Commands

After each phase, validate with these commands:

**After US1 (Health Monitoring)**:
```bash
curl http://localhost:3000/health
curl http://localhost:3000/health/live
curl http://localhost:3000/health/ready
```

**After US2 (Graceful Shutdown)**:
```bash
# Terminal 1
npm run dev

# Terminal 2
curl http://localhost:3000/some-slow-endpoint &
sleep 1
kill -SIGTERM $(pgrep -f "node.*api")

# Verify: request completes, shutdown logs appear, process exits 0
```

**After US3 (Error Handling)**:
```bash
curl http://localhost:3000/nonexistent  # Should get 404 with proper format
curl http://localhost:3000/health  # Should work normally
```

**After US4 (Request Logging)**:
```bash
curl http://localhost:3000/health
# Check logs for: requestId, method, path, duration, statusCode
```

**After US5 (Rate Limiting)**:
```bash
for i in {1..15}; do curl http://localhost:3000/api/auth/login; done
# First 10 succeed, 11-15 return 429
```

---

## Notes

- All file paths are exact - create files at these locations
- TypeScript types must match data-model.md exactly
- Each user story is independently testable - stop at any checkpoint to validate
- Winston logger should output JSON for production parsing
- Correlation IDs must be unique per request - use timestamp + random
- Rate limiters must include standard headers (X-RateLimit-*)
- Error responses NEVER include stack traces (server logs only)
- Graceful shutdown timeout is configurable via environment variable
- Health checks should respond in < 500ms (requirement SC-001)
- Database check should detect failures in < 5s (requirement SC-007)
