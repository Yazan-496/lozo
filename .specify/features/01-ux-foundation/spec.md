# Feature Specification: UX Foundation

**Status**: Approved
**Created**: 2026-03-25
**Last Updated**: 2026-03-25 (clarified)
**Spec**: 01 of 12

---

## Overview

Replace the prototype-quality UX with a professional foundation: proper vector icons in the tab bar, branded splash screen, animated shimmer loading skeletons, a toast notification system, a global error boundary, and removal of unused packages. This spec touches no business logic — it purely upgrades the visual and feedback layer so all subsequent features are built on a polished base.

## Problem Statement

The app currently uses emoji (💬👥👤) for tab icons, has no splash screen, shows no loading feedback (screens flash empty then populate), errors display as system Alert dialogs (blocking and ugly), and unused packages (nativewind, tailwindcss) bloat the install. This makes the app feel like a prototype.

## Clarifications

### Session 2026-03-25

- Q: Toast stacking — what happens when multiple toasts fire at once? → A: Replace strategy — only the latest toast shows, dismissing any current one
- Q: Should success actions (profile updated, request sent) also use toasts? → A: Yes — all success Alert.alert calls become green success toasts
- Q: Should splash screen hold for a minimum duration if hydration is instant? → A: Yes — minimum 1.5 seconds before dismissing

---

## Goals & Objectives

1. Tab bar MUST look identical to Messenger (vector icons, active/inactive colors)
2. App launch MUST show a branded splash screen before any content
3. Every list screen MUST show animated shimmer placeholders while loading
4. Every error MUST display as a non-blocking top toast, never an Alert
5. Unhandled errors MUST be caught by a boundary and show a recovery screen
6. Unused packages MUST be removed

---

## User Scenarios & Testing

### Scenario 1: App Launch

**As a** user opening LoZo,
**I want to** see a branded splash screen with the logo,
**So that** I know the app is loading and it feels professional.

**Acceptance criteria:**
- White background with centered LoZo logo circle (blue circle, white "L")
- "LoZo" text below the logo
- Splash displays for at least 1.5 seconds or until auth hydration completes (whichever is longer)
- Transitions smoothly to login or conversations screen

### Scenario 2: Tab Navigation

**As a** user navigating between tabs,
**I want to** see proper icons that look like Messenger,
**So that** the app feels familiar and professional.

**Acceptance criteria:**
- "Chats" tab: chat bubble icon (like Messenger's filled/outline bubble)
- "Contacts" tab: people/group icon (two person silhouettes)
- "Profile" tab: single person circle icon
- Active tab: filled icon + blue color (#0084FF) + bold label
- Inactive tab: outline icon + gray color (#8A8D91) + regular label
- Icons are vector-based (not emoji, not PNG)

### Scenario 3: Loading Feedback

**As a** user navigating to any list screen,
**I want to** see animated placeholders while data loads,
**So that** I know content is coming and don't see an empty screen.

**Acceptance criteria:**
- Conversations screen: shimmer rows (circle + 2 lines per row, 6-8 rows)
- Contacts screen: shimmer rows (circle + 1 line per row)
- Chat screen: shimmer bubbles (alternating left/right, 4-5 bubbles)
- Shimmer animation: gray shapes pulsing lighter and darker (like Facebook)
- Shimmer disappears immediately when real data renders
- Shimmer shows only on first load (not on pull-to-refresh)

### Scenario 4: Error Handling

**As a** user encountering an error,
**I want to** see a brief toast message at the top,
**So that** I know what happened without being interrupted.

**Acceptance criteria:**
- Toast slides down from top of screen
- Background color: red for errors, green for success, blue for info
- Shows message text + optional icon
- Auto-dismisses after 3 seconds
- Can be swiped up to dismiss early
- Does NOT block any UI interaction
- Replaces ALL current Alert.alert error AND success calls

### Scenario 5: Crash Recovery

**As a** user experiencing an app crash,
**I want to** see a friendly error screen instead of a white screen,
**So that** I can retry without restarting the app.

**Acceptance criteria:**
- Error boundary catches unhandled JS errors
- Shows: "Something went wrong" message + "Try Again" button
- "Try Again" resets the error and re-renders the app
- Error details are logged to console (not shown to user)

---

## Functional Requirements

### FR-1: Tab Bar Icons

- FR-1.1: Replace emoji TabIcon component with vector icons from @expo/vector-icons (Ionicons set)
- FR-1.2: "Chats" tab MUST use `chatbubble` (filled) / `chatbubble-outline` icons
- FR-1.3: "Contacts" tab MUST use `people` (filled) / `people-outline` icons
- FR-1.4: "Profile" tab MUST use `person-circle` (filled) / `person-circle-outline` icons
- FR-1.5: Active state: filled icon, color #0084FF, label font weight 600
- FR-1.6: Inactive state: outline icon, color #8A8D91, label font weight 400
- FR-1.7: Icon size MUST be 24px, label font size 11px

### FR-2: Splash Screen

- FR-2.1: Configure Expo splash screen with white background
- FR-2.2: Display centered blue circle (72px) with white "L" letter (36px bold)
- FR-2.3: Display "LoZo" text below circle in dark color, 24px bold
- FR-2.4: Splash MUST remain visible for a minimum of 1.5 seconds or until auth store hydration completes (whichever is longer)
- FR-2.5: Transition from splash to main app MUST be smooth (fade out)

### FR-3: Shimmer Loading Skeletons

- FR-3.1: Create a reusable Shimmer component that animates opacity between 0.3 and 0.7
- FR-3.2: Create ConversationSkeleton: avatar circle (56px) + two text lines (60% and 40% width)
- FR-3.3: Create ContactSkeleton: avatar circle (48px) + one text line (50% width)
- FR-3.4: Create MessageSkeleton: alternating left/right rounded rectangles
- FR-3.5: Each list screen MUST show skeleton on initial load (isLoading state true)
- FR-3.6: Skeleton MUST NOT show on pull-to-refresh (only initial mount)
- FR-3.7: Animation MUST use React Native Animated API (no external animation library required)

### FR-4: Toast Notification System

- FR-4.1: Create a ToastProvider that wraps the app and manages a single active toast (replace strategy — new toast dismisses current)
- FR-4.2: Create a showToast function accessible from anywhere (context or global ref)
- FR-4.3: Toast types: error (red bg), success (green bg), info (blue bg)
- FR-4.4: Toast MUST appear at top of screen, below status bar
- FR-4.5: Toast MUST animate in (slide down) and out (slide up)
- FR-4.6: Toast MUST auto-dismiss after 3 seconds
- FR-4.7: Toast MUST be swipe-up dismissible
- FR-4.8: Replace ALL Alert.alert('Error', ...) calls across the app with showToast('error', ...)
- FR-4.10: Replace ALL Alert.alert('Success', ...) and Alert.alert('Sent', ...) calls with showToast('success', ...)
- FR-4.9: Toast MUST NOT block underlying UI interactions

### FR-5: Error Boundary

- FR-5.1: Create an ErrorBoundary component that catches unhandled JS errors
- FR-5.2: Fallback UI: centered layout with warning icon, "Something went wrong" title, "Try Again" button
- FR-5.3: "Try Again" MUST reset error state and re-render children
- FR-5.4: ErrorBoundary MUST wrap the entire app in App.tsx
- FR-5.5: Caught errors MUST be logged to console.error

### FR-6: Package Cleanup

- FR-6.1: Remove `nativewind` from package.json
- FR-6.2: Remove `tailwindcss` from package.json
- FR-6.3: Delete `tailwind.config.js` if it exists
- FR-6.4: Delete `global.css` if it exists
- FR-6.5: Delete `nativewind-env.d.ts` if it exists
- FR-6.6: Remove any NativeWind-related config from `metro.config.js`
- FR-6.7: Verify app still compiles and runs after removal

---

## Non-Functional Requirements

- **Performance**: Shimmer animation MUST run at 60fps without jank
- **Bundle size**: Package cleanup MUST reduce node_modules size
- **Accessibility**: Tab icons MUST have accessible labels; toast MUST be announced by screen readers

---

## Success Criteria

1. Tab bar is visually indistinguishable from Messenger's tab bar
2. App launch shows branded splash and transitions smoothly to content
3. All 3 list screens show shimmer feedback during first load
4. Zero Alert.alert calls remain in the codebase for error or success display (except logout confirmation which is an action dialog)
5. An intentionally thrown error is caught by the boundary and shows recovery UI
6. nativewind and tailwindcss are no longer in package.json

---

## Key Entities

None — this spec is UI/UX infrastructure only.

---

## Assumptions

1. @expo/vector-icons (Ionicons) is bundled with Expo and needs no install
2. React Native Animated API is sufficient for shimmer (no need for Reanimated)
3. Toast system is custom-built (no external package needed for this scope)
4. ErrorBoundary uses React class component (only way to catch render errors)
5. Splash screen uses expo-splash-screen API for control

---

## Out of Scope

- Haptic feedback (Spec #07)
- Screen transition animations (handled per-spec as screens are built)
- Dark mode / theme switching
- Accessibility audit beyond basic requirements

---

## Dependencies

- @expo/vector-icons (bundled with Expo — no install)
- expo-splash-screen (likely already installed with Expo)
- No new packages required

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Ionicons don't match Messenger icons closely enough | Tab bar looks off | Use the closest match; Ionicons has bubble/people/person icons |
| Shimmer with Animated API may be janky | Poor loading UX | Use useNativeDriver: true for opacity animations |
| Removing NativeWind breaks something | App crashes | Verify no className usage remains before removal |
