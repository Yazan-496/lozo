# API Contract: Health Check Endpoints

**Version**: 1.0.0  
**Endpoint Group**: Infrastructure / Health Monitoring  
**Base Path**: `/health`

---

## GET /health

**Purpose**: Check if the service is ready to handle traffic (readiness probe)

**Authentication**: None (public endpoint)

**Request**: No parameters

**Response** (200 OK - Healthy):
```json
{
  "status": "healthy",
  "timestamp": "2026-04-01T10:00:00.000Z",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": 15
    },
    "socketio": {
      "status": "healthy",
      "metadata": {
        "connections": 5
      }
    }
  }
}
```

**Response** (503 Service Unavailable - Unhealthy):
```json
{
  "status": "unhealthy",
  "timestamp": "2026-04-01T10:00:00.000Z",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "unhealthy",
      "responseTime": 5000,
      "error": "Connection timeout"
    },
    "socketio": {
      "status": "healthy",
      "metadata": {
        "connections": 5
      }
    }
  }
}
```

**Status Codes**:
- `200 OK`: All critical checks pass
- `503 Service Unavailable`: One or more critical checks fail

**Caching**: No caching (must be fresh)

**Notes**:
- Load balancers should route traffic away when 503 returned
- Response time should be <500ms under normal conditions

---

## GET /health/live

**Purpose**: Check if the process is alive (liveness probe)

**Authentication**: None (public endpoint)

**Request**: No parameters

**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2026-04-01T10:00:00.000Z",
  "uptime": 3600
}
```

**Status Codes**:
- `200 OK`: Process is running
- No response: Process is dead (orchestrator should restart)

**Notes**:
- This endpoint does NOT check database or dependencies
- Should respond in <100ms
- Only returns non-200 if process is deadlocked

---

## GET /health/ready

**Purpose**: Explicit readiness check (same as `/health`)

**Authentication**: None (public endpoint)

**Behavior**: Identical to `GET /health`

**Notes**:
- Provided for Kubernetes-style naming convention
- Some orchestrators prefer explicit `/ready` endpoint

---

## Error Responses

All health endpoints follow the standard error format when errors occur during check execution:

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Health check failed",
    "statusCode": 500,
    "timestamp": "2026-04-01T10:00:00.000Z",
    "requestId": "req-1234-abcd"
  }
}
```

---

## Usage Examples

### Load Balancer Configuration (Koyeb)

```yaml
health_check:
  path: /health
  interval: 10s
  timeout: 5s
  healthy_threshold: 2
  unhealthy_threshold: 3
```

### Monitoring Script

```bash
#!/bin/bash
HEALTH_URL="https://api.lozo.app/health"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ "$STATUS" -eq 200 ]; then
  echo "✅ Service is healthy"
else
  echo "❌ Service is unhealthy (status: $STATUS)"
  curl -s $HEALTH_URL | jq .
fi
```

### Docker Healthcheck

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health/live', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"
```
