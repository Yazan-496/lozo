# Research: Server Quality & Production Readiness

**Phase**: 0 (Outline & Research)  
**Date**: 2026-04-01  
**Purpose**: Resolve technical unknowns and establish best practices

## Research Questions

### Q1: Logging Library Selection

**Decision**: Winston  
**Rationale**: 
- Most popular Node.js logging library with 22k+ GitHub stars
- Excellent TypeScript support with official type definitions
- Supports multiple transports (console, file, external services)
- Built-in log levels and formatting
- Request correlation ID support via metadata
- Syria-accessible (pure Node.js library, no external services)

**Alternatives Considered**:
- **Pino**: Faster but less feature-rich; minimal formatting options
- **Bunyan**: Good but less active maintenance; smaller ecosystem
- **Console.log**: Insufficient for production (no levels, no formatting, no transports)

**Implementation Notes**:
- Use Winston transports for console output (development) and structured JSON (production)
- Configure log rotation for file-based logs if needed
- Include correlation IDs in all log entries via custom formatter

---

### Q2: Testing Framework Selection

**Decision**: Jest  
**Rationale**:
- Industry standard for Node.js/TypeScript testing
- Excellent TypeScript support via ts-jest
- Built-in mocking, assertions, and coverage reporting
- Familiar to most developers
- Works well with Express and async code
- Syria-accessible (no external service dependencies)

**Alternatives Considered**:
- **Vitest**: Faster but newer; less mature ecosystem for Node.js backend testing
- **Mocha + Chai**: More setup required; not as integrated as Jest

**Implementation Notes**:
- Use `supertest` for HTTP endpoint testing (health checks)
- Mock Drizzle database connections in unit tests
- Use `jest.useFakeTimers()` for testing shutdown timeouts

---

### Q3: Health Check Best Practices

**Research**: Kubernetes-style health checks pattern

**Key Findings**:
- **Liveness probe** (`/health/live`): Answers "is the process running?"
  - Should always return 200 unless the app is deadlocked
  - Does NOT check database connectivity
  - Used by orchestrators to know when to restart the container

- **Readiness probe** (`/health/ready`): Answers "can the process handle traffic?"
  - Checks database connectivity, critical dependencies
  - Returns 503 if not ready (startup, degraded state)
  - Used by load balancers to route traffic

**Implementation Approach**:
- `GET /health` → Readiness check (full check, includes DB)
- `GET /health/live` → Liveness check (fast, process-only)
- `GET /health/ready` → Explicit readiness (same as `/health`)

**Response Format**:
```json
{
  "status": "healthy" | "degraded" | "unhealthy",
  "timestamp": "2026-04-01T10:00:00Z",
  "uptime": 3600,
  "checks": {
    "database": { "status": "healthy", "responseTime": 15 },
    "socketio": { "status": "healthy", "connections": 5 }
  }
}
```

---

### Q4: Graceful Shutdown Pattern for Express + Socket.IO

**Research**: Node.js graceful shutdown with HTTP and WebSocket connections

**Key Findings**:
- Listen for `SIGTERM` and `SIGINT` signals
- Stop accepting new HTTP connections immediately
- Track in-flight HTTP requests and wait for completion
- Send disconnect message to WebSocket clients
- Close Socket.IO server after giving clients time to acknowledge
- Close database pool after all connections released
- Force exit after timeout (default 30s)

**Implementation Pattern**:
```typescript
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, starting graceful shutdown...');
  
  // 1. Stop accepting new connections
  httpServer.close(() => {
    console.log('HTTP server closed');
  });
  
  // 2. Notify WebSocket clients
  io.emit('server:shutdown', { message: 'Server is restarting' });
  
  // 3. Wait for in-flight requests (with timeout)
  await waitForRequestsToComplete(shutdownTimeout);
  
  // 4. Close Socket.IO
  io.close();
  
  // 5. Close database
  await db.close();
  
  // 6. Exit
  process.exit(0);
});
```

**Tools**:
- Use `http-terminator` library for tracking in-flight HTTP requests
- Socket.IO has built-in `io.close()` method
- Drizzle connections close via pool shutdown

---

### Q5: Rate Limiting Strategies

**Research**: Rate limiting for Express APIs with mixed authentication states

**Key Findings**:
- **express-rate-limit**: Most popular middleware (17k+ stars)
- Supports in-memory store (single instance) and Redis store (distributed)
- Can use different key generators (IP, user ID, custom)

**Implementation Approach**:
- **For unauthenticated endpoints** (login, register):
  - Key by IP address (`req.ip`)
  - Stricter limits (e.g., 10 req/min per IP)
  
- **For authenticated endpoints** (messages, profile):
  - Key by user ID from JWT (`req.user.id`)
  - More generous limits (e.g., 100 req/min per user)
  
- **Single instance consideration**:
  - Use in-memory store initially (MemoryStore)
  - Document that limits are per-instance, not global
  - Can upgrade to Redis later for distributed rate limiting

**Configuration**:
```typescript
// IP-based rate limiter
const ipLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// User-based rate limiter
const userLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.user?.id || req.ip,
  skip: (req) => !req.user // Skip if not authenticated
});
```

---

### Q6: Error Response Format Standard

**Research**: REST API error response best practices

**Key Findings**:
- Use RFC 7807 "Problem Details" as inspiration (but simplified)
- Consistent structure across all error responses
- Include enough information for client debugging
- Never expose stack traces or internal paths

**Recommended Format**:
```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "statusCode": 400,
    "details": [
      { "field": "username", "message": "Username is required" }
    ],
    "timestamp": "2026-04-01T10:00:00Z",
    "requestId": "req-123-abc"
  }
}
```

**Error Codes by HTTP Status**:
- 400: `VALIDATION_ERROR`, `BAD_REQUEST`
- 401: `UNAUTHORIZED`, `TOKEN_EXPIRED`
- 403: `FORBIDDEN`
- 404: `NOT_FOUND`
- 429: `RATE_LIMIT_EXCEEDED`
- 500: `INTERNAL_ERROR`
- 503: `SERVICE_UNAVAILABLE`

---

### Q7: Request Correlation IDs

**Research**: Distributed tracing and request correlation

**Key Findings**:
- Generate unique ID for each incoming request
- Include in all logs for that request
- Return in response headers for client reference
- Format: `req-{timestamp}-{random}` or use UUID

**Implementation**:
```typescript
// Middleware to generate correlation ID
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || `req-${Date.now()}-${randomBytes(4).toString('hex')}`;
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Use in logging
logger.info('Request received', {
  requestId: req.id,
  method: req.method,
  path: req.path
});
```

---

## Summary

All technical unknowns have been resolved:
- ✅ Logging: Winston with structured JSON output
- ✅ Testing: Jest with supertest for HTTP testing
- ✅ Health checks: Kubernetes liveness/readiness pattern
- ✅ Graceful shutdown: http-terminator + Socket.IO disconnect warnings
- ✅ Rate limiting: express-rate-limit with dual strategy (IP + user)
- ✅ Error format: Consistent RFC 7807-inspired structure
- ✅ Correlation IDs: UUID or timestamp-based with middleware

No blockers identified. Ready to proceed to Phase 1 (Design & Contracts).
