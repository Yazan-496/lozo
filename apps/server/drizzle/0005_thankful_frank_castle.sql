CREATE TYPE "public"."story_media_type" AS ENUM('photo', 'video');--> statement-breakpoint
CREATE TABLE "stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"media_url" varchar(500) NOT NULL,
	"media_type" "story_media_type" NOT NULL,
	"media_duration" integer,
	"thumbnail_url" varchar(500),
	"caption" varchar(200),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" uuid NOT NULL,
	"viewer_id" uuid NOT NULL,
	"viewed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_views" ADD CONSTRAINT "story_views_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_views" ADD CONSTRAINT "story_views_viewer_id_users_id_fk" FOREIGN KEY ("viewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_stories_user" ON "stories" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_stories_expiry" ON "stories" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_story_view" ON "story_views" USING btree ("story_id","viewer_id");--> statement-breakpoint
CREATE INDEX "idx_story_views_story" ON "story_views" USING btree ("story_id","viewed_at");