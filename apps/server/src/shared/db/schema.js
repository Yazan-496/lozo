"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageStatuses = exports.messageStatusEnum = exports.messageReactions = exports.messageDeletes = exports.messages = exports.messageTypeEnum = exports.conversations = exports.blockedUsers = exports.contacts = exports.contactStatusEnum = exports.users = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
// Users table — starting point, will expand per module
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    username: (0, pg_core_1.varchar)('username', { length: 50 }).notNull().unique(),
    password: (0, pg_core_1.varchar)('password', { length: 255 }).notNull(),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 100 }).notNull(),
    avatarUrl: (0, pg_core_1.varchar)('avatar_url', { length: 500 }),
    avatarColor: (0, pg_core_1.varchar)('avatar_color', { length: 7 }).notNull(), // hex like #4A90D9
    bio: (0, pg_core_1.varchar)('bio', { length: 200 }).notNull().default("Hey, I'm using LoZo"),
    isOnline: (0, pg_core_1.boolean)('is_online').notNull().default(false),
    lastSeenAt: (0, pg_core_1.timestamp)('last_seen_at').defaultNow().notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.contactStatusEnum = (0, pg_core_1.pgEnum)('contact_status', ['pending', 'accepted', 'blocked']);
// Contacts/relationships — users must connect before chatting
exports.contacts = (0, pg_core_1.pgTable)('contacts', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    requesterId: (0, pg_core_1.uuid)('requester_id').notNull().references(function () { return exports.users.id; }),
    addresseeId: (0, pg_core_1.uuid)('addressee_id').notNull().references(function () { return exports.users.id; }),
    status: (0, exports.contactStatusEnum)('status').notNull().default('pending'),
    nickname: (0, pg_core_1.varchar)('nickname', { length: 100 }),
    myNickname: (0, pg_core_1.varchar)('my_nickname', { length: 100 }),
    relationshipType: (0, pg_core_1.varchar)('relationship_type', { length: 10 }).notNull().default('friend'),
    isMuted: (0, pg_core_1.boolean)('is_muted').notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, function (table) { return [
    // One relationship per pair of users
    (0, pg_core_1.uniqueIndex)('unique_contact_pair').on(table.requesterId, table.addresseeId),
]; });
// Track user blocks — one-sided, independent of contact status
exports.blockedUsers = (0, pg_core_1.pgTable)('blocked_users', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    blockerId: (0, pg_core_1.uuid)('blocker_id').notNull().references(function () { return exports.users.id; }),
    blockedId: (0, pg_core_1.uuid)('blocked_id').notNull().references(function () { return exports.users.id; }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, function (table) { return [
    (0, pg_core_1.uniqueIndex)('unique_block_pair').on(table.blockerId, table.blockedId),
]; });
// 1:1 conversation between two users
exports.conversations = (0, pg_core_1.pgTable)('conversations', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    participantOneId: (0, pg_core_1.uuid)('participant_one_id').notNull().references(function () { return exports.users.id; }),
    participantTwoId: (0, pg_core_1.uuid)('participant_two_id').notNull().references(function () { return exports.users.id; }),
    lastMessageId: (0, pg_core_1.uuid)('last_message_id'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, function (table) { return [
    (0, pg_core_1.uniqueIndex)('unique_conversation_pair').on(table.participantOneId, table.participantTwoId),
]; });
exports.messageTypeEnum = (0, pg_core_1.pgEnum)('message_type', ['text', 'image', 'voice', 'file']);
exports.messages = (0, pg_core_1.pgTable)('messages', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    conversationId: (0, pg_core_1.uuid)('conversation_id').notNull().references(function () { return exports.conversations.id; }),
    senderId: (0, pg_core_1.uuid)('sender_id').notNull().references(function () { return exports.users.id; }),
    type: (0, exports.messageTypeEnum)('type').notNull().default('text'),
    content: (0, pg_core_1.text)('content'), // text content or caption
    mediaUrl: (0, pg_core_1.varchar)('media_url', { length: 500 }),
    mediaName: (0, pg_core_1.varchar)('media_name', { length: 255 }), // original filename
    mediaSize: (0, pg_core_1.integer)('media_size'), // bytes
    mediaDuration: (0, pg_core_1.integer)('media_duration'), // seconds (for voice notes)
    replyToId: (0, pg_core_1.uuid)('reply_to_id'), // references messages.id (self-ref added below)
    forwardedFromId: (0, pg_core_1.uuid)('forwarded_from_id'), // original message id
    isForwarded: (0, pg_core_1.boolean)('is_forwarded').notNull().default(false),
    editedAt: (0, pg_core_1.timestamp)('edited_at'),
    deletedForEveryone: (0, pg_core_1.boolean)('deleted_for_everyone').notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, function (table) { return [
    (0, pg_core_1.index)('idx_messages_conversation').on(table.conversationId, table.createdAt),
    (0, pg_core_1.index)('idx_messages_sender').on(table.senderId),
]; });
// Track which users deleted a message "for me"
exports.messageDeletes = (0, pg_core_1.pgTable)('message_deletes', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    messageId: (0, pg_core_1.uuid)('message_id').notNull().references(function () { return exports.messages.id; }),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(function () { return exports.users.id; }),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at').defaultNow().notNull(),
}, function (table) { return [
    (0, pg_core_1.uniqueIndex)('unique_message_delete').on(table.messageId, table.userId),
]; });
// Emoji reactions on messages
exports.messageReactions = (0, pg_core_1.pgTable)('message_reactions', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    messageId: (0, pg_core_1.uuid)('message_id').notNull().references(function () { return exports.messages.id; }),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(function () { return exports.users.id; }),
    emoji: (0, pg_core_1.varchar)('emoji', { length: 20 }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, function (table) { return [
    // One reaction type per user per message
    (0, pg_core_1.uniqueIndex)('unique_user_reaction').on(table.messageId, table.userId),
]; });
exports.messageStatusEnum = (0, pg_core_1.pgEnum)('message_status', ['sent', 'delivered', 'read']);
// Per-user delivery/read status for each message
exports.messageStatuses = (0, pg_core_1.pgTable)('message_statuses', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    messageId: (0, pg_core_1.uuid)('message_id').notNull().references(function () { return exports.messages.id; }),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(function () { return exports.users.id; }), // the recipient
    status: (0, exports.messageStatusEnum)('status').notNull().default('sent'),
    deliveredAt: (0, pg_core_1.timestamp)('delivered_at'),
    readAt: (0, pg_core_1.timestamp)('read_at'),
}, function (table) { return [
    (0, pg_core_1.uniqueIndex)('unique_message_status').on(table.messageId, table.userId),
]; });
