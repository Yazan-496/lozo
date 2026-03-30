import { pgTable, uuid, varchar, timestamp, pgEnum, uniqueIndex, boolean, text, integer, index } from 'drizzle-orm/pg-core';

// Users table — starting point, will expand per module
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  avatarColor: varchar('avatar_color', { length: 7 }).notNull(), // hex like #4A90D9
  bio: varchar('bio', { length: 200 }).notNull().default("Hey, I'm using LoZo"),
  isOnline: boolean('is_online').notNull().default(false),
  lastSeenAt: timestamp('last_seen_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const contactStatusEnum = pgEnum('contact_status', ['pending', 'accepted', 'blocked']);

// Contacts/relationships — users must connect before chatting
export const contacts = pgTable('contacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  requesterId: uuid('requester_id').notNull().references(() => users.id),
  addresseeId: uuid('addressee_id').notNull().references(() => users.id),
  status: contactStatusEnum('status').notNull().default('pending'),
  nickname: varchar('nickname', { length: 100 }),
  myNickname: varchar('my_nickname', { length: 100 }),
  relationshipType: varchar('relationship_type', { length: 10 }).notNull().default('friend'),
  isMuted: boolean('is_muted').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  // One relationship per pair of users
  uniqueIndex('unique_contact_pair').on(table.requesterId, table.addresseeId),
]);

// Track user blocks — one-sided, independent of contact status
export const blockedUsers = pgTable('blocked_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  blockerId: uuid('blocker_id').notNull().references(() => users.id),
  blockedId: uuid('blocked_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('unique_block_pair').on(table.blockerId, table.blockedId),
]);

// 1:1 conversation between two users
export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  participantOneId: uuid('participant_one_id').notNull().references(() => users.id),
  participantTwoId: uuid('participant_two_id').notNull().references(() => users.id),
  lastMessageId: uuid('last_message_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('unique_conversation_pair').on(table.participantOneId, table.participantTwoId),
]);

export const messageTypeEnum = pgEnum('message_type', ['text', 'image', 'voice', 'file']);

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id),
  senderId: uuid('sender_id').notNull().references(() => users.id),
  type: messageTypeEnum('type').notNull().default('text'),
  content: text('content'), // text content or caption
  mediaUrl: varchar('media_url', { length: 500 }),
  mediaName: varchar('media_name', { length: 255 }), // original filename
  mediaSize: integer('media_size'), // bytes
  mediaDuration: integer('media_duration'), // seconds (for voice notes)
  replyToId: uuid('reply_to_id'), // references messages.id (self-ref added below)
  forwardedFromId: uuid('forwarded_from_id'), // original message id
  isForwarded: boolean('is_forwarded').notNull().default(false),
  editedAt: timestamp('edited_at'),
  deletedForEveryone: boolean('deleted_for_everyone').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_messages_conversation').on(table.conversationId, table.createdAt),
  index('idx_messages_sender').on(table.senderId),
]);

// Track which users deleted a message "for me"
export const messageDeletes = pgTable('message_deletes', {
  id: uuid('id').defaultRandom().primaryKey(),
  messageId: uuid('message_id').notNull().references(() => messages.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  deletedAt: timestamp('deleted_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('unique_message_delete').on(table.messageId, table.userId),
]);

// Emoji reactions on messages
export const messageReactions = pgTable('message_reactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  messageId: uuid('message_id').notNull().references(() => messages.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  emoji: varchar('emoji', { length: 20 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  // One reaction type per user per message
  uniqueIndex('unique_user_reaction').on(table.messageId, table.userId),
]);

export const messageStatusEnum = pgEnum('message_status', ['sent', 'delivered', 'read']);

// Per-user delivery/read status for each message
export const messageStatuses = pgTable('message_statuses', {
  id: uuid('id').defaultRandom().primaryKey(),
  messageId: uuid('message_id').notNull().references(() => messages.id),
  userId: uuid('user_id').notNull().references(() => users.id), // the recipient
  status: messageStatusEnum('status').notNull().default('sent'),
  deliveredAt: timestamp('delivered_at'),
  readAt: timestamp('read_at'),
}, (table) => [
  uniqueIndex('unique_message_status').on(table.messageId, table.userId),
]);
