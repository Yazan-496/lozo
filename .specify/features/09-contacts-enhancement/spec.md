# Feature Specification: Contacts Enhancement

**Status**: Draft **Created**: 2026-03-26 **Last Updated**: 2026-03-26
**Author**: Yazan

---

## Overview

Enhance the contacts system to support rich relationship management between
users. Users can view each other's profiles, set custom display names per
relationship, label their relationship type, unfriend, block, and manage
conversation history — mirroring the social controls found in Messenger.

## Problem Statement

Currently contacts are a flat list with no relationship context. Users cannot
customize how a contact appears in their chat list, label the nature of their
relationship, remove a contact, block someone, or delete conversation history.
These are essential social features for a personal messaging app.

## Goals & Objectives

- Let users personalize contact relationships with nicknames and labels
- Give users control over their connections (add, remove, block)
- Give users control over conversation history (delete for me, delete for
  everyone)
- Surface contact profiles with relevant social context (bio, online status)

## User Scenarios & Testing

### US1 — View Contact Profile

1. User opens Contacts tab and taps any contact row
2. A profile screen opens showing: avatar, display name, username, bio,
   online/last-seen status, and current relationship label
3. User can see the nickname they set for this contact and the nickname they set
   for themselves in this relationship

### US2 — Edit Nicknames

1. From the contact profile screen, user taps "Edit nickname" for the contact
2. User types a new name; this name replaces the contact's username in the
   user's own chat list and message headers
3. User taps "Change my nickname" to set how they appear in this contact's chat
   list
4. Both changes are saved per-relationship (not global to either account)

### US3 — Set Relationship Type

1. From the contact profile screen, user taps the current relationship label
   ("Friend" or "Lover")
2. A picker appears with both options
3. User selects the new label; it is saved immediately and shown on the profile
4. RelationShip appears in chat screen also as icon

### US4 — Remove Contact

1. From the contact profile screen, user taps "Remove contact"
2. Confirmation dialog appears
3. On confirm: the contact is removed from the contacts list; the conversation
   remains accessible from chat history

### US5 — Block Contact

1. From the contact profile screen, user taps "Block"
2. Confirmation dialog appears
3. On confirm: the contact is blocked — they are removed from the contacts list,
   cannot send messages or new contact requests to the user, and the user is
   hidden from their contacts

### US6 — Delete Conversation for Me

1. From the contact profile screen (or a long-press menu), user chooses "Delete
   conversation for me"
2. Confirmation dialog appears
3. On confirm: all local message history for this conversation is cleared; the
   other party is unaffected

### US7 — Delete Conversation for Everyone

1. From the contact profile screen (or a long-press menu), user chooses "Delete
   conversation for everyone"
2. Confirmation dialog appears
3. On confirm: the conversation is deleted for both parties; neither can see
   prior messages

## Functional Requirements

### Contact Profile View

- FR-01: Tapping a contact row navigates to a dedicated ContactProfileScreen
- FR-02: Profile screen displays: avatar, display name (nickname if set, else
  username), username handle, bio, online/last-seen status, relationship label
- FR-03: Profile screen shows the nickname the current user has set for this
  contact (editable)
- FR-04: Profile screen shows the nickname the current user has set for
  themselves in this relationship (editable)

### Nickname Management

- FR-05: User can set a custom nickname for any contact; this nickname overrides
  the contact's username everywhere in the user's own UI (chat list, message
  headers, search results)
- FR-06: User can set a "my nickname" visible only within this one relationship;
  it is how the user appears in the contact's chat list and message headers
- FR-07: Nicknames are stored per-relationship (contact pair), not globally on
  either account
- FR-08: Clearing a nickname reverts to the user's actual username

### Relationship Types

- FR-09: Every contact relationship has a type: "Friend" (default) or "Lover"
- FR-10: User can change the relationship type at any time from the contact
  profile screen
- FR-11: Relationship type is stored per-relationship and visible only to both
  parties in that relationship

### Remove Contact

- FR-12: User can remove (unfriend) a contact from the contact profile screen
- FR-13: Removal deletes the contact record from both sides; neither appears in
  the other's contacts list
- FR-14: Existing conversation is NOT deleted on removal — it remains accessible
  from chat history

### Block Contact

- FR-15: User can block a contact from the contact profile screen
- FR-16: A blocked user cannot send messages to the blocker
- FR-17: A blocked user cannot send contact requests to the blocker
- FR-18: The blocked user still sees the blocker in their contacts but cannot
  send messages or contact requests to them
- FR-19: Blocked users are tracked in a separate blocked list accessible from
  Settings (out of scope to build the blocked list UI in this feature — just the
  block action)

### Delete Conversation

- FR-20: "Delete for me" clears all messages in the conversation from the
  current user's local storage and server record; the other party retains their
  copy
- FR-21: "Delete for everyone" removes all messages from both parties' records;
  neither user can see the conversation history afterwards; either participant
  can trigger this at any time with no time restriction
- FR-22: Both delete options require a confirmation dialog before executing
- FR-23: After "delete for me", the conversation row is hidden from the Chats
  tab; it reappears if the contact sends a new message

### Server-Side Requirements

- FR-24: Contacts table gains a `myNickname` column (nullable text): the
  nickname the current user sets for themselves in this relationship
- FR-25: Contacts table gains a `relationshipType` column (enum: 'friend' |
  'lover', default 'friend')
- FR-26: A block record is created when a user blocks another; both parties'
  contact records are removed
- FR-27: A DELETE /conversations/:id?scope=me endpoint clears the conversation
  for the requesting user only
- FR-28: A DELETE /conversations/:id?scope=everyone endpoint clears the
  conversation for both parties (requires the requester to be a participant)

## Non-Functional Requirements

- NF-01: Nickname changes reflect across the UI immediately without requiring an
  app restart or screen reload
- NF-02: Block and remove operations complete within 2 seconds under normal
  network conditions
- NF-03: Delete conversation (for everyone) is irreversible — the UI must make
  this clear in the confirmation dialog
- NF-04: Blocked user data must not be exposed via any API endpoint to the
  blocker or the blocked user after the block is applied

## Success Criteria

- Users can set and clear a contact nickname; the custom name appears
  consistently everywhere that contact is referenced in the user's UI
- Users can set their own nickname within a relationship; it persists and is
  visible to the other party
- Relationship type (Friend/Lover) can be changed at any time and is reflected
  immediately on the profile screen
- Removing a contact takes the contact off the list for both parties while
  leaving the conversation accessible
- Blocking a contact prevents further messages and contact requests from the
  blocked party
- Deleting a conversation for everyone removes it from both parties' visible
  history within 2 seconds

## Key Entities

### ContactRelationship (updated)

| Field            | Type                                 | Notes                                       |
| ---------------- | ------------------------------------ | ------------------------------------------- |
| id               | uuid                                 | PK                                          |
| userId           | uuid                                 | FK → users                                  |
| contactId        | uuid                                 | FK → users                                  |
| nickname         | text (nullable)                      | What userId calls contactId                 |
| myNickname       | text (nullable)                      | What userId wants to be called by contactId |
| relationshipType | enum('friend','lover')               | Default: 'friend'                           |
| status           | enum('pending','accepted','blocked') | 'blocked' replaces accepted                 |
| createdAt        | timestamp                            |                                             |
| updatedAt        | timestamp                            |                                             |

### Block (derived from ContactRelationship status)

- No separate table needed — `status = 'blocked'` on the ContactRelationship
  record, combined with removing the inverse record

## Assumptions

- A1: The existing contacts table already has a `nickname` field (server
  confirmed); `myNickname` and `relationshipType` are additions
- A2: A user can only have one relationship record per pair (no duplicate
  contacts)
- A3: "Lover" label is cosmetic — it carries no behavioral difference from
  "Friend" in terms of permissions or visibility rules
- A4: Blocked users are not notified they have been blocked; the block is
  one-sided (only the blocker's contact record is removed)
- A5: The blocked list UI (viewing/unblocking) is out of scope for this feature
- A6: Delete-for-everyone is only available to conversation participants
- A7: After remove contact, the conversation remains visible in the Chats tab
  (consistent with WhatsApp behavior)

## Out of Scope

- Viewing who has blocked you
- Unblock functionality UI (blocked list management screen)
- Mutual friend indicators
- Contact request management (accept/decline) — already handled in
  NotificationsScreen
- Read receipts for deleted messages
- Export/backup of conversation history before deletion

## Dependencies

- Backend API must support PATCH /contacts/:id for nickname, myNickname, and
  relationshipType updates
- Backend API must support DELETE /contacts/:id for removal (both sides)
- Backend API must support POST /contacts/:id/block
- Backend API must support DELETE /conversations/:id with scope parameter
- ContactsScreen and ConversationsScreen must consume nickname from the contact
  relationship when displaying names

## Clarifications

### Session 2026-03-26

- Q: After "delete for me", should the conversation row disappear from the Chats
  tab or remain visible but empty? → A: Hide the row from the Chats tab; it
  reappears when the contact sends a new message
- Q: When blocking, does the blocked person's contact record of the blocker also
  get removed (mutual) or only the blocker's side? → A: One-sided — only removed
  from the blocker's side; the blocked person still sees the contact but cannot
  message or send requests
- Q: "Delete for everyone" — is it restricted by time or role (who started the
  conversation)? → A: Either participant can delete for everyone at any time, no
  time restriction

## Risks

- R1: "Delete for everyone" is irreversible — mitigated by mandatory
  confirmation dialog with explicit warning text
- R2: Race condition if both users delete for everyone simultaneously — server
  deduplicates by checking existence before deletion
- R3: Nickname changes must propagate to all open screens displaying that
  contact's name — requires state invalidation strategy
