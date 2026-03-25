# Research: UX Foundation

**Date**: 2026-03-25

---

## R1: @expo/vector-icons Ionicons availability in Expo SDK 54

**Decision**: Use Ionicons from `@expo/vector-icons` (bundled with Expo)
**Rationale**: @expo/vector-icons ships with every Expo project — no install needed. Ionicons includes `chatbubble`, `chatbubble-outline`, `people`, `people-outline`, `person-circle`, `person-circle-outline` which match Messenger's tab icons closely.
**Alternatives considered**:
- MaterialCommunityIcons — has similar icons but Ionicons are closer to iOS/Messenger style
- Custom SVG icons — unnecessary effort when Ionicons suffices
- react-native-vector-icons (standalone) — requires native linking, not Expo Go compatible

## R2: expo-splash-screen API for controlled splash

**Decision**: Use `expo-splash-screen` with `SplashScreen.preventAutoHideAsync()` + `SplashScreen.hideAsync()`
**Rationale**: Expo's splash screen API allows holding the native splash until the app is ready. Combined with a custom React splash view and `setTimeout(1500)`, this gives the branded experience with minimum 1.5s display.
**Alternatives considered**:
- expo-app-loading (deprecated in SDK 49+) — replaced by expo-splash-screen
- Custom animated view only — would show a white flash before the React tree mounts

## R3: Shimmer animation approach without external libraries

**Decision**: Use React Native `Animated` API with `Animated.loop` + `Animated.timing` to pulse opacity
**Rationale**: Opacity animation supports `useNativeDriver: true` which ensures 60fps. No need for react-native-reanimated (already installed but overkill for this). Pattern: loop an Animated.Value between 0.3 and 1.0 with 800ms duration.
**Alternatives considered**:
- react-native-shimmer-placeholder — external package, may not work in Expo Go
- react-native-reanimated — already installed but API is more complex for a simple opacity loop
- Lottie animation — overkill for placeholder shapes

## R4: Toast system implementation approach

**Decision**: Custom-built toast using React Context + Animated API
**Rationale**: The requirements are simple (single toast, replace strategy, slide animation, swipe dismiss). A custom implementation avoids adding dependencies and gives full control over styling to match Messenger. Pattern: ToastProvider with ref-based `showToast()` + `Animated.timing` for translateY.
**Alternatives considered**:
- react-native-toast-message — popular but adds a dependency; our needs are simple enough for custom
- react-native-flash-message — same concern; plus less control over replace-strategy behavior
- expo-notifications for local alerts — wrong abstraction, meant for push notifications

## R5: ErrorBoundary with class component in TypeScript

**Decision**: Single class component exception to the "functional components only" rule
**Rationale**: React does not support error boundaries via hooks (`componentDidCatch` and `getDerivedStateFromError` are class-only APIs). This is an accepted exception per React's own documentation. Constitution Principle 3 says "functional components and hooks only" but this is the one case where React mandates a class.
**Alternatives considered**:
- react-error-boundary package — adds dependency for a 20-line component
- Wrap in a function component that renders the class internally — unnecessary indirection

## R6: NativeWind cleanup safety

**Decision**: Remove nativewind, tailwindcss, and all config files after verifying zero `className` usage
**Rationale**: All screens were rewritten from NativeWind to StyleSheet in the previous session. Grep for `className` confirms no remaining usage. Safe to remove.
**Alternatives considered**:
- Keep packages but unused — bloats node_modules and confuses contributors
- Gradual removal — unnecessary since all screens are already converted

## R7: Alert.alert calls inventory

**Decision**: 13 Alert.alert calls found across 5 files. 12 will become toasts (8 error, 1 success, 3 validation). 1 remains as-is (logout confirmation — action dialog with Cancel/Confirm).
**Rationale**: Logout requires a confirmation dialog with two buttons, which is the correct use of Alert. All others are informational feedback.
**Files affected**:
- `LoginScreen.tsx` — 1 error toast
- `RegisterScreen.tsx` — 3 error toasts (2 validation, 1 API)
- `ChatScreen.tsx` — 1 error toast
- `ContactsScreen.tsx` — 4 error toasts + 1 success toast
- `ProfileScreen.tsx` — 1 error toast + 1 info toast ("Coming Soon") + 1 keep (logout dialog)
