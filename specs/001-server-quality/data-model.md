# Data Model: Server Quality & Production Readiness

**Phase**: 1 (Design & Contracts)  
**Date**: 2026-04-01  
**Purpose**: Define data structures for health status, error responses, and request logging

## Overview

This feature introduces operational data structures that do not persist to the database but are used for runtime monitoring, error handling, and logging.

---

## Entities

### 1. Health Status

**Purpose**: Represents the current health state of the server and its dependencies

**Structure**:
```typescript
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string; // ISO 8601 format
  uptime: number; // seconds since server start
  checks: HealthChecks;
}

interface HealthChecks {
  database: HealthCheckResult;
  socketio?: HealthCheckResult; // optional if Socket.IO not initialized
}

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  responseTime?: number; // milliseconds
  error?: string; // present only when unhealthy
  metadata?: Record<string, any>; // additional context (e.g., connection count)
}
```

**Validation Rules**:
- `status` must be one of the three allowed values
- `timestamp` must be valid ISO 8601
- `uptime` must be non-negative
- `checks` must include at least `database`

**State Transitions**:
- `healthy`: All checks return healthy
- `degraded`: Some non-critical checks unhealthy (e.g., Socket.IO down but HTTP works)
- `unhealthy`: Critical checks fail (e.g., database unreachable)

**Usage**:
- Returned by `GET /health`, `GET /health/ready`
- Liveness check returns simplified version (no checks object)

---

### 2. Error Response

**Purpose**: Standardized error format for all API responses

**Structure**:
```typescript
interface ErrorResponse {
  error: ErrorDetail;
}

interface ErrorDetail {
  code: ErrorCode;
  message: string; // human-readable message
  statusCode: number; // HTTP status code
  details?: ErrorDetailItem[]; // for validation errors
  timestamp: string; // ISO 8601
  requestId: string; // correlation ID
}

interface ErrorDetailItem {
  field: string; // which field caused the error
  message: string; // specific field error message
  value?: any; // optional: the invalid value provided
}

type ErrorCode = 
  | 'VALIDATION_ERROR'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'TOKEN_EXPIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';
```

**Validation Rules**:
- `code` must match one of the defined ErrorCode values
- `statusCode` must be valid HTTP status code (400-599)
- `message` must not contain stack traces or internal file paths
- `requestId` must be present and non-empty
- If `details` is present, it must be non-empty array

**Mapping**: Error code to HTTP status
- `VALIDATION_ERROR`, `BAD_REQUEST` → 400
- `UNAUTHORIZED`, `TOKEN_EXPIRED` → 401
- `FORBIDDEN` → 403
- `NOT_FOUND` → 404
- `RATE_LIMIT_EXCEEDED` → 429
- `INTERNAL_ERROR` → 500
- `SERVICE_UNAVAILABLE` → 503

---

### 3. Request Log Entry

**Purpose**: Structured log record for each HTTP request

**Structure**:
```typescript
interface RequestLogEntry {
  requestId: string; // correlation ID
  timestamp: string; // ISO 8601
  method: string; // HTTP method
  path: string; // request path
  statusCode: number; // response status
  duration: number; // milliseconds
  userId?: string; // present if authenticated
  ip: string; // client IP address
  userAgent?: string; // client user agent
  error?: string; // present if request failed
}
```

**Validation Rules**:
- `requestId` must be unique per request
- `method` must be valid HTTP method (GET, POST, PUT, DELETE, etc.)
- `duration` must be non-negative
- `statusCode` must be valid HTTP status code

**Usage**:
- Logged after each request completes
- Searchable by `requestId` for debugging
- Used for performance monitoring and error tracking

---

### 4. Rate Limit State

**Purpose**: Track rate limit usage per client (IP or user)

**Structure**:
```typescript
interface RateLimitState {
  key: string; // IP address or user ID
  count: number; // requests in current window
  resetTime: number; // Unix timestamp when window resets
  windowMs: number; // window size in milliseconds
}
```

**Validation Rules**:
- `count` must be non-negative
- `resetTime` must be in the future
- `windowMs` must be positive

**State Management**:
- Stored in-memory (per-instance)
- Automatically expires after `resetTime`
- Incremented on each request
- Returns 429 when `count >= max`

**Usage**:
- IP-based limiter: key = `req.ip`
- User-based limiter: key = `req.user.id`

---

## No Database Tables Required

This feature operates entirely at the application layer. All data structures are:
- Computed on-demand (HealthStatus)
- Returned in responses (ErrorResponse)
- Logged to stdout/files (RequestLogEntry)
- Cached in-memory (RateLimitState)

No Drizzle schema changes needed.

---

## Type Safety

All types will be defined in:
- `apps/api/src/shared/types/health.types.ts`
- `apps/api/src/shared/types/error.types.ts`
- `apps/api/src/shared/types/request.types.ts`

TypeScript strict mode enforced for compile-time validation.
