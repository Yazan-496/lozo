ALTER TABLE "messages" ADD COLUMN "story_reply_id" uuid;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "story_thumbnail_url" varchar(500);--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_story_reply_id_stories_id_fk" FOREIGN KEY ("story_reply_id") REFERENCES "public"."stories"("id") ON DELETE no action ON UPDATE no action;