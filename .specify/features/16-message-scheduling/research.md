# Research: Message Scheduling

**Feature**: 16-message-scheduling  
**Date**: 2026-04-01

## Research Topics

### 1. Background Task Execution in Expo

**Decision**: Use `expo-task-manager` with `setInterval` fallback

**Rationale**: 
- `expo-task-manager` provides background fetch capability but has limitations:
  - iOS: Minimum 15-minute intervals, system-controlled timing
  - Android: More reliable but still battery-optimized
  - App must not be force-killed
- Primary approach: Use `setInterval` when app is in foreground (checks every 30 seconds)
- Secondary: Register background task for when app is backgrounded but not killed
- Fallback: Process missed scheduled messages on app open (via outbox queue)

**Alternatives considered**:
1. Push notification trigger (OneSignal) - Rejected: deferred until core works, adds complexity
2. Server-side scheduling - Rejected: violates offline-first principle, requires always-online
3. Local notifications as triggers - Rejected: doesn't actually execute code, just alerts user

### 2. Date/Time Picker for React Native

**Decision**: Use `@react-native-community/datetimepicker`

**Rationale**:
- Native platform pickers (iOS DatePicker, Android DatePickerDialog)
- Widely used, well-maintained
- Works with Expo Go (no native code required)
- Supports date and time modes separately

**Alternatives considered**:
1. Custom picker with ScrollView wheels - Rejected: reinventing the wheel, platform inconsistency
2. expo-date-picker - Does not exist as separate package
3. react-native-modal-datetime-picker - Also uses @react-native-community/datetimepicker under the hood

### 3. Scheduled Messages Storage Schema

**Decision**: Separate `scheduled_messages` table (not reuse `messages` table)

**Rationale**:
- Cleaner separation of concerns
- Different lifecycle: scheduled → pending → sent/canceled vs. pending → sent → delivered → read
- Avoids polluting main messages query with scheduled message filters
- Easier to query "all scheduled for this conversation" without complex WHERE clauses
- When sent: copy to `messages` table, delete from `scheduled_messages`

**Alternatives considered**:
1. Add `scheduled_at` column to `messages` table - Rejected: complicates existing message queries, mixed lifecycles
2. Store in MMKV/AsyncStorage - Rejected: not relational, hard to query by time

### 4. Timer Architecture

**Decision**: Centralized scheduler service with reactive hooks

**Rationale**:
- Single `scheduler.ts` service manages all timers
- Checks due messages every 30 seconds when app is active
- Hooks subscribe to changes via Zustand store or callback
- On app resume: immediate check for any missed scheduled times

**Implementation approach**:
```
App Start → scheduler.start()
  ↓
setInterval (30s) → checkDueMessages()
  ↓
For each due message:
  1. Copy to messages table (as local pending)
  2. Add to outbox
  3. Delete from scheduled_messages
  4. Trigger UI refresh
```

### 5. Edit Lock Mechanism

**Decision**: 30-second lock before scheduled time with "Sending soon" UI state

**Rationale**:
- Prevents race conditions between user edit and send execution
- 30 seconds is long enough to process and short enough to not frustrate users
- Lock is UI-only (query `scheduled_at - now() < 30s`)
- "Sending soon" provides clear feedback

**Implementation**:
- `isLocked(scheduledAt)` → `scheduledAt - Date.now() < 30000`
- UI shows different state when locked (grayed edit button, "Sending soon" badge)

### 6. Timezone Handling

**Decision**: Store as UTC timestamp, display in local time

**Rationale**:
- `Date.now()` and `new Date().toISOString()` are timezone-agnostic
- Compare timestamps in UTC for scheduling logic
- Display formatted in user's local timezone
- If user travels, scheduled messages send at the "new" local time equivalent

**Example**:
- User in UTC+3 schedules for "6:00 PM local" → stored as 15:00 UTC
- User travels to UTC+0 → message sends at 15:00 UTC = 3:00 PM local

## Dependencies to Install

```bash
npx expo install @react-native-community/datetimepicker expo-task-manager
```

## Key Patterns from Existing Codebase

1. **Database access**: Via `getDb()` from `sqlite.ts`, async operations
2. **Message creation**: `insertMessage()` pattern with local_id, then outbox
3. **Outbox queue**: `enqueueOutbox()` → `flush()` on network reconnect
4. **Status tracking**: `localStatusMap` in hooks for UI state, `sync_status` in DB for persistence
5. **Modal pattern**: State-controlled visibility, callbacks for actions
6. **Hook pattern**: Feature hooks return state + handlers, used by screen components
