# Implementation Plan: UX Foundation

**Spec**: 01 of 12
**Date**: 2026-03-25
**Branch**: main (feature/01-ux-foundation when ready)

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| 1. Syria Accessibility | PASS | No new external services added |
| 2. Offline-First | N/A | UI-only spec, no data layer changes |
| 3. TypeScript Everywhere | PASS | All new code in TypeScript. One exception: ErrorBoundary uses class component (React mandates this — no hook equivalent exists) |
| 4. Feature-Based Architecture | PASS | New components go in `shared/components/`, provider in `shared/providers/` |
| 5. Messenger-Identical UX | PASS | Tab icons match Messenger, shimmer matches Facebook, toast is non-blocking |
| 6. Incremental Module Delivery | PASS | Self-contained spec, no dependency on other specs |

---

## Technical Context

| Item | Value |
|------|-------|
| Platform | React Native (Expo SDK 54, Expo Go) |
| Styling | React Native StyleSheet (no NativeWind) |
| Animation | React Native Animated API (useNativeDriver: true) |
| Icons | @expo/vector-icons Ionicons (bundled) |
| Splash | expo-splash-screen API |
| State | Zustand (auth store), React state (local) |
| No new packages | All features use built-in Expo/RN APIs |

---

## File Change Map

### New Files (7)

| File | Purpose | FR |
|------|---------|-----|
| `src/shared/components/Shimmer.tsx` | Reusable shimmer animation wrapper | FR-3.1 |
| `src/shared/components/ConversationSkeleton.tsx` | Skeleton for conversations list | FR-3.2 |
| `src/shared/components/ContactSkeleton.tsx` | Skeleton for contacts list | FR-3.3 |
| `src/shared/components/MessageSkeleton.tsx` | Skeleton for chat messages | FR-3.4 |
| `src/shared/components/Toast.tsx` | Toast component + ToastProvider + showToast | FR-4 |
| `src/shared/components/ErrorBoundary.tsx` | Class component error boundary | FR-5 |
| `src/shared/components/SplashView.tsx` | Custom branded splash view | FR-2 |

### Modified Files (8)

| File | Changes | FR |
|------|---------|-----|
| `src/navigation/index.tsx` | Replace emoji TabIcon with Ionicons | FR-1 |
| `App.tsx` | Wrap with ErrorBoundary + ToastProvider, add splash control | FR-2, FR-4, FR-5 |
| `src/features/chat/ConversationsScreen.tsx` | Add isFirstLoad + skeleton | FR-3 |
| `src/features/chat/ChatScreen.tsx` | Add skeleton + replace Alert with toast | FR-3, FR-4 |
| `src/features/contacts/ContactsScreen.tsx` | Add skeleton + replace Alert with toast | FR-3, FR-4 |
| `src/features/auth/LoginScreen.tsx` | Replace Alert with toast | FR-4 |
| `src/features/auth/RegisterScreen.tsx` | Replace Alert with toast | FR-4 |
| `src/features/profile/ProfileScreen.tsx` | Replace Alert with toast (keep logout dialog) | FR-4 |

### Deleted Files (4)

| File | Reason | FR |
|------|--------|-----|
| `tailwind.config.js` | NativeWind cleanup | FR-6 |
| `global.css` | NativeWind cleanup | FR-6 |
| `nativewind-env.d.ts` | NativeWind cleanup | FR-6 |
| `metro.config.js` | NativeWind cleanup (if only NW config) | FR-6 |

### Package Changes

| Action | Package | Reason |
|--------|---------|--------|
| Remove | nativewind | Unused after StyleSheet migration |
| Remove | tailwindcss | Unused after StyleSheet migration |

---

## Implementation Order (Tasks)

Tasks are ordered by dependency — each task builds on the previous.

### Task 1: Package Cleanup (FR-6)
**Priority**: Do first — removes dead code before adding new
**Files**: package.json, tailwind.config.js, global.css, nativewind-env.d.ts, metro.config.js
**Steps**:
1. Grep codebase for any remaining `className` usage — must be zero
2. Remove `nativewind` and `tailwindcss` from package.json
3. Delete `tailwind.config.js`, `global.css`, `nativewind-env.d.ts`
4. Check `metro.config.js` — if it only has NativeWind config, delete it; if it has other config, just remove NativeWind parts
5. Run `npm install` to clean lockfile
6. Verify app compiles: `npx expo start`

**Acceptance test**: App starts in Expo Go without errors. No className references exist.

---

### Task 2: Tab Bar Icons (FR-1)
**Priority**: Quick visual win
**Files**: `src/navigation/index.tsx`
**Steps**:
1. Import `Ionicons` from `@expo/vector-icons`
2. Replace `TabIcon` component:
   - `Chats`: `chatbubble` (focused) / `chatbubble-outline` (unfocused)
   - `Contacts`: `people` (focused) / `people-outline` (unfocused)
   - `Profile`: `person-circle` (focused) / `person-circle-outline` (unfocused)
3. Set icon size 24, colors: active #0084FF, inactive #8A8D91
4. Set label style: active fontWeight 600, inactive 400, fontSize 11

**Acceptance test**: Tab bar shows vector icons matching Messenger style. Active = filled blue, inactive = outline gray.

---

### Task 3: Error Boundary (FR-5)
**Priority**: Safety net before other changes
**Files**: `src/shared/components/ErrorBoundary.tsx`, `App.tsx`
**Steps**:
1. Create `ErrorBoundary` class component with `getDerivedStateFromError` + `componentDidCatch`
2. Fallback UI: centered View with warning icon (Ionicons `warning`), "Something went wrong" Text, "Try Again" Button
3. "Try Again" calls `this.setState({ hasError: false })`
4. Wrap entire app in ErrorBoundary in App.tsx (outermost wrapper)
5. Log errors via `console.error` in `componentDidCatch`

**Acceptance test**: Throwing an error in any screen shows the fallback. "Try Again" recovers.

---

### Task 4: Toast System (FR-4)
**Priority**: Needed before Alert replacement
**Files**: `src/shared/components/Toast.tsx`, `App.tsx`
**Steps**:
1. Create `ToastProvider` component:
   - State: `{ visible, type, message, id }`
   - `showToast(type, message)`: set state, start auto-dismiss timer (3s), cancel previous timer
   - Replace strategy: new toast immediately replaces current
2. Create Toast display component:
   - Absolute position top, below safe area
   - Animated.Value for translateY (slide down from -100 to 0)
   - PanResponder for swipe-up dismiss
   - Colors: error=#F44336, success=#4CAF50, info=#0084FF
   - White text, rounded corners, padding 16, shadow
3. Export `toastRef` (React.createRef) for use outside component tree (e.g., API interceptor)
4. Export `useToast()` hook for use inside components
5. Add `ToastProvider` in App.tsx inside ErrorBoundary, wrapping navigation

**Acceptance test**: `showToast('error', 'Test')` shows red toast at top, auto-dismisses in 3s, swipeable.

---

### Task 5: Replace All Alerts with Toasts (FR-4.8, FR-4.10)
**Priority**: After toast system is built
**Files**: LoginScreen, RegisterScreen, ChatScreen, ContactsScreen, ProfileScreen
**Steps**:
1. In each file, import `useToast` (or `toastRef`)
2. Replace `Alert.alert('Error', msg)` → `showToast('error', msg)`
3. Replace `Alert.alert('Sent', msg)` → `showToast('success', msg)`
4. Replace `Alert.alert('Coming Soon', msg)` → `showToast('info', msg)`
5. KEEP `Alert.alert('Logout', ...)` in ProfileScreen — this is a confirmation dialog
6. Remove unused `Alert` imports where no longer needed

**Detailed replacement map**:
- `LoginScreen.tsx:28` → `showToast('error', ...)`
- `RegisterScreen.tsx:26,30,43` → `showToast('error', ...)`
- `ChatScreen.tsx:231` → `showToast('error', ...)`
- `ContactsScreen.tsx:75` → `showToast('success', 'Friend request sent!')`
- `ContactsScreen.tsx:80,89,98,107` → `showToast('error', ...)`
- `ProfileScreen.tsx:28` → `showToast('error', ...)`
- `ProfileScreen.tsx:104` → `showToast('info', 'Coming soon')`
- `ProfileScreen.tsx:35` → KEEP as Alert (logout confirmation)

**Acceptance test**: Zero `Alert.alert('Error'` or `Alert.alert('Sent'` in codebase. Only `Alert.alert('Logout'` remains.

---

### Task 6: Shimmer Components (FR-3)
**Priority**: After core infra, before screen integration
**Files**: Shimmer.tsx, ConversationSkeleton.tsx, ContactSkeleton.tsx, MessageSkeleton.tsx
**Steps**:
1. Create `Shimmer` wrapper:
   - Accepts `children` (the shapes to animate)
   - Uses `Animated.loop(Animated.sequence([fadeIn, fadeOut]))` with useNativeDriver
   - Opacity oscillates 0.3 → 0.7 → 0.3 over 1.6s (800ms each direction)
2. Create `ConversationSkeleton`:
   - 6 rows, each: circle (56px, gray #E4E6EB) + two rounded rects (60%/40% width, 12px height)
   - Wrapped in Shimmer
3. Create `ContactSkeleton`:
   - 8 rows, each: circle (48px) + one rounded rect (50% width, 14px height)
   - Wrapped in Shimmer
4. Create `MessageSkeleton`:
   - 5 bubbles alternating left/right alignment
   - Rounded rects (60-80% width, 40-60px height) with border radius 20
   - Wrapped in Shimmer

**Acceptance test**: Each skeleton renders with smooth pulsing animation at 60fps.

---

### Task 7: Integrate Skeletons into Screens (FR-3.5, FR-3.6)
**Priority**: After skeleton components exist
**Files**: ConversationsScreen, ContactsScreen, ChatScreen
**Steps**:
1. In each screen, add `isFirstLoad` state (default: true)
2. On first successful data fetch, set `isFirstLoad = false`
3. If `isFirstLoad && data.length === 0`, render the skeleton instead of empty state
4. On pull-to-refresh, do NOT reset `isFirstLoad` (skeleton only shows on mount)
5. ConversationsScreen → ConversationSkeleton
6. ContactsScreen → ContactSkeleton
7. ChatScreen → MessageSkeleton

**Acceptance test**: Navigate to each screen — shimmer shows briefly, then real content appears. Pull-to-refresh does NOT show shimmer.

---

### Task 8: Splash Screen (FR-2)
**Priority**: Last — wraps the whole experience
**Files**: SplashView.tsx, App.tsx, app.json
**Steps**:
1. Configure `app.json` splash: white background, icon asset
2. In App.tsx: call `SplashScreen.preventAutoHideAsync()` before component mounts
3. Create `SplashView` component:
   - White bg, centered: blue circle (72px) → white "L" (36px bold) → "LoZo" text (24px bold, dark)
   - Uses StyleSheet
4. In App.tsx:
   - Track two states: `hydrated` (from auth store) and `minTimeElapsed` (setTimeout 1500ms)
   - When BOTH are true: hide native splash (`SplashScreen.hideAsync()`), fade out SplashView, show app
   - Fade transition: Animated.timing opacity from 1 to 0 over 300ms

**Acceptance test**: App launch shows branded splash for at least 1.5s, then fades to login/conversations.

---

## Dependency Graph

```
Task 1 (Cleanup) ──→ no deps, do first
Task 2 (Icons)   ──→ no deps
Task 3 (Error Boundary) ──→ no deps
Task 4 (Toast System) ──→ no deps
Task 5 (Replace Alerts) ──→ depends on Task 4
Task 6 (Shimmer Components) ──→ no deps
Task 7 (Integrate Skeletons) ──→ depends on Task 6
Task 8 (Splash Screen) ──→ depends on Task 3, Task 4 (ErrorBoundary + Toast must exist in App.tsx)
```

**Parallel opportunities**: Tasks 1, 2, 3, 4, 6 are independent and can be done in any order. Tasks 5, 7, 8 must wait for their dependencies.

---

## Estimated Scope

| Metric | Count |
|--------|-------|
| New files | 7 |
| Modified files | 8 |
| Deleted files | 4 |
| Packages removed | 2 |
| Alert replacements | 12 |
| Tasks | 8 |
