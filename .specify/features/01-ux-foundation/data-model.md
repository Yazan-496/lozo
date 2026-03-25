# Data Model: UX Foundation

**Date**: 2026-03-25

---

No database or persistent data model changes required for this spec.

## Runtime State Models

### ToastState

| Field | Type | Description |
|-------|------|-------------|
| visible | boolean | Whether toast is currently showing |
| type | 'error' \| 'success' \| 'info' | Determines background color |
| message | string | Text displayed in the toast |
| id | number | Auto-incrementing ID for replace detection |

### ShimmerState (per screen)

| Field | Type | Description |
|-------|------|-------------|
| isFirstLoad | boolean | True until first successful data fetch |

### SplashState

| Field | Type | Description |
|-------|------|-------------|
| isReady | boolean | True when both hydration complete AND 1.5s elapsed |

### ErrorBoundaryState

| Field | Type | Description |
|-------|------|-------------|
| hasError | boolean | True when an unhandled error was caught |
| error | Error \| null | The caught error object |
