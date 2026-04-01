# API Contract: Error Responses

**Version**: 1.0.0  
**Scope**: All API endpoints  
**Purpose**: Define standard error response format

---

## Standard Error Format

All error responses across the API follow this structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "statusCode": 400,
    "details": [],
    "timestamp": "2026-04-01T10:00:00.000Z",
    "requestId": "req-1234-abcd"
  }
}
```

### Fields

- **code** (string, required): Machine-readable error code
- **message** (string, required): Human-readable description
- **statusCode** (number, required): HTTP status code
- **details** (array, optional): Additional error details (validation errors)
- **timestamp** (string, required): ISO 8601 timestamp when error occurred
- **requestId** (string, required): Request correlation ID for tracing

---

## Error Codes by Status

### 400 Bad Request

**VALIDATION_ERROR**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "statusCode": 400,
    "details": [
      {
        "field": "username",
        "message": "Username must be at least 3 characters"
      },
      {
        "field": "password",
        "message": "Password is required"
      }
    ],
    "timestamp": "2026-04-01T10:00:00.000Z",
    "requestId": "req-1234-abcd"
  }
}
```

**BAD_REQUEST**
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Malformed JSON in request body",
    "statusCode": 400,
    "timestamp": "2026-04-01T10:00:00.000Z",
    "requestId": "req-1234-abcd"
  }
}
```

---

### 401 Unauthorized

**UNAUTHORIZED**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "statusCode": 401,
    "timestamp": "2026-04-01T10:00:00.000Z",
    "requestId": "req-1234-abcd"
  }
}
```

**TOKEN_EXPIRED**
```json
{
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Authentication token has expired",
    "statusCode": 401,
    "timestamp": "2026-04-01T10:00:00.000Z",
    "requestId": "req-1234-abcd"
  }
}
```

---

### 403 Forbidden

**FORBIDDEN**
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this resource",
    "statusCode": 403,
    "timestamp": "2026-04-01T10:00:00.000Z",
    "requestId": "req-1234-abcd"
  }
}
```

---

### 404 Not Found

**NOT_FOUND**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "The requested resource was not found",
    "statusCode": 404,
    "timestamp": "2026-04-01T10:00:00.000Z",
    "requestId": "req-1234-abcd"
  }
}
```

---

### 429 Too Many Requests

**RATE_LIMIT_EXCEEDED**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later",
    "statusCode": 429,
    "timestamp": "2026-04-01T10:00:00.000Z",
    "requestId": "req-1234-abcd"
  }
}
```

**Headers**:
- `Retry-After`: Seconds until rate limit resets (e.g., `60`)
- `X-RateLimit-Limit`: Maximum requests per window (e.g., `100`)
- `X-RateLimit-Remaining`: Requests remaining in current window (e.g., `0`)
- `X-RateLimit-Reset`: Unix timestamp when limit resets (e.g., `1743504060`)

---

### 500 Internal Server Error

**INTERNAL_ERROR**
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "statusCode": 500,
    "timestamp": "2026-04-01T10:00:00.000Z",
    "requestId": "req-1234-abcd"
  }
}
```

**Notes**:
- Stack traces and internal details are NEVER included in the response
- Full error details are logged server-side with the same `requestId`
- Client can provide `requestId` to support team for debugging

---

### 503 Service Unavailable

**SERVICE_UNAVAILABLE**
```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Service is temporarily unavailable",
    "statusCode": 503,
    "timestamp": "2026-04-01T10:00:00.000Z",
    "requestId": "req-1234-abcd"
  }
}
```

**Use Cases**:
- Database connection lost
- Server is shutting down gracefully
- Dependency service is unavailable

**Headers**:
- `Retry-After`: Seconds to wait before retrying (e.g., `30`)

---

## Response Headers

All error responses include these headers:

- **X-Request-ID**: The correlation ID for tracing (same as `requestId` in body)
- **Content-Type**: Always `application/json`

---

## Security Considerations

### What NOT to include in error responses:

❌ Stack traces  
❌ Internal file paths  
❌ Database query errors  
❌ Environment variables  
❌ Dependency version info  
❌ Server hostnames  

### Server-side logging only:

These details are logged but NOT sent to clients:
- Full stack trace
- Database query details
- Internal service names
- Configuration values

---

## Client Handling Guidelines

### Recommended Client Behavior:

```typescript
// Example error handling
async function handleApiError(response: Response) {
  const errorData = await response.json();
  const { error } = errorData;
  
  console.error(`[${error.requestId}] ${error.code}: ${error.message}`);
  
  switch (error.code) {
    case 'VALIDATION_ERROR':
      // Show field-specific errors to user
      displayValidationErrors(error.details);
      break;
      
    case 'UNAUTHORIZED':
    case 'TOKEN_EXPIRED':
      // Redirect to login
      redirectToLogin();
      break;
      
    case 'RATE_LIMIT_EXCEEDED':
      // Wait and retry
      const retryAfter = response.headers.get('Retry-After');
      setTimeout(() => retryRequest(), parseInt(retryAfter) * 1000);
      break;
      
    case 'INTERNAL_ERROR':
      // Show generic error with request ID
      showError(`Something went wrong (ID: ${error.requestId})`);
      break;
      
    default:
      showError(error.message);
  }
}
```

---

## Changelog

- **1.0.0** (2026-04-01): Initial contract definition
