ALTER TABLE "contacts" ADD COLUMN "nickname" varchar(100);--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "is_muted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_color" varchar(7) NOT NULL DEFAULT '#45B7D1';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" varchar(200) DEFAULT 'Hey, I''m using LoZo' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_online" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_seen_at" timestamp DEFAULT now() NOT NULL;