ALTER TABLE "booths" RENAME COLUMN "installed_at" TO "last_sync";--> statement-breakpoint
ALTER TABLE "booths" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "booths" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "booths" ALTER COLUMN "serial_number" SET DEFAULT NULL;--> statement-breakpoint
ALTER TABLE "booths" ALTER COLUMN "serial_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "booths" ALTER COLUMN "last_sync" SET DEFAULT NULL;--> statement-breakpoint
ALTER TABLE "booths" ADD CONSTRAINT "booths_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "booths" ADD CONSTRAINT "booths_updated_by_users_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL;