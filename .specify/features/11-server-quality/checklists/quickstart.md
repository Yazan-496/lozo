# Quickstart: Server Quality & Production Readiness

**Feature**: Server Quality Infrastructure  
**For**: Backend developers working on LoZo API  
**Time**: 10 minutes

---

## What This Feature Provides

Production-ready server infrastructure including:
- ✅ Health check endpoints for monitoring and load balancing
- ✅ Graceful shutdown handling for zero-downtime deployments
- ✅ Structured error responses across all endpoints
- ✅ Request logging with correlation IDs for debugging
- ✅ Rate limiting to protect against abuse

---

## Quick Start

### 1. Testing Health Checks

```bash
# Check if server is ready
curl http://localhost:3000/health

# Check if server is alive (fast, no DB check)
curl http://localhost:3000/health/live

# Expected response (healthy):
{
  "status": "healthy",
  "timestamp": "2026-04-01T10:00:00.000Z",
  "uptime": 3600,
  "checks": {
    "database": { "status": "healthy", "responseTime": 15 },
    "socketio": { "status": "healthy", "metadata": { "connections": 5 } }
  }
}
```

### 2. Testing Graceful Shutdown

```bash
# Start the server
npm run dev

# In another terminal, send shutdown signal
kill -SIGTERM $(pgrep -f "node.*api")

# Watch logs - you should see:
# "Received SIGTERM, starting graceful shutdown..."
# "HTTP server closed"
# "Database connections closed"
# "Server exited gracefully"
```

### 3. Testing Error Responses

```bash
# Trigger a validation error
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "ab"}'

# Expected response (400):
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "statusCode": 400,
    "details": [
      {
        "field": "username",
        "message": "Username must be at least 3 characters"
      }
    ],
    "timestamp": "2026-04-01T10:00:00.000Z",
    "requestId": "req-1234-abcd"
  }
}
```

### 4. Testing Rate Limiting

```bash
# Send multiple requests quickly (>10 in 1 minute for unauthenticated)
for i in {1..15}; do
  curl http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}'
done

# After 10 requests, you'll get 429:
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later",
    "statusCode": 429,
    "timestamp": "2026-04-01T10:00:00.000Z",
    "requestId": "req-1234-abcd"
  }
}

# Check headers:
# Retry-After: 60
# X-RateLimit-Limit: 10
# X-RateLimit-Remaining: 0
```

### 5. Checking Request Logs

All requests are logged with correlation IDs:

```bash
# Check server logs
tail -f logs/app.log

# You'll see entries like:
{
  "level": "info",
  "message": "Request completed",
  "requestId": "req-1234-abcd",
  "method": "GET",
  "path": "/health",
  "statusCode": 200,
  "duration": 45,
  "ip": "127.0.0.1",
  "timestamp": "2026-04-01T10:00:00.000Z"
}
```

---

## For Development

### Running Tests

```bash
# Run all infrastructure tests
npm test -- infrastructure

# Run specific test suites
npm test -- health.test.ts
npm test -- shutdown.test.ts
npm test -- error-handler.test.ts
npm test -- rate-limiting.test.ts
```

### Configuration

Environment variables (`.env`):

```bash
# Server
PORT=3000
NODE_ENV=production

# Logging
LOG_LEVEL=info  # debug | info | warn | error

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000        # 1 minute
RATE_LIMIT_MAX_IP=10              # 10 requests per IP per minute
RATE_LIMIT_MAX_USER=100           # 100 requests per user per minute

# Graceful Shutdown
SHUTDOWN_TIMEOUT_MS=30000         # 30 seconds
```

### Adding Custom Health Checks

```typescript
// apps/api/src/infrastructure/health/checks/custom.check.ts
import { HealthCheckResult } from '@/shared/types/health.types';

export async function checkCustomService(): Promise<HealthCheckResult> {
  try {
    const start = Date.now();
    
    // Your health check logic here
    const isHealthy = await customService.ping();
    
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      responseTime: Date.now() - start,
      metadata: {
        // Additional context
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}
```

---

## For Production

### Koyeb Configuration

The health check endpoint is configured automatically:

```yaml
# koyeb.yaml (generated)
services:
  - name: lozo-api
    ports:
      - port: 3000
        protocol: http
    health_check:
      path: /health
      interval: 10s
      timeout: 5s
      healthy_threshold: 2
      unhealthy_threshold: 3
```

### Monitoring Integration

Set up alerts based on health check failures:

```bash
# Example: Monitor with a cron job
*/5 * * * * curl -f http://lozo-api.koyeb.app/health || echo "Health check failed!" | mail -s "LoZo API Alert" admin@lozo.app
```

### Viewing Logs

```bash
# View logs on Koyeb
koyeb logs lozo-api --follow

# Search for specific request
koyeb logs lozo-api | grep "req-1234-abcd"
```

---

## Common Scenarios

### Scenario 1: Debugging a User Issue

User reports an error. They provide request ID: `req-1234-abcd`

```bash
# Search logs for that request
grep "req-1234-abcd" logs/app.log

# You'll find all log entries for that request:
# - Initial request log
# - Any intermediate processing logs
# - Error details with full stack trace
# - Final response log
```

### Scenario 2: Deployment

```bash
# Deploy new version
git push origin main

# Koyeb detects the push and:
# 1. Builds new container
# 2. Starts new instance
# 3. Waits for /health to return 200
# 4. Routes traffic to new instance
# 5. Sends SIGTERM to old instance
# 6. Old instance completes in-flight requests
# 7. Old instance shuts down gracefully

# Zero downtime! 🎉
```

### Scenario 3: Rate Limit Bypass for Monitoring

If you need to bypass rate limiting for monitoring tools:

```typescript
// apps/api/src/infrastructure/rate-limiting/rate-limiter.middleware.ts
const rateLimiter = rateLimit({
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path.startsWith('/health');
  }
});
```

---

## Troubleshooting

### Health check returns 503

**Cause**: Database or Socket.IO connection failed

**Solution**:
```bash
# Check database connectivity
psql $DATABASE_URL -c "SELECT 1"

# Check Socket.IO logs
grep "socketio" logs/app.log
```

### Graceful shutdown times out

**Cause**: Long-running requests exceed 30s timeout

**Solution**:
```bash
# Increase timeout in .env
SHUTDOWN_TIMEOUT_MS=60000  # 60 seconds

# Or identify slow requests in logs
grep "duration" logs/app.log | sort -k8 -n | tail -10
```

### Rate limiting too strict

**Cause**: IP-based limiting affects shared network

**Solution**:
```bash
# Adjust limits in .env
RATE_LIMIT_MAX_IP=50  # Increase from 10 to 50

# Or implement allowlist for known IPs
```

---

## Next Steps

- ✅ Feature is production-ready after implementation
- 📊 Set up monitoring dashboard (Grafana, Prometheus)
- 🔔 Configure alerting for health check failures
- 📈 Add metrics collection (request rates, error rates, latency)

---

## Support

Questions? Check:
- [Health API Contract](./contracts/health-api.md)
- [Error Response Contract](./contracts/error-responses.md)
- [Data Model](./data-model.md)
- [Research Notes](./research.md)
