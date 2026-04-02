# Feature Specification: Message Scheduling

**Feature Branch**: `16-message-scheduling`  
**Created**: 2026-04-01  
**Status**: Draft  
**Input**: User description: "Message Scheduling Allow users to schedule messages to send at a future date/time. Requirements: - Trigger: long-press the send button → "Schedule" option appears - Date/time picker modal (date, hour, minute) - Show scheduled messages in ChatScreen with clock icon + scheduled timestamp - Edit or cancel scheduled messages before send time - Storage: local SQLite scheduled_messages table - Background execution: expo-task-manager or expo-background-fetch - If app is killed when message is due: - Show upfront warning when scheduling: "App must be running to send scheduled messages" - Queue in outbox, send automatically when app next opens - If offline when scheduled: queue in outbox, send when back online Tech: expo-task-manager (free, built into Expo)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Schedule Message for Future Delivery (Priority: P1)

As a user, I want to schedule a message to be sent at a specific future time, so that I can compose messages now and have them delivered at the optimal time (e.g., birthday wishes, reminders, time-zone appropriate messages).

**Why this priority**: This is the core functionality of the feature. Without the ability to schedule a message, the feature provides no value. This enables the primary use case of deferred message delivery.

**Independent Test**: Can be fully tested by long-pressing the send button, selecting a future date/time, confirming the schedule, and verifying the message appears in the chat with a clock icon and scheduled timestamp. Delivers immediate value by allowing message composition ahead of time.

**Acceptance Scenarios**:

1. **Given** I have typed a message in a conversation, **When** I long-press the send button, **Then** a "Schedule" option appears alongside the normal send option
2. **Given** I select the "Schedule" option, **When** the date/time picker opens, **Then** I can select a future date, hour, and minute for message delivery
3. **Given** I have selected a future date/time, **When** I confirm the schedule, **Then** the message appears in the chat with a clock icon and displays the scheduled delivery time
4. **Given** I have scheduled a message, **When** the scheduled time arrives and the app is running, **Then** the message is automatically sent to the conversation
5. **Given** I attempt to schedule a message, **When** I select a past date/time, **Then** the system prevents scheduling and shows an error message

---

### User Story 2 - Manage Scheduled Messages (Priority: P2)

As a user, I want to edit or cancel scheduled messages before they are sent, so that I can correct mistakes, update content, or change my mind about sending a message.

**Why this priority**: Essential for user control and error correction. Without this, users would be locked into scheduled messages with no recourse, leading to anxiety and potential embarrassment from unwanted messages being sent.

**Independent Test**: Can be tested by scheduling a message, then tapping on it to reveal edit/cancel options, modifying the content or time, or canceling entirely. Delivers value by providing user control over scheduled content.

**Acceptance Scenarios**:

1. **Given** I have a scheduled message in the chat, **When** I tap on the scheduled message, **Then** I see options to Edit, Reschedule, or Cancel the message
2. **Given** I select "Edit" on a scheduled message, **When** I modify the message content and save, **Then** the scheduled message is updated with the new content
3. **Given** I select "Reschedule" on a scheduled message, **When** I choose a new date/time and confirm, **Then** the message's scheduled time is updated
4. **Given** I select "Cancel" on a scheduled message, **When** I confirm the cancellation, **Then** the scheduled message is removed from the chat and will not be sent
5. **Given** I have edited a scheduled message, **When** the scheduled time arrives, **Then** the updated message content is sent (not the original)

---

### User Story 3 - Offline and Background Handling (Priority: P3)

As a user, I want scheduled messages to be queued when the app is offline or closed, so that my messages are still delivered once connectivity is restored or the app is reopened, even if I'm not actively using the app at the scheduled time.

**Why this priority**: Improves reliability but is not core to the MVP. The feature can function without this if users understand they must be online and have the app running at the scheduled time. This priority level allows delivering value sooner while acknowledging reliability limitations.

**Independent Test**: Can be tested by scheduling a message, turning off network connectivity or closing the app, waiting for the scheduled time to pass, then reconnecting or reopening the app to verify the message is queued and sent. Delivers value by improving message delivery success rate.

**Acceptance Scenarios**:

1. **Given** I have scheduled a message, **When** the scheduled time arrives but the app is offline, **Then** the message is queued in the outbox and will be sent when connectivity is restored
2. **Given** I have scheduled a message, **When** the scheduled time arrives but the app is not running, **Then** the message is queued and sent automatically when the app next opens
3. **Given** I am scheduling a message, **When** I confirm the schedule, **Then** I see a warning that "App must be running to send scheduled messages" if background execution is not available
4. **Given** the app has queued scheduled messages in the outbox, **When** the app comes back online, **Then** all queued scheduled messages are sent in chronological order
5. **Given** a scheduled message failed to send due to offline status, **When** I open the app, **Then** I see a notification that the scheduled message was queued and is being sent

---

### Edge Cases

- **Multiple same-time messages**: Messages scheduled for the exact same time are sent in creation order (first scheduled = first sent)
- **Timezone changes**: System sends based on device's current timezone at scheduled time (user traveling may experience shifted delivery)
- **Conversation deleted**: Scheduled messages are retained and resume if conversation is recreated with same contact
- **Recipient blocks sender**: Message delivery will fail with standard send failure handling (retry/discard)
- **App updated/reinstalled**: Scheduled messages are lost (consistent with local data policy)
- **User removed from group**: Message delivery will fail with standard send failure handling
- **Device time manually changed**: System uses device time; manual changes may cause early/late delivery
- **Edit near send time**: Editing is locked 30 seconds before scheduled time; "Sending soon" indicator shown

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a "Schedule" option when the user long-presses the send button in any conversation (text messages only; media/voice scheduling is out of scope for MVP)
- **FR-002**: System MUST display a date/time picker modal that allows selection of date, hour, and minute for message delivery, limited to 30 days in the future
- **FR-003**: System MUST prevent users from scheduling messages for past dates/times or more than 30 days in the future, and display an appropriate error message
- **FR-004**: System MUST display scheduled messages in the ChatScreen with a distinct clock icon to differentiate them from sent messages
- **FR-005**: System MUST show the scheduled delivery timestamp on each scheduled message in the chat
- **FR-006**: System MUST allow users to tap on a scheduled message to view Edit, Reschedule, and Cancel options, except when the message is locked for sending
- **FR-007**: System MUST allow users to edit the content of a scheduled message before it is sent, locking edits 30 seconds before scheduled time with a "Sending soon" indicator
- **FR-008**: System MUST allow users to change the scheduled delivery time of a message before it is sent
- **FR-009**: System MUST allow users to cancel a scheduled message, removing it from the chat and preventing delivery
- **FR-010**: System MUST automatically send scheduled messages at their designated time when the app is running and online
- **FR-011**: System MUST store scheduled messages locally in a persistent storage mechanism
- **FR-012**: System MUST queue scheduled messages in the outbox if they are due but the app is offline
- **FR-013**: System MUST automatically send queued scheduled messages when the app regains connectivity
- **FR-014**: System MUST queue scheduled messages that are due when the app is not running and send them when the app next opens
- **FR-015**: System MUST display a warning message when a user schedules a message, informing them that "App must be running to send scheduled messages"
- **FR-016**: System MUST handle timezone changes by sending messages based on the device's current timezone at the scheduled time
- **FR-017**: System MUST support scheduling multiple messages for different times in the same conversation; messages scheduled for the same time are sent in creation order (first scheduled = first sent)
- **FR-018**: System MUST retain scheduled messages when a conversation is deleted; if the conversation is recreated with the same contact, scheduled messages will resume and be delivered at their scheduled time
- **FR-019**: System MUST send scheduled messages as normal messages without any scheduling indicator visible to the recipient (appears as regular sent message)

### Key Entities

- **Scheduled Message**: Represents a message that has been composed and set to be delivered at a future time. Contains message content, recipient conversation ID, scheduled delivery timestamp, creation timestamp, message type, and scheduling status (pending, queued, sent, canceled).
- **Conversation**: The chat context where scheduled messages will be delivered. Each scheduled message is associated with exactly one conversation.
- **Outbox Entry**: Represents a queued message waiting to be sent. Scheduled messages that miss their delivery time (due to app being offline/closed) are moved to the outbox for delivery when possible.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can schedule a message in under 30 seconds from long-pressing send to confirming the schedule
- **SC-002**: Scheduled messages are delivered within 60 seconds of their scheduled time when the app is running and online
- **SC-003**: 95% of scheduled messages are successfully delivered within 5 minutes of their scheduled time (accounting for offline/closed app scenarios)
- **SC-004**: Users can successfully cancel or edit a scheduled message 100% of the time before it is sent
- **SC-005**: The clock icon and scheduled timestamp are clearly visible and distinguishable from sent messages without requiring user interaction
- **SC-006**: Scheduled messages queued in the outbox are successfully sent within 60 seconds of the app regaining connectivity or being reopened
- **SC-007**: Users report high satisfaction with the ability to schedule messages for time-sensitive communication (target: 80% positive feedback)

## Assumptions

- The app will use local device time for scheduling, not server time, to ensure messages are sent at times relevant to the user's current location
- Users understand that the app must be installed and not force-closed for background delivery to work (passive background, not active notifications)
- The existing message sending infrastructure (outbox, delivery confirmation) will be reused for scheduled message delivery
- Scheduled messages will be treated as regular messages once sent (they will have the same delivery, read receipts, and status tracking)
- Users will schedule messages primarily for time-sensitive communication (birthdays, reminders, timezone-appropriate messages)
- The feature will support scheduling up to 30 days in advance (clarified from initial 90 days assumption)
- Scheduled messages will be stored locally only (not synced to server until sent) to maintain the existing offline-first architecture
- Editing a scheduled message will preserve its original scheduling metadata (only content/time changes, not creation timestamp)
- If a user uninstalls and reinstalls the app, scheduled messages will be lost (consistent with other local data)
- Maximum of 100 scheduled messages per conversation to prevent UI/storage issues
- Only text messages can be scheduled in MVP; media and voice message scheduling may be added in future iterations
- Recipients see scheduled messages as normal messages with no indication they were scheduled
