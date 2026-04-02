# Quickstart: Message Scheduling

**Feature**: 16-message-scheduling  
**Date**: 2026-04-01

## Prerequisites

1. LoZo mobile app running in Expo Go
2. SQLite database initialized
3. At least one conversation with another user

## Install New Dependencies

```bash
cd apps/mobile
npx expo install @react-native-community/datetimepicker expo-task-manager
```

## File Overview

| File | Purpose |
|------|---------|
| `shared/db/sqlite.ts` | Add scheduled_messages table to migration |
| `shared/db/scheduled.db.ts` | CRUD operations for scheduled messages |
| `shared/services/scheduler.ts` | Background timer + due message processing |
| `features/chat/scheduling/SchedulePickerModal.tsx` | Date/time picker UI |
| `features/chat/scheduling/ScheduledMessageBubble.tsx` | Clock icon + timestamp in chat |
| `features/chat/scheduling/ScheduledMessageMenu.tsx` | Edit/Reschedule/Cancel options |
| `features/chat/scheduling/useScheduledMessages.ts` | Hook for scheduling logic |
| `features/chat/components/SendButton.tsx` | Extracted button with long-press |
| `features/chat/ChatScreen.tsx` | Integration point |

## Quick Test Flow

### 1. Schedule a Message
1. Open a conversation
2. Type "Test scheduled message"
3. Long-press the send button (hold for 500ms)
4. Tap "Schedule" in the popup menu
5. Select a date/time 2 minutes from now
6. Tap "Confirm"
7. Verify: Message appears in chat with clock icon and "Scheduled for [time]"

### 2. Edit Scheduled Message
1. Tap on a scheduled message
2. Tap "Edit"
3. Modify the text
4. Tap "Save"
5. Verify: Content updated, clock icon still visible

### 3. Reschedule Message
1. Tap on a scheduled message
2. Tap "Reschedule"
3. Pick a new time
4. Tap "Confirm"
5. Verify: Timestamp updated

### 4. Cancel Scheduled Message
1. Tap on a scheduled message
2. Tap "Cancel"
3. Confirm cancellation
4. Verify: Message removed from chat

### 5. Automatic Send (Happy Path)
1. Schedule a message for 1 minute from now
2. Keep app open
3. Wait for scheduled time
4. Verify: Clock icon disappears, message shows as sent/delivered

### 6. Offline Handling
1. Schedule a message for 1 minute from now
2. Turn off network (airplane mode)
3. Wait for scheduled time
4. Verify: Message shows "pending" (queued in outbox)
5. Turn network back on
6. Verify: Message sends and shows delivered

### 7. Edit Lock (30s before send)
1. Schedule a message for 1 minute from now
2. Wait until 25 seconds before scheduled time
3. Tap on the message
4. Verify: "Sending soon" indicator visible, Edit/Reschedule buttons disabled

## Environment Variables

None required. All configuration is hardcoded:
- Check interval: 30 seconds
- Edit lock window: 30 seconds before scheduled time
- Max scheduling horizon: 30 days
- Max scheduled per conversation: 100

## Troubleshooting

| Issue | Check |
|-------|-------|
| Schedule option not appearing | Ensure long-press (500ms+), not tap |
| Scheduled message not showing | Check SQLite query, verify conversation_id match |
| Message not sending at scheduled time | Verify app is open, check scheduler service started |
| Edit still allowed when locked | Check time comparison (UTC vs local) |

## API Reference

```typescript
// Schedule a new message
await scheduleMessage(conversationId, content, scheduledAt);

// Get all scheduled for a conversation
const scheduled = await getScheduledMessages(conversationId);

// Update scheduled message
await updateScheduledMessage(id, { content?, scheduledAt? });

// Cancel scheduled message
await cancelScheduledMessage(id);

// Check and send due messages (called by scheduler)
await processDueMessages();
```
