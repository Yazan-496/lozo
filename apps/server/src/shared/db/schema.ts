import { pgTable, uuid, varchar, timestamp, pgEnum, uniqueIndex, boolean, text } from 'drizzle-orm/pg-core';

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
  isMuted: boolean('is_muted').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  // One relationship per pair of users
  uniqueIndex('unique_contact_pair').on(table.requesterId, table.addresseeId),
]);
