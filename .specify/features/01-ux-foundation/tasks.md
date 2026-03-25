# Tasks: UX Foundation

**Feature**: 01 — UX Foundation
**Generated**: 2026-03-25
**Total Tasks**: 19
**Phases**: 5

---

## Phase 1: Setup — Package Cleanup

**Goal**: Remove dead NativeWind dependencies and config files before adding anything new.

**Test criteria**: App compiles and starts in Expo Go. Zero `className` references in codebase. `nativewind` and `tailwindcss` not in package.json.

- [X] T001 Verify zero `className` usage remains by grepping `apps/mobile/src/` directory
- [X] T002 Remove `nativewind` and `tailwindcss` from `apps/mobile/package.json`
- [X] T003 Delete NativeWind config files: `apps/mobile/tailwind.config.js`, `apps/mobile/global.css`, `apps/mobile/nativewind-env.d.ts`
- [X] T004 Review `apps/mobile/metro.config.js` — delete if NativeWind-only, otherwise remove NativeWind parts
- [X] T005 Run `npm install` in `apps/mobile/` to clean lockfile and verify app compiles

---

## Phase 2: Foundational — Core Infrastructure Components

**Goal**: Build the 3 infrastructure components (ErrorBoundary, Toast, Shimmer) that all user stories depend on.

**Test criteria**: Each component renders independently. ErrorBoundary catches a thrown error. Toast shows/dismisses correctly. Shimmer animates at 60fps.

### Error Boundary (FR-5)

- [X] T006 [P] Create `apps/mobile/src/shared/components/ErrorBoundary.tsx` — class component with `getDerivedStateFromError`, `componentDidCatch`, fallback UI (Ionicons `warning` icon + "Something went wrong" + "Try Again" button), console.error logging
- [X] T007 Wrap app with ErrorBoundary as outermost wrapper in `apps/mobile/App.tsx`

### Toast System (FR-4)

- [X] T008 [P] Create `apps/mobile/src/shared/components/Toast.tsx` — ToastProvider with replace strategy (single active toast), Animated translateY slide-down/up, PanResponder swipe-up dismiss, 3s auto-dismiss, colors (error=#F44336, success=#4CAF50, info=#0084FF), exported `toastRef` for outside-tree use + `useToast()` hook
- [X] T009 Add ToastProvider inside ErrorBoundary wrapping navigation in `apps/mobile/App.tsx`

### Shimmer Base (FR-3.1)

- [X] T010 [P] Create `apps/mobile/src/shared/components/Shimmer.tsx` — wrapper component using `Animated.loop(Animated.sequence([fadeIn, fadeOut]))` with `useNativeDriver: true`, opacity 0.3→0.7→0.3 over 1.6s cycle

---

## Phase 3: User Stories

### US1 — Tab Navigation (Scenario 2, FR-1)

**Goal**: Tab bar uses Messenger-matching vector icons with proper active/inactive states.

**Test criteria**: All 3 tabs show Ionicons. Active = filled blue #0084FF + fontWeight 600. Inactive = outline gray #8A8D91 + fontWeight 400. Icon size 24px, label 11px.

- [X] T011 [US1] Replace emoji `TabIcon` component with Ionicons in `apps/mobile/src/navigation/index.tsx` — import `Ionicons` from `@expo/vector-icons`, use `chatbubble`/`chatbubble-outline` for Chats, `people`/`people-outline` for Contacts, `person-circle`/`person-circle-outline` for Profile, size 24, active color #0084FF, inactive #8A8D91, label fontSize 11 with fontWeight 600/400

### US2 — Error & Success Feedback (Scenario 4, FR-4.8/4.10)

**Goal**: All Alert.alert feedback calls replaced with toast notifications.

**Test criteria**: Grep for `Alert.alert('Error'` returns zero results. Only `Alert.alert('Logout'` remains in ProfileScreen. Success and info alerts also replaced.

- [X] T012 [US2] Replace Alert.alert calls with showToast in `apps/mobile/src/features/auth/LoginScreen.tsx` — 1 error toast (line ~28), remove Alert import
- [X] T013 [P] [US2] Replace Alert.alert calls with showToast in `apps/mobile/src/features/auth/RegisterScreen.tsx` — 3 error toasts (validation + API), remove Alert import
- [X] T014 [P] [US2] Replace Alert.alert calls with showToast in `apps/mobile/src/features/chat/ChatScreen.tsx` — 1 error toast (send failure), remove Alert import
- [X] T015 [P] [US2] Replace Alert.alert calls with showToast in `apps/mobile/src/features/contacts/ContactsScreen.tsx` — 4 error toasts + 1 success toast ("Friend request sent!"), remove Alert import
- [X] T016 [P] [US2] Replace Alert.alert calls with showToast in `apps/mobile/src/features/profile/ProfileScreen.tsx` — 1 error toast + 1 info toast ("Coming soon"), KEEP Alert.alert('Logout') as confirmation dialog, keep Alert import

### US3 — Loading Feedback (Scenario 3, FR-3.2–3.6)

**Goal**: All list screens show animated shimmer skeletons on first load.

**Test criteria**: Navigate to Chats/Contacts/Chat — shimmer shows briefly then content appears. Pull-to-refresh does NOT trigger shimmer.

- [X] T017 [US3] Create skeleton components in `apps/mobile/src/shared/components/` — `ConversationSkeleton.tsx` (6 rows: circle 56px + 2 rects 60%/40% width), `ContactSkeleton.tsx` (8 rows: circle 48px + 1 rect 50% width), `MessageSkeleton.tsx` (5 alternating left/right bubbles 60-80% width), all wrapped in Shimmer
- [X] T018 [US3] Integrate skeletons into screens — add `isFirstLoad` state to `apps/mobile/src/features/chat/ConversationsScreen.tsx`, `apps/mobile/src/features/contacts/ContactsScreen.tsx`, `apps/mobile/src/features/chat/ChatScreen.tsx`; render skeleton when isFirstLoad && no data; set false after first fetch; do NOT reset on pull-to-refresh

### US4 — App Launch (Scenario 1, FR-2)

**Goal**: Branded splash screen with 1.5s minimum display and smooth fade transition.

**Test criteria**: App launches with blue circle + "L" + "LoZo" text on white bg. Holds for at least 1.5s. Fades smoothly to login or conversations.

- [X] T019 [US4] Create `apps/mobile/src/shared/components/SplashView.tsx` (blue circle 72px, white "L" 36px bold, "LoZo" text 24px dark, white bg) and update `apps/mobile/App.tsx` — call `SplashScreen.preventAutoHideAsync()`, track `hydrated` + `minTimeElapsed` (1.5s setTimeout), when both true: `SplashScreen.hideAsync()` + fade out SplashView with Animated.timing opacity 1→0 over 300ms

---

## Phase 4: Polish & Verification

**Goal**: Final validation that all acceptance criteria pass.

**Test criteria**: All 6 success criteria from spec.md verified.

No additional tasks — verification is manual:
1. Tab bar matches Messenger (US1)
2. Splash shows 1.5s+ with fade (US4)
3. Shimmer on all 3 list screens (US3)
4. Zero error/success Alerts remaining (US2)
5. Error boundary catches thrown errors (Phase 2)
6. nativewind/tailwindcss removed (Phase 1)

---

## Dependencies

```
Phase 1 (T001-T005) ──→ No dependencies, execute first

Phase 2 (T006-T010) ──→ After Phase 1
  T006 (ErrorBoundary) ─┐
  T008 (Toast)          ├──→ All [P] parallelizable
  T010 (Shimmer)        ┘
  T007 (wrap App) ──→ After T006
  T009 (wrap App) ──→ After T008

Phase 3:
  US1 (T011) ──→ After Phase 1 (no infra dependency)
  US2 (T012-T016) ──→ After T009 (Toast in App.tsx)
    T012-T016 all [P] parallelizable (different files)
  US3 (T017-T018) ──→ After T010 (Shimmer component)
    T017 before T018 (create skeletons before integrating)
  US4 (T019) ──→ After T007 + T009 (ErrorBoundary + Toast in App.tsx)
```

## Parallel Execution Opportunities

| Parallel Group | Tasks | Condition |
|----------------|-------|-----------|
| Infra components | T006, T008, T010 | All independent new files |
| Alert replacements | T012, T013, T014, T015, T016 | Different screen files |
| US1 + US3 skeleton creation | T011, T017 | Independent of each other |

## Implementation Strategy

**MVP (minimum to verify foundation)**: Phase 1 + Phase 2 (T001–T010)
- App compiles clean, ErrorBoundary + Toast + Shimmer components exist
- Can be verified without touching any screens

**Incremental delivery**:
1. Phase 1: Cleanup (5 min)
2. Phase 2: Build infra components (core work)
3. US1: Quick visual win — tab icons
4. US2: Replace all alerts — biggest screen touch count
5. US3: Shimmer integration — polish
6. US4: Splash screen — final touch, wraps the experience
