# Contract: Toast API

## showToast(type, message)

**Callable from**: Any screen or service via global ref or context

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | 'error' \| 'success' \| 'info' | Yes | Toast variant |
| message | string | Yes | Display text |

**Behavior**:
- If a toast is currently visible, immediately dismiss it and show the new one
- Toast appears at top of screen with slide-down animation
- Auto-dismisses after 3 seconds
- Swipe-up gesture dismisses immediately

## ToastProvider

**Wraps**: Entire app (in App.tsx, inside ErrorBoundary)
**Renders**: Toast overlay component at absolute position top
**Exports**: `useToast()` hook returning `{ showToast }`, or a `toastRef` for use outside React tree
